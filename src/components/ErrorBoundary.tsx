import React, { Component, ErrorInfo, ReactNode } from 'react';
import { trackBusinessEvent } from '../utils/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, errorInfo);
    try {
      trackBusinessEvent('app_crash', {
        message: error.message,
        stack: error.stack?.slice(0, 500),
        componentStack: errorInfo.componentStack?.slice(0, 500),
      });
    } catch { /* tracking must never throw */ }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--amex-gray-50, #f8f9fa)',
          padding: 24,
          fontFamily: 'var(--amex-font-family, system-ui, sans-serif)',
        }}>
          <div style={{
            maxWidth: 400,
            width: '100%',
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
              The app hit an unexpected error. Your data is safe — try refreshing.
            </p>
            {this.state.error && (
              <p style={{
                fontSize: 12, color: '#9ca3af', background: '#f3f4f6',
                borderRadius: 8, padding: '8px 12px', marginBottom: 20,
                wordBreak: 'break-word', textAlign: 'left',
              }}>
                {this.state.error.message}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  border: '1px solid #e5e7eb', background: '#fff',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#374151',
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  border: 'none', background: 'linear-gradient(135deg, #006FCF, #004B8D)',
                  color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
