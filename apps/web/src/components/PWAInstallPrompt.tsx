import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Don't show if user already dismissed
    if (localStorage.getItem("pwa_install_dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa_install_dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border bg-white p-4 shadow-lg dark:bg-gray-900">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
        <div className="flex-1">
          <p className="text-sm font-medium">Install ChefOS</p>
          <p className="text-xs text-muted-foreground">
            Add to your home screen for the best experience
          </p>
        </div>
        <button onClick={handleDismiss} className="shrink-0 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <Button onClick={handleInstall} size="sm" className="mt-3 w-full bg-teal-600 hover:bg-teal-700">
        Install
      </Button>
    </div>
  );
};

export default PWAInstallPrompt;
