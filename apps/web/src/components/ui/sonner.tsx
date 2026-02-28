import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const { settings } = useAppSettings();
  const isAlwaysShowPage = typeof window !== "undefined" && (
    window.location.pathname === "/auth" ||
    window.location.pathname.startsWith("/admin") ||
    window.location.pathname.startsWith("/reservation")
  );

  if (!settings.toastsEnabled && !isAlwaysShowPage) return null;

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
