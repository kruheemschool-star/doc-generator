import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Optional compact fallback (element or render fn) overrides the default UI —
            // lets callers like MarkdownItem reuse this boundary for inline previews.
            if (this.props.fallback !== undefined) {
                return typeof this.props.fallback === 'function'
                    ? this.props.fallback(this.state.error, this.handleReset)
                    : this.props.fallback;
            }
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-red-50/50 rounded-xl border border-red-100 text-center">
                    <div className="bg-red-100 p-4 rounded-full mb-4 animate-pulse">
                        <AlertTriangle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-6 max-w-md">
                        The application encountered an unexpected error. This might be due to a temporary issue or invalid data.
                    </p>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-red-200 mb-6 w-full max-w-lg text-left overflow-auto max-h-48 custom-scrollbar">
                        <p className="font-mono text-xs text-red-600 font-semibold mb-1">
                            Error: {this.state.error?.toString()}
                        </p>
                        {this.state.errorInfo && (
                            <pre className="font-mono text-[10px] text-gray-500 whitespace-pre-wrap">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={this.handleReset}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={this.handleReload}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                            <RefreshCw size={14} />
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
