import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Unmatched } from 'expo-router';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.log('ErrorBoundary caught:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return <Unmatched />;
    }

    return this.props.children;
  }
}
