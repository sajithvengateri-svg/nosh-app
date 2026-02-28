import React, { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-warning mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {this.props.fallbackMessage || "Something went wrong"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <Button variant="outline" onClick={this.handleRetry} className="mr-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="default" onClick={this.handleReload}>
            Reload Page
          </Button>
          {process.env.NODE_ENV === "development" && this.state.errorInfo && (
            <details className="mt-4 text-left text-xs text-muted-foreground max-w-full overflow-auto">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
