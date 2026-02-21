import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

const CONSENT_KEY = "veew_cookie_consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            We use a single essential cookie (<code>__veew_sid</code>) for authentication.
            No tracking or advertising cookies are used. By continuing, you consent to this
            in accordance with the{" "}
            <button
              onClick={() => { navigate("/privacy-policy"); setVisible(false); }}
              className="text-primary underline inline-flex items-center gap-0.5"
            >
              Kenya Data Protection Act 2019 <ExternalLink className="h-3 w-3" />
            </button>.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={decline}>
            Decline
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
