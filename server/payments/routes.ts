/**
 * Payment Gateway Routes
 *
 * Registers initiation + callback/webhook routes for:
 *   1. M-Pesa STK Push
 *   2. Flutterwave Standard
 *   3. Coinbase Commerce (crypto)
 *
 * Plus a /api/payments/gateway-status endpoint so the UI knows which
 * gateways are configured (no secrets are exposed).
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import rateLimit from "express-rate-limit";

// Gateway modules
import {
  isMpesaConfigured,
  initiateSTKPush,
  parseSTKCallback,
} from "./mpesa";
import {
  isFlutterwaveConfigured,
  getFlutterwavePublicKey,
  initiateFlutterwavePayment,
  verifyFlutterwaveTransaction,
  verifyFlutterwaveWebhook,
} from "./flutterwave";
import {
  isCryptoConfigured,
  createCryptoCharge,
  verifyCoinbaseWebhook,
  mapCoinbaseEventToStatus,
  convertKesToUsd,
} from "./crypto";

// ============ Rate limiter for payment initiation ============
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "Too many payment requests, slow down" },
});

// ============ Registration ============

export function registerPaymentRoutes(app: Express): void {

  // ---------- Gateway status (safe for client) ----------
  app.get("/api/payments/gateway-status", isAuthenticated, (_req: Request, res: Response) => {
    res.json({
      mpesa: isMpesaConfigured(),
      flutterwave: isFlutterwaveConfigured(),
      crypto: isCryptoConfigured(),
      flutterwavePublicKey: isFlutterwaveConfigured() ? getFlutterwavePublicKey() : null,
    });
  });

  // ===============================================
  // M-PESA STK PUSH
  // ===============================================

  app.post("/api/payments/mpesa/initiate", isAuthenticated, paymentLimiter, async (req: Request, res: Response) => {
    try {
      if (!isMpesaConfigured()) {
        return res.status(503).json({ error: "M-Pesa is not configured on this server" });
      }

      const { paymentId, phone, amount, orderNumber } = req.body;
      if (!phone || !amount || !orderNumber) {
        return res.status(400).json({ error: "phone, amount and orderNumber are required" });
      }

      const result = await initiateSTKPush({
        phone,
        amount: Number(amount),
        accountReference: orderNumber,
        description: "Order Payment",
      });

      // persist the checkout request ID on the payment record
      if (paymentId) {
        await storage.updatePayment(paymentId, {
          status: "processing",
          mpesaReference: result.CheckoutRequestID,
          gatewayResponse: result,
        });
      }

      res.json({
        success: true,
        checkoutRequestId: result.CheckoutRequestID,
        customerMessage: result.CustomerMessage,
      });
    } catch (err: any) {
      console.error("M-Pesa STK Push error:", err.message);
      res.status(500).json({ error: err.message || "M-Pesa STK Push failed" });
    }
  });

  // M-Pesa callback (called by Safaricom servers — no auth required)
  app.post("/api/payments/mpesa/callback", async (req: Request, res: Response) => {
    try {
      const result = parseSTKCallback(req.body);
      console.log(`[M-Pesa Callback] CheckoutRequestID=${result.checkoutRequestId} ResultCode=${result.resultCode}`);

      // Find payment by mpesaReference (CheckoutRequestID) and update
      const allPayments = await storage.getAllPayments();
      const payment = allPayments.find(
        (p: any) => p.mpesaReference === result.checkoutRequestId
      );

      if (payment) {
        await storage.updatePayment(payment.id, {
          status: result.success ? "confirmed" : "failed",
          mpesaReceiptNumber: result.mpesaReceiptNumber || null,
          phone: result.phoneNumber ? String(result.phoneNumber) : payment.phone,
          gatewayResponse: result,
        });
      }

      // Always respond 200 to Safaricom
      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    } catch (err: any) {
      console.error("M-Pesa callback error:", err.message);
      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }
  });

  // ===============================================
  // FLUTTERWAVE
  // ===============================================

  app.post("/api/payments/flutterwave/initiate", isAuthenticated, paymentLimiter, async (req: Request, res: Response) => {
    try {
      if (!isFlutterwaveConfigured()) {
        return res.status(503).json({ error: "Flutterwave is not configured on this server" });
      }

      const { paymentId, amount, currency, customerEmail, customerPhone, customerName, orderNumber } = req.body;
      if (!amount || !paymentId) {
        return res.status(400).json({ error: "paymentId and amount are required" });
      }

      const host = `${req.protocol}://${req.get("host")}`;
      const result = await initiateFlutterwavePayment({
        txRef: paymentId,
        amount: Number(amount),
        currency: currency || "KES",
        redirectUrl: `${host}/payments?flw_status=completed&payment_id=${paymentId}`,
        customerEmail: customerEmail || "customer@veew.co.ke",
        customerPhone,
        customerName,
        title: `Order ${orderNumber || ""}`,
        description: `Payment for order ${orderNumber || paymentId}`,
      });

      await storage.updatePayment(paymentId, {
        status: "processing",
        flutterwaveRef: paymentId,
        gatewayResponse: result,
      });

      res.json({ success: true, paymentLink: result.data.link });
    } catch (err: any) {
      console.error("Flutterwave init error:", err.message);
      res.status(500).json({ error: err.message || "Flutterwave payment failed" });
    }
  });

  // Flutterwave webhook
  app.post("/api/payments/flutterwave/webhook", async (req: Request, res: Response) => {
    try {
      const hash = req.headers["verifi-hash"] as string | undefined;
      if (!verifyFlutterwaveWebhook(hash)) {
        return res.status(401).json({ error: "Invalid webhook signature" });
      }

      const event = req.body;
      if (event.event === "charge.completed" && event.data) {
        const txRef = event.data.tx_ref;
        const txId = event.data.id;
        if (txRef) {
          // Verify the transaction server-side
          const verification = await verifyFlutterwaveTransaction(txId);
          const isSuccess = verification.data.status === "successful";

          await storage.updatePayment(txRef, {
            status: isSuccess ? "confirmed" : "failed",
            flutterwaveTxId: String(txId),
            flutterwaveRef: verification.data.flw_ref,
            gatewayResponse: verification.data,
          });
        }
      }

      res.status(200).json({ status: "ok" });
    } catch (err: any) {
      console.error("Flutterwave webhook error:", err.message);
      res.status(200).json({ status: "ok" }); // always 200 to avoid retries
    }
  });

  // Client-side verification after redirect
  app.post("/api/payments/flutterwave/verify", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { transactionId, paymentId } = req.body;
      if (!transactionId) return res.status(400).json({ error: "transactionId required" });

      const verification = await verifyFlutterwaveTransaction(transactionId);
      const isSuccess = verification.data.status === "successful";

      if (paymentId) {
        await storage.updatePayment(paymentId, {
          status: isSuccess ? "confirmed" : "failed",
          flutterwaveTxId: String(transactionId),
          flutterwaveRef: verification.data.flw_ref,
          gatewayResponse: verification.data,
        });
      }

      res.json({ success: isSuccess, data: verification.data });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Verification failed" });
    }
  });

  // ===============================================
  // CRYPTO (Coinbase Commerce)
  // ===============================================

  app.post("/api/payments/crypto/initiate", isAuthenticated, paymentLimiter, async (req: Request, res: Response) => {
    try {
      if (!isCryptoConfigured()) {
        return res.status(503).json({ error: "Crypto payments are not configured on this server" });
      }

      const { paymentId, orderId, orderNumber, amountKes, customerName, customerEmail } = req.body;
      if (!amountKes || !paymentId || !orderId) {
        return res.status(400).json({ error: "paymentId, orderId and amountKes are required" });
      }

      const host = `${req.protocol}://${req.get("host")}`;
      const charge = await createCryptoCharge({
        paymentId,
        orderId,
        orderNumber: orderNumber || orderId.slice(0, 8),
        amountKes: Number(amountKes),
        customerName,
        customerEmail,
        redirectUrl: `${host}/payments?crypto_status=completed&payment_id=${paymentId}`,
        cancelUrl: `${host}/payments?crypto_status=cancelled&payment_id=${paymentId}`,
      });

      await storage.updatePayment(paymentId, {
        status: "processing",
        cryptoAddress: JSON.stringify(charge.addresses),
        cryptoAmountUsd: convertKesToUsd(Number(amountKes)),
        gatewayResponse: charge,
      });

      res.json({
        success: true,
        hostedUrl: charge.hostedUrl,
        chargeCode: charge.code,
        chargeId: charge.id,
        addresses: charge.addresses,
        expiresAt: charge.expiresAt,
        usdAmount: convertKesToUsd(Number(amountKes)),
      });
    } catch (err: any) {
      console.error("Crypto charge error:", err.message);
      res.status(500).json({ error: err.message || "Crypto payment failed" });
    }
  });

  // Coinbase Commerce webhook
  app.post("/api/payments/crypto/webhook", async (req: Request, res: Response) => {
    try {
      const signature = req.headers["x-cc-webhook-signature"] as string | undefined;
      const rawBody = JSON.stringify(req.body);

      if (!verifyCoinbaseWebhook(rawBody, signature)) {
        return res.status(401).json({ error: "Invalid webhook signature" });
      }

      const event = req.body.event;
      if (event && event.data?.metadata?.payment_id) {
        const paymentId = event.data.metadata.payment_id;
        const newStatus = mapCoinbaseEventToStatus(event.type);

        const updates: Record<string, unknown> = {
          status: newStatus,
          gatewayResponse: event.data,
        };

        if (event.data.payments?.[0]?.transaction_id) {
          updates.cryptoTxHash = event.data.payments[0].transaction_id;
          updates.cryptoNetwork = event.data.payments[0].network || null;
        }

        await storage.updatePayment(paymentId, updates as Parameters<typeof storage.updatePayment>[1]);
      }

      res.status(200).json({ status: "ok" });
    } catch (err: any) {
      console.error("Crypto webhook error:", err.message);
      res.status(200).json({ status: "ok" });
    }
  });
}
