import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Save,
  Database,
  Mail,
  Shield,
  Brain,
  Clock,
  Eye,
  EyeOff,
  AlertCircle,
  Key,
  Lock,
  Smartphone,
  CreditCard,
  Bitcoin,
} from "lucide-react";

interface SettingsResponse {
  keys: string[];
  settings: Record<string, string>;
}

const SECTIONS = [
  {
    id: "database",
    title: "Database",
    icon: Database,
    description: "PostgreSQL connection",
    keys: ["DATABASE_URL"],
  },
  {
    id: "auth",
    title: "Authentication",
    icon: Shield,
    description: "Session & admin credentials",
    keys: ["SESSION_SECRET", "ADMIN_EMAIL", "AI_ADMIN_PASSWORD"],
  },
  {
    id: "email",
    title: "Email (SMTP)",
    icon: Mail,
    description: "Password resets & notifications",
    keys: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
  },
  {
    id: "ai",
    title: "AI / OpenAI",
    icon: Brain,
    description: "Route optimization & analytics",
    keys: ["AI_INTEGRATIONS_OPENAI_API_KEY", "AI_INTEGRATIONS_OPENAI_BASE_URL"],
  },
  {
    id: "jobs",
    title: "Scheduled Jobs",
    icon: Clock,
    description: "Cron backup authentication",
    keys: ["CRON_SECRET"],
  },
  {
    id: "mpesa",
    title: "M-Pesa",
    icon: Smartphone,
    description: "Safaricom Daraja STK Push",
    keys: [
      "MPESA_CONSUMER_KEY",
      "MPESA_CONSUMER_SECRET",
      "MPESA_SHORTCODE",
      "MPESA_PASSKEY",
      "MPESA_CALLBACK_URL",
      "MPESA_ENVIRONMENT",
    ],
  },
  {
    id: "flutterwave",
    title: "Flutterwave",
    icon: CreditCard,
    description: "Card, USSD & bank payments",
    keys: [
      "FLUTTERWAVE_PUBLIC_KEY",
      "FLUTTERWAVE_SECRET_KEY",
      "FLUTTERWAVE_ENCRYPTION_KEY",
      "FLUTTERWAVE_WEBHOOK_SECRET",
    ],
  },
  {
    id: "crypto",
    title: "Crypto",
    icon: Bitcoin,
    description: "Coinbase Commerce payments",
    keys: ["COINBASE_COMMERCE_API_KEY", "COINBASE_COMMERCE_WEBHOOK_SECRET"],
  },
  {
    id: "security",
    title: "Security",
    icon: Lock,
    description: "CORS allowed origins",
    keys: ["CORS_ORIGIN"],
  },
];

