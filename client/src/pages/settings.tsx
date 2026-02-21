import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Settings, Save, Database, Mail, Shield, Brain,
  Clock, Eye, EyeOff, AlertCircle, CheckCircle2, Key
} from "lucide-react";

interface SettingsResponse {
  keys: string[];
  settings: Record<string, string>;
}

const SECTIONS = [
  {
    title: "Database",
    icon: Database,
    description: "PostgreSQL connection string",
    keys: ["DATABASE_URL"],
  },
  {
    title: "Authentication",
    icon: Shield,
    description: "Session secret, default admin credentials",
    keys: ["SESSION_SECRET", "ADMIN_EMAIL", "AI_ADMIN_PASSWORD"],
  },
  {
    title: "Email (SMTP)",
    icon: Mail,
    description: "Outgoing email for password resets & notifications",
    keys: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
  },
  {
    title: "AI / OpenAI",
    icon: Brain,
    description: "OpenAI API key for route optimization & analytics",
    keys: ["AI_INTEGRATIONS_OPENAI_API_KEY", "AI_INTEGRATIONS_OPENAI_BASE_URL"],
  },
  {
    title: "Scheduled Jobs",
    icon: Clock,
    description: "Cron secret for automated backups",
    keys: ["CRON_SECRET"],
  },
  {
    title: "Security",
    icon: Key,
    description: "CORS allowed origins (comma-separated)",
    keys: ["CORS_ORIGIN"],
  },
];

const SECRET_KEYS = new Set([
  "DATABASE_URL", "SESSION_SECRET", "AI_ADMIN_PASSWORD",
  "SMTP_PASS", "AI_INTEGRATIONS_OPENAI_API_KEY", "CRON_SECRET",
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
      <div className="flex flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load settings. Make sure you have admin access.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure environment variables and API keys. Changes are applied immediately and persisted to <code className="text-xs bg-muted px-1 rounded">.env</code>.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate(values)}
          disabled={!dirty || saveMutation.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {dirty && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unsaved changes</AlertTitle>
          <AlertDescription>You have modified settings. Click "Save Changes" to apply.</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          Loading settings...
        </div>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
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
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={key} className="font-mono text-xs">
                          {key}
                        </Label>
                        {val && val !== "" && (
                          <Badge variant={isMasked ? "secondary" : "default"} className="text-[10px] h-4">
                            {isMasked ? "set (hidden)" : isSet ? "configured" : "empty"}
                          </Badge>
                        )}
                      </div>
                      <div className="relative">
                        {isSecret && (
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleVisibility(key)}
                          >
                            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          ))}

          <Card className="border-dashed">
            <CardContent className="flex items-start gap-3 p-4">
              <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">How secrets are handled</p>
                <ul className="mt-1 list-disc pl-4 space-y-1">
                  <li>Secrets are masked with <code className="bg-muted px-1 rounded">****</code> — paste a new value to replace.</li>
                  <li>Leaving a masked field unchanged will keep the existing value.</li>
                  <li>Settings are applied to the running process and written to <code className="bg-muted px-1 rounded">.env</code>.</li>
                  <li>A server restart may be needed for some settings (e.g. DATABASE_URL, SESSION_SECRET).</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
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
  };
  return map[key] || "";
}

function getHint(key: string): string {
  const map: Record<string, string> = {
    DATABASE_URL: "PostgreSQL connection string. Required for production data persistence.",
    SESSION_SECRET: "Used to sign session cookies. Must be a long random string.",
    ADMIN_EMAIL: "Default admin account email. Created on startup if AI_ADMIN_PASSWORD is set.",
    AI_ADMIN_PASSWORD: "Password for the default admin account. Set this to auto-create the admin user.",
    CRON_SECRET: "Bearer token for the /api/backup/cron endpoint (Vercel Cron).",
    SMTP_HOST: "SMTP server hostname for sending emails.",
    SMTP_PORT: "SMTP port (usually 587 for TLS, 465 for SSL).",
    SMTP_USER: "SMTP authentication username (often your email address).",
    SMTP_PASS: "SMTP authentication password or app-specific password.",
    SMTP_FROM: "The 'From' address shown on outgoing emails. Defaults to SMTP_USER.",
    AI_INTEGRATIONS_OPENAI_API_KEY: "OpenAI API key for route optimization and demand forecasting.",
    AI_INTEGRATIONS_OPENAI_BASE_URL: "Custom base URL for OpenAI-compatible APIs (leave empty for default).",
  };
  return map[key] || "";
}
