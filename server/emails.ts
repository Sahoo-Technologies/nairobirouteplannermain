import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

export function initializeEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("SMTP credentials not configured. Password reset emails will not be sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  console.log("Email transporter initialized");
  return transporter;
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<boolean> {
  if (!transporter) {
    console.error("Email transporter not configured");
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Veew Distributors - Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your Veew Distributors account.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Veew Distributors - Route Optimization System
          </p>
        </div>
      `,
      text: `
        Password Reset Request
        
        You requested a password reset for your Veew Distributors account.
        
        Click this link to reset your password (expires in 1 hour):
        ${resetUrl}
        
        If you didn't request this reset, you can safely ignore this email.
        
        Veew Distributors - Route Optimization System
      `,
    });

    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return transporter !== null;
}
