import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Component } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import EquipmentTemplatesPage from './pages/EquipmentTemplatesPage';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught:', error);
    console.error('Error Info:', errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-600 text-center mb-6">
              The application encountered an unexpected error. Don't worry, your data is safe.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={20} />
                Restart Application
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Home size={20} />
                Go to Homepage
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-x-auto">
                  <p className="font-semibold text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  <pre className="text-gray-700 whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/templates" element={<EquipmentTemplatesPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
