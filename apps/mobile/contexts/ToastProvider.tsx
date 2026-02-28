import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, type ToastConfig } from "../components/ui/Toast";

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((config: ToastConfig) => {
    setToastConfig(config);
    setVisible(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setToastConfig(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastConfig && (
        <Toast
          visible={visible}
          title={toastConfig.title}
          message={toastConfig.message}
          type={toastConfig.type}
          actionLabel={toastConfig.actionLabel}
          onAction={toastConfig.onAction}
          onDismiss={handleDismiss}
          duration={toastConfig.duration}
        />
      )}
    </ToastContext.Provider>
  );
}
