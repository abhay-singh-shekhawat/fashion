import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView className="flex-1 bg-red-50 px-6">
          <View className="flex-1 justify-center items-center py-16">
            <Text className="text-2xl font-bold text-red-600 mb-4 text-center">
              Oops! Something went wrong
            </Text>
            <Text className="text-gray-600 text-center mb-6 text-base">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <TouchableOpacity
              className="bg-blue-500 px-8 py-3 rounded-lg"
              onPress={this.handleReset}
            >
              <Text className="text-white font-semibold text-center">
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;