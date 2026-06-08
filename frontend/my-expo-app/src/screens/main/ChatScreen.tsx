import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppDispatch, RootState } from '../../store/store';
import {
  sendChatMessage,
  addMessage,
  clearChat,
} from '../../store/slices/chatSlice';
import { socketListeners } from '../../services/socket/socketListeners';
import Button from '../../components/common/Button';

type ChatScreenProps = NativeStackScreenProps<any, 'Chat'>;

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, isTyping, loading } = useSelector(
    (state: RootState) => state.chat
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const quickPrompts = [
    'What should I wear today?',
    'Outfit for office meeting',
    'Gym wear suggestions',
    'Party outfit ideas',
  ];

  useEffect(() => {
    // Setup socket listeners for streaming responses
    socketListeners.onChatResponseChunk((data) => {
      dispatch(
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: data.chunk,
          timestamp: new Date().toISOString(),
        })
      );
    });

    socketListeners.onChatResponseComplete((data) => {
      console.log('Chat complete:', data);
    });

    return () => {
      socketListeners.removeListener('chat:response:chunk', () => {});
      socketListeners.removeListener('chat:response:complete', () => {});
    };
  }, [dispatch]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) return;

    const userMessage = messageText;
    setMessageText('');
    setIsSending(true);

    try {
      // Add user message to chat
      dispatch(
        addMessage({
          id: Date.now().toString(),
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString(),
        })
      );

      // Send to API
      await dispatch(
        sendChatMessage({
          userId: user.id,
          message: userMessage,
        })
      ).unwrap();
    } catch (error) {
      console.log('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setMessageText(prompt);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-800">AI Stylist</Text>
            <Text className="text-gray-600 text-sm mt-1">
              Get outfit recommendations
            </Text>
          </View>
          <TouchableOpacity
            className="bg-red-100 px-4 py-2 rounded"
            onPress={() => dispatch(clearChat())}
          >
            <Text className="text-red-600 font-semibold text-xs">Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={scrollViewRef as any}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <View
              className={`mb-3 flex-row ${
                item.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <View
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  item.role === 'user'
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`${
                    item.role === 'user'
                      ? 'text-white'
                      : 'text-gray-800'
                  }`}
                >
                  {item.content}
                </Text>
              </View>
            </View>
          )}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-12">
              <Text className="text-6xl mb-4">👔</Text>
              <Text className="text-gray-700 font-semibold text-center mb-2">
                Hi, I'm your AI Stylist!
              </Text>
              <Text className="text-gray-600 text-center px-4">
                Ask me for outfit recommendations based on weather, occasion,
                or your wardrobe
              </Text>
            </View>
          }
        />

        {/* Quick Prompts */}
        {messages.length === 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 py-4 bg-white border-t border-gray-200"
          >
            {quickPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                className="bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mr-3"
                onPress={() => handleQuickPrompt(prompt)}
              >
                <Text className="text-blue-600 text-sm font-semibold">
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <View className="px-4 py-2 bg-white">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text className="text-gray-600 ml-2">AI is typing...</Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View className="bg-white px-4 py-4 border-t border-gray-200 flex-row items-end">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-2"
            placeholder="Ask for outfit recommendations..."
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxHeight={100}
            editable={!isSending}
          />
          <TouchableOpacity
            className={`p-3 rounded-full ${
              isSending || !messageText.trim()
                ? 'bg-gray-300'
                : 'bg-blue-500'
            }`}
            onPress={handleSendMessage}
            disabled={isSending || !messageText.trim()}
          >
            <Text className="text-white font-bold text-lg">➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;