const SECRET_KEYS = new Set([
  "DATABASE_URL",
  "SESSION_SECRET",
  "AI_ADMIN_PASSWORD",
  "SMTP_PASS",
  "AI_INTEGRATIONS_OPENAI_API_KEY",
  "CRON_SECRET",
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_PASSKEY",
  "FLUTTERWAVE_SECRET_KEY",
  "FLUTTERWAVE_ENCRYPTION_KEY",
  "FLUTTERWAVE_WEBHOOK_SECRET",
  "COINBASE_COMMERCE_API_KEY",
  "COINBASE_COMMERCE_WEBHOOK_SECRET",
]);

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);

  const { data, isLoading, isError } = useQuery<SettingsResponse>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.settings) {
      setValues(data.settings);
      setDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setDirty(false);
      toast({
        title: "Settings saved",
        description: result.applied?.length
          ? `Updated: ${result.applied.join(", ")}`
          : "No changes detected",
      });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const toggleVisibility = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load settings. Make sure you have admin access.
          </AlertDescription>
        </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Settings"
          description="Configure environment variables and API keys"
        >
          <Button
            onClick={() => saveMutation.mutate(values)}
            disabled={!dirty || saveMutation.isPending}
            className="shrink-0"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </PageHeader>

        {dirty && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unsaved changes</AlertTitle>
            <AlertDescription>
              You have modified settings. Click &quot;Save Changes&quot; to apply.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        ) : (
          <Tabs defaultValue={SECTIONS[0].id} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 sm:grid-cols-5 lg:grid-cols-9">
              {SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="flex items-center gap-2"
                >
                  <section.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{section.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {SECTIONS.map((section) => (
              <TabsContent key={section.id} value={section.id} className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <section.icon className="h-5 w-5" />
                      {section.title}
                    </CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.keys.map((key) => {
                      const isSecret = SECRET_KEYS.has(key);
                      const show = showSecrets[key];
                      const val = values[key] || "";
                      const isMasked = val.startsWith("****");
                      const isSet = val !== "" && val !== "****";

                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={key} className="font-mono text-xs">
                              {key}
                            </Label>
                            {val && val !== "" && (
                              <Badge
                                variant={isMasked ? "secondary" : "default"}
                                className="text-[10px] h-5"
                              >
                                {isMasked ? "hidden" : isSet ? "configured" : "empty"}
                              </Badge>
                            )}
                          </div>
                          <div className="relative">
                            {isSecret && (
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => toggleVisibility(key)}
                              >
                                {show ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <Input
                              id={key}
                              type={isSecret && !show ? "password" : "text"}
                              value={val}
                              onChange={(e) => handleChange(key, e.target.value)}
                              placeholder={getPlaceholder(key)}
                              className="pr-10 font-mono text-sm"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{getHint(key)}</p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 p-6">
            <Key className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How secrets are handled</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>
                  Secrets are masked with <code className="rounded bg-muted px-1">****</code> —
                  paste a new value to replace.
                </li>
                <li>Leaving a masked field unchanged will keep the existing value.</li>
                <li>
                  Settings are applied to the running process and written to{" "}
                  <code className="rounded bg-muted px-1">.env</code>.
                </li>
                <li>
                  A server restart may be needed for some settings (e.g. DATABASE_URL,
                  SESSION_SECRET).
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function getPlaceholder(key: string): string {
  const map: Record<string, string> = {
    DATABASE_URL: "postgresql://user:pass@host:5432/dbname",
    SESSION_SECRET: "a-random-64-char-string",
    ADMIN_EMAIL: "admin@example.com",
    AI_ADMIN_PASSWORD: "strong-admin-password",
    CRON_SECRET: "random-cron-secret",
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "587",
    SMTP_USER: "your-email@gmail.com",
    SMTP_PASS: "app-password",
    SMTP_FROM: "noreply@yourdomain.com",
    AI_INTEGRATIONS_OPENAI_API_KEY: "sk-...",
    AI_INTEGRATIONS_OPENAI_BASE_URL: "https://api.openai.com/v1",
    MPESA_CONSUMER_KEY: "Your Daraja consumer key",
    MPESA_CONSUMER_SECRET: "Your Daraja consumer secret",
    MPESA_SHORTCODE: "174379",
    MPESA_PASSKEY: "Your Daraja passkey",
    MPESA_CALLBACK_URL: "https://yourdomain.com/api/payments/mpesa/callback",
    MPESA_ENVIRONMENT: "sandbox",
    FLUTTERWAVE_PUBLIC_KEY: "FLWPUBK-...",
    FLUTTERWAVE_SECRET_KEY: "FLWSECK-...",
    FLUTTERWAVE_ENCRYPTION_KEY: "Your encryption key",
    FLUTTERWAVE_WEBHOOK_SECRET: "Your webhook secret hash",
    COINBASE_COMMERCE_API_KEY: "Your Coinbase Commerce API key",
    COINBASE_COMMERCE_WEBHOOK_SECRET: "Your webhook shared secret",
    CORS_ORIGIN: "https://yourdomain.com",
  };
  return map[key] || "";
}

function getHint(key: string): string {
  const map: Record<string, string> = {
    DATABASE_URL:
      "PostgreSQL connection string. Required for production data persistence.",
    SESSION_SECRET: "Used to sign session cookies. Must be a long random string.",
    ADMIN_EMAIL:
      "Default admin account email. Created on startup if AI_ADMIN_PASSWORD is set.",
    AI_ADMIN_PASSWORD:
      "Password for the default admin account. Set this to auto-create the admin user.",
    CRON_SECRET: "Bearer token for the /api/backup/cron endpoint (Vercel Cron).",
    SMTP_HOST: "SMTP server hostname for sending emails.",
    SMTP_PORT: "SMTP port (usually 587 for TLS, 465 for SSL).",
    SMTP_USER: "SMTP authentication username (often your email address).",
    SMTP_PASS: "SMTP authentication password or app-specific password.",
    SMTP_FROM:
      "The 'From' address shown on outgoing emails. Defaults to SMTP_USER.",
    AI_INTEGRATIONS_OPENAI_API_KEY:
      "OpenAI API key for route optimization and demand forecasting.",
    AI_INTEGRATIONS_OPENAI_BASE_URL:
      "Custom base URL for OpenAI-compatible APIs (leave empty for default).",
    MPESA_CONSUMER_KEY:
      "Consumer key from your Safaricom Daraja developer portal app.",
    MPESA_CONSUMER_SECRET:
      "Consumer secret from your Safaricom Daraja developer portal app.",
    MPESA_SHORTCODE:
      "Your M-Pesa business short code (till/paybill number). Use 174379 for sandbox.",
    MPESA_PASSKEY:
      "Lipa Na M-Pesa passkey from Daraja. Used to generate STK Push passwords.",
    MPESA_CALLBACK_URL:
      "Public URL where Safaricom will send payment confirmations. Must be HTTPS.",
    MPESA_ENVIRONMENT:
      "'sandbox' for testing, 'production' for live transactions.",
    FLUTTERWAVE_PUBLIC_KEY:
      "Public key from your Flutterwave dashboard. Used on the client side.",
    FLUTTERWAVE_SECRET_KEY:
      "Secret key from your Flutterwave dashboard. Never expose this client-side.",
    FLUTTERWAVE_ENCRYPTION_KEY:
      "Encryption key from Flutterwave for payload encryption.",
    FLUTTERWAVE_WEBHOOK_SECRET:
      "Webhook secret hash for verifying Flutterwave webhook signatures.",
    COINBASE_COMMERCE_API_KEY:
      "API key from Coinbase Commerce dashboard for creating charges.",
    COINBASE_COMMERCE_WEBHOOK_SECRET:
      "Shared secret for verifying Coinbase Commerce webhook signatures.",
    CORS_ORIGIN:
      "Allowed origin(s) for cross-origin requests. Use your frontend domain.",
  };
  return map[key] || "";
}
