import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/react-native";
import { ErrorScreen } from "./ui/ErrorScreen";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onGoHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    this.props.onGoHome?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <ErrorScreen
          emoji="🔥"
          title="Oops! Something burned"
          subtitle="Don't worry, our kitchen crew is on it. Give it another go or head back home."
          onRetry={this.handleRetry}
          onGoHome={this.props.onGoHome ? this.handleGoHome : undefined}
        />
      );
    }

    return this.props.children;
  }
}
