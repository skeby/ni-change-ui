import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Copy, Check, Home, ShieldAlert } from 'lucide-react';
import { Button } from 'antd';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyStackTrace = async () => {
    if (!this.state.error) return;
    const details = `Error: ${this.state.error.message}\n\nStack Trace:\n${this.state.error.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error("Failed to copy stack trace", err);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-6 relative overflow-hidden font-sora">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary opacity-10 blur-[150px] pointer-events-none" />
          <div className="relative max-w-2xl w-full bg-bg/95 backdrop-blur-md border border-border shadow-2xl rounded-3xl p-8 space-y-6 overflow-hidden">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center justify-center mx-auto text-red-600 dark:text-red-400 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-h1 font-extrabold text-primary-alpha tracking-tight">Application Error</h1>
              <p className="text-body-sm text-fade max-w-md mx-auto leading-relaxed">
                An unexpected error occurred. Try reloading the application or contact support.
              </p>
            </div>
            <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex gap-3 items-start">
              <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase tracking-wider">Error Details</span>
                <p className="text-body-sm font-semibold text-primary-alpha leading-normal">
                  {this.state.error?.message || "Unknown rendering exception"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button htmlType="button" onClick={this.handleGoHome} className="flex items-center gap-2 border-border bg-white hover:bg-bg-muted text-primary-alpha text-body-sm font-semibold h-10">
                <Home className="w-4 h-4" /> Go to Dashboard
              </Button>
              <Button htmlType="button" type="primary" onClick={this.handleReload} className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-body-sm font-bold shadow-md shadow-primary/10 h-10">
                <RefreshCw className="w-4 h-4" /> Reload Page
              </Button>
              <Button htmlType="button" onClick={this.handleCopyStackTrace} className="flex items-center gap-2 border-border bg-white hover:bg-bg-muted text-primary-alpha text-body-sm font-semibold h-10">
                {this.state.copied ? (<><Check className="w-4 h-4 text-green-600 animate-scale-up" /> Copied!</>) : (<><Copy className="w-4 h-4" /> Copy Stack Trace</>)}
              </Button>
            </div>
            {this.state.error?.stack && (
              <details className="group border border-border-muted bg-bg-muted/50 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-4 text-body-sm font-bold text-fade cursor-pointer hover:bg-bg-muted select-none">
                  <span>Show Diagnostic Stack Trace</span>
                  <span className="transition-transform group-open:rotate-180 duration-200">&#x25BC;</span>
                </summary>
                <div className="p-4 border-t border-border-muted bg-background-primary text-[10px] text-red-700 dark:text-red-200 font-mono overflow-auto max-h-60 custom-scrollbar leading-relaxed">
                  <p className="font-bold text-red-800 dark:text-red-400 mb-2">Error: {this.state.error.message}</p>
                  <pre className="whitespace-pre">{this.state.error.stack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
