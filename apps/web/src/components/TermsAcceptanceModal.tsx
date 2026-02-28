import { useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

const FALLBACK_TERMS = `
<h2>ChefOS Beta — Terms & Conditions</h2>
<p>By using ChefOS you acknowledge that:</p>
<ul>
  <li>The platform is in <strong>beta</strong>. Features may change and data may be reset.</li>
  <li>The service is provided <strong>"as is"</strong> without warranty.</li>
  <li>You are at least 18 years old and responsible for your account credentials.</li>
  <li>You will not reverse-engineer, misuse, or upload infringing content.</li>
  <li>Your data is handled per our <a href="/privacy">Privacy Policy</a>.</li>
  <li>These terms are governed by the laws of Queensland, Australia.</li>
</ul>
<p>Questions? Contact <strong>hello@chefos.com.au</strong>.</p>
`;

/**
 * Gate component: blocks children from rendering until terms are accepted.
 * This prevents the entire app (dashboard, queries, maps, etc.) from mounting
 * behind the modal — which was causing the browser to freeze.
 */
const TermsAcceptanceGate = ({ children }: { children: ReactNode }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const needsAcceptance = !!user && !!profile && !(profile as any).accepted_terms_at;

  // If no user, no profile, or terms already accepted → render app normally
  if (!needsAcceptance) return <>{children}</>;

  const handleAccept = async () => {
    if (!agreed) {
      toast.error("Please agree to the Terms & Conditions to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ accepted_terms_at: new Date().toISOString() })
        .eq("user_id", user!.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Terms accepted. Welcome to ChefOS!");
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    }
    setSubmitting(false);
  };

  // Block entire app — only show this screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl border max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Terms & Conditions</h2>
            <p className="text-sm text-muted-foreground">
              Please review and accept to continue
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          <div
            className="prose prose-sm prose-gray dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: FALLBACK_TERMS }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 accent-primary"
            />
            <span className="text-sm leading-relaxed">
              I have read and agree to the{" "}
              <span className="font-semibold text-primary">
                Terms & Conditions
              </span>{" "}
              and{" "}
              <span className="font-semibold text-primary">Privacy Policy</span>.
            </span>
          </label>
          <button
            onClick={handleAccept}
            disabled={!agreed || submitting}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Accept & Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptanceGate;
