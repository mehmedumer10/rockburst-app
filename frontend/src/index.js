import React from 'react';
import ReactDOM from 'react-dom/client';

// Global design system styles — must come first
import './index.css';

import App from './App';

// ─── Remove the pre-mount loader once React takes over ───────────────────────
const preLoader = document.getElementById('root-loader');
if (preLoader) {
  // Small delay so the spinner doesn't flash on fast connections
  preLoader.style.transition = 'opacity 0.3s ease';
  preLoader.style.opacity = '0';
  setTimeout(() => preLoader.remove(), 300);
}

// ─── Performance monitoring (optional) ───────────────────────────────────────
const reportWebVitals = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');
      const log = (metric) =>
        console.info(
          `%c[WebVitals] ${metric.name}: ${Math.round(metric.value)}ms`,
          'color:#2563eb;font-weight:600;'
        );
      onCLS(log);
      onFID(log);
      onFCP(log);
      onLCP(log);
      onTTFB(log);
    } catch {
      // web-vitals not installed — silently skip
    }
  }
};

// ─── Error boundary for the entire tree ──────────────────────────────────────
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[RootErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            minHeight:      '100vh',
            background:     '#030712',
            color:          '#f3f4f6',
            fontFamily:     'system-ui, sans-serif',
            textAlign:      'center',
            padding:        '24px',
            gap:            '16px',
          }}
        >
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#9ca3af', maxWidth: '420px', lineHeight: 1.6 }}>
            An unexpected error occurred. Please refresh the page. If the problem
            persists, contact support.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre
              style={{
                background:   '#111827',
                border:       '1px solid #374151',
                borderRadius: '8px',
                padding:      '16px',
                fontSize:     '12px',
                color:        '#f87171',
                maxWidth:     '600px',
                overflowX:    'auto',
                textAlign:    'left',
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop:    '8px',
              padding:      '10px 24px',
              background:   '#2563eb',
              color:        '#fff',
              border:       'none',
              borderRadius: '8px',
              fontSize:     '14px',
              fontWeight:   600,
              cursor:       'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Mount ────────────────────────────────────────────────────────────────────
const container = document.getElementById('root');

if (!container) {
  throw new Error(
    '[index.js] Could not find #root element. ' +
    'Make sure public/index.html contains <div id="root"></div>.'
  );
}

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

// Fire vitals reporting after paint
reportWebVitals();