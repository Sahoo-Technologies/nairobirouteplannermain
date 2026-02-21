import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Mail, Download, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PrivacyPolicyPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleExportData = async () => {
    try {
      const res = await apiRequest("GET", "/api/auth/my-data");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Data exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to permanently delete your account and all associated data? This action cannot be undone.")) return;
    if (!confirm("This is irreversible. Type OK to confirm.")) return;
    try {
      await apiRequest("DELETE", "/api/auth/delete-account");
      toast({ title: "Account deleted" });
      window.location.href = "/";
    } catch {
      toast({ title: "Deletion failed", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Privacy Policy &amp; Data Protection</h1>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Effective Date: January 2025 | Last Updated: {new Date().toLocaleDateString("en-KE")}
      </p>

      <Card>
        <CardHeader><CardTitle>1. Introduction</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            Veew Distributors (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your personal data
            in accordance with the <strong>Kenya Data Protection Act, 2019 (No. 24 of 2019)</strong> and
            the regulations issued thereunder by the Office of the Data Protection Commissioner (ODPC).
          </p>
          <p>
            This Privacy Policy explains how we collect, use, store, share and protect your personal
            data when you use the Veew Distributors Route Planner system (&quot;the System&quot;).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2. Data Controller</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p><strong>Name:</strong> Veew Distributors</p>
          <p><strong>Data Protection Officer (DPO):</strong> Contact via the email below</p>
          <p className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            <strong>DPO Email:</strong>{" "}
            <a href="mailto:dpo@veewdistributors.co.ke" className="text-primary underline">
              dpo@veewdistributors.co.ke
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>3. Personal Data We Collect</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>We collect and process the following categories of personal data:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Identity data:</strong> First name, last name, email address, profile image</li>
            <li><strong>Authentication data:</strong> Hashed passwords (never stored in plain text)</li>
            <li><strong>Activity data:</strong> Login timestamps, session information</li>
            <li><strong>Business data:</strong> Orders, routes, dispatch records, shop information</li>
            <li><strong>Technical data:</strong> IP address, browser information (via server logs, not persisted)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>4. Lawful Basis for Processing</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>Under Section 30 of the Kenya Data Protection Act 2019, we process your data on the following bases:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Consent:</strong> You consent to data processing when you create an account and use the System</li>
            <li><strong>Contractual necessity:</strong> Processing necessary to fulfil our services to you</li>
            <li><strong>Legitimate interest:</strong> System security, fraud prevention, and analytics</li>
            <li><strong>Legal obligation:</strong> Compliance with applicable Kenyan law</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>5. Purpose of Processing</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <ul className="list-disc ml-6 space-y-1">
            <li>Provide and maintain the route planning and distribution management services</li>
            <li>Authenticate users and secure the system</li>
            <li>Generate analytics and AI-powered route optimisations</li>
            <li>Send password reset and system notification emails</li>
            <li>Create backups for disaster recovery</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>6. Data Retention</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <ul className="list-disc ml-6 space-y-1">
            <li>Account data is retained for the duration of your account, plus 30 days after deletion request</li>
            <li>Session data is automatically purged after 7 days of inactivity</li>
            <li>Password reset tokens expire after 1 hour and are marked as used</li>
            <li>Backups are retained based on the configured backup schedule and may be deleted by an administrator</li>
            <li>Server logs are not persisted beyond the runtime of the application</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>7. Data Security Measures</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <ul className="list-disc ml-6 space-y-1">
            <li>All passwords are hashed with bcrypt (salted, 10 rounds)</li>
            <li>Sessions use HttpOnly, Secure, SameSite cookies</li>
            <li>Content Security Policy (CSP), HSTS, and other security headers enforced via Helmet</li>
            <li>Rate limiting on authentication endpoints to prevent brute-force attacks</li>
            <li>Role-based access control (RBAC) — admin-only operations are restricted</li>
            <li>Password reset tokens are SHA-256 hashed before storage</li>
            <li>Environment secrets are never exposed in API responses</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>8. Cross-Border Data Transfers</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>
            The System may be hosted on cloud infrastructure (e.g., Vercel, cloud PostgreSQL) which may
            store data outside Kenya. In compliance with Section 48 of the Kenya Data Protection Act 2019,
            we ensure that any such transfer is subject to appropriate safeguards, including the use of
            data processing agreements with our cloud service providers.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>9. Your Rights as a Data Subject</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>Under the Kenya Data Protection Act 2019 (Sections 26–28), you have the right to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate personal data</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format (JSON)</li>
            <li><strong>Object:</strong> Object to processing of your personal data</li>
            <li><strong>Withdraw consent:</strong> Withdraw consent at any time</li>
          </ul>
          <Separator className="my-3" />
          {isAuthenticated && (
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="mr-2 h-4 w-4" /> Export My Data
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete My Account
              </Button>
            </div>
          )}
          <p className="text-muted-foreground">
            To exercise any of these rights, contact the DPO at{" "}
            <a href="mailto:dpo@veewdistributors.co.ke" className="text-primary underline">
              dpo@veewdistributors.co.ke
            </a>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>10. Data Breach Notification</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>
            In compliance with Section 43 of the Kenya Data Protection Act 2019, in the event of a
            personal data breach that is likely to result in a risk to the rights and freedoms of data
            subjects, we will notify the Office of the Data Protection Commissioner within 72 hours of
            becoming aware of the breach, and will notify affected data subjects without undue delay.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>11. Cookies</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>We use the following cookies:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Session cookie</strong> (<code>__veew_sid</code>): Essential for authentication.
              HttpOnly, Secure, SameSite=Lax. Expires after 7 days.
            </li>
          </ul>
          <p>We do not use tracking, analytics, or advertising cookies.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>12. Changes to This Policy</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>
            We may update this policy from time to time. Any changes will be posted on this page with an
            updated &quot;Last Updated&quot; date. Continued use of the System after changes constitutes
            acceptance of the revised policy.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>13. Complaints</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <p>
            If you believe your data protection rights have been violated, you have the right to lodge a
            complaint with the <strong>Office of the Data Protection Commissioner (ODPC)</strong>:
          </p>
          <ul className="ml-6 space-y-1">
            <li>Website: <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.odpc.go.ke</a></li>
            <li>Email: <a href="mailto:complaints@odpc.go.ke" className="text-primary underline">complaints@odpc.go.ke</a></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
