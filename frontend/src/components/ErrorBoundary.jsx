// frontend/src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          margin: '20px',
          color: '#dc2626'
        }}>
          <h2>🚨 Đã xảy ra lỗi</h2>
          <p>Ứng dụng gặp lỗi không mong muốn. Vui lòng làm mới trang.</p>
          
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Chi tiết lỗi (dành cho developer)</summary>
            <pre style={{ 
              backgroundColor: '#1f2937', 
              color: '#f3f4f6', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              marginTop: '10px'
            }}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </pre>
          </details>

          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              🔄 Làm mới trang
            </button>
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Thử lại
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <a href="/dashboard" style={{ color: '#dc2626', textDecoration: 'none' }}>
              ← Quay lại Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
