import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  override render() {
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
            padding: '2rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              padding: '2.5rem',
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.35)',
            }}
          >
            <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', fontWeight: 600 }}>Something went wrong</h1>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.55 }}>
              An unexpected error occurred while loading Zenith DAW. Please reload the app. If the
              problem continues, reach out to support.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                color: '#0f172a',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload App
            </button>
            {isDev && error && (
              <div
                style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  maxHeight: '260px',
                }}
              >
                <div style={{ marginBottom: '0.75rem', color: '#f87171', fontWeight: 600 }}>Error</div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    color: '#f8fafc',
                  }}
                >
                  {error.message}
                </pre>
                {errorInfo?.componentStack && (
                  <>
                    <div style={{ margin: '1rem 0 0.75rem', color: '#f59e0b', fontWeight: 600 }}>Stack Trace</div>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0,
                        color: '#cbd5f5',
                      }}
                    >
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
