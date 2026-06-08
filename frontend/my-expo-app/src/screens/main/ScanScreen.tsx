import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppDispatch, RootState } from '../../store/store';
import { performScan, resetScan } from '../../store/slices/scanSlice';
import ProgressBar from '../../components/common/ProgressBar';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';

type ScanScreenProps = NativeStackScreenProps<any, 'Scan'>;

export const ScanScreen: React.FC<ScanScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    isScanning,
    progress,
    progressMessage,
    detectedItems,
    imageUrl,
    error,
  } = useSelector((state: RootState) => state.scan);

  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (err) {
      setToastMessage('Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setToastMessage('Camera permission required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (err) {
      setToastMessage('Failed to take photo');
    }
  };

  const handleScan = async () => {
    if (!selectedImage) {
      setToastMessage('Please select an image first');
      return;
    }

    try {
      await dispatch(performScan(selectedImage)).unwrap();
      // Simulate progress updates
      setTimeout(() => {
        dispatch({
          type: 'scan/updateProgress',
          payload: { progress: 75, message: 'Analyzing colors...' },
        });
      }, 1000);
    } catch (err: any) {
      setToastMessage(err.message || 'Scan failed');
    }
  };

  const handleReset = () => {
    dispatch(resetScan());
    setSelectedImage(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-800">Scan Outfit</Text>
          <Text className="text-gray-600 mt-1">
            Take or upload a photo to detect clothing items
          </Text>
        </View>

        <View className="flex-1 px-6 py-6">
          {!isScanning && !imageUrl ? (
            <>
              {/* Image Picker */}
              {!selectedImage ? (
                <>
                  <View className="bg-white rounded-lg p-8 mb-6 items-center border-2 border-dashed border-gray-300">
                    <Text className="text-6xl mb-4">📸</Text>
                    <Text className="text-gray-800 font-semibold text-center mb-4">
                      Upload a Photo
                    </Text>
                    <Text className="text-gray-600 text-center text-sm mb-6">
                      Choose an image from your gallery or take a new photo
                    </Text>

                    <Button
                      title="Take Photo"
                      onPress={takePhoto}
                      className="mb-3"
                    />
                    <Button
                      title="Choose from Gallery"
                      onPress={pickImage}
                    />
                  </View>
                </>
              ) : (
                <>
                  {/* Selected Image Preview */}
                  <Image
                    source={{ uri: selectedImage.uri }}
                    className="w-full h-64 rounded-lg bg-gray-200 mb-6"
                    resizeMode="cover"
                  />

                  <Button
                    title="Scan This Outfit"
                    onPress={handleScan}
                    className="mb-3"
                  />
                  <Button
                    title="Choose Different Photo"
                    onPress={pickImage}
                  />
                </>
              )}
            </>
          ) : (
            <>
              {/* Scanning State */}
              {imageUrl && (
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-64 rounded-lg bg-gray-200 mb-6"
                  resizeMode="cover"
                />
              )}

              <ProgressBar
                progress={progress}
                label={progressMessage}
                showLabel={true}
              />

              {isScanning && (
                <View className="bg-blue-50 rounded-lg p-4 mb-6">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="text-center text-gray-700 mt-4">
                    {progressMessage}
                  </Text>
                </View>
              )}

              {/* Detected Items */}
              {detectedItems.length > 0 && (
                <View className="bg-white rounded-lg p-4 mb-6">
                  <Text className="text-lg font-bold text-gray-800 mb-4">
                    Detected Items
                  </Text>
                  {detectedItems.map((item, index) => (
                    <View
                      key={index}
                      className="flex-row justify-between items-center py-3 border-b border-gray-200"
                    >
                      <View>
                        <Text className="font-semibold text-gray-800">
                          {item.name}
                        </Text>
                        <Text className="text-sm text-gray-600 capitalize">
                          {item.category}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-blue-600 font-semibold">
                          {(item.confidence * 100).toFixed(0)}%
                        </Text>
                        <Text className="text-xs text-gray-600 capitalize">
                          {item.color}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <Button
                    title="Save to Wardrobe"
                    onPress={() => setToastMessage('Save feature coming soon')}
                    className="mt-4"
                  />
                </View>
              )}

              <Button
                title="Scan Another"
                onPress={handleReset}
              />
            </>
          )}

          {error && (
            <View className="bg-red-50 rounded-lg p-4 mt-6">
              <Text className="text-red-600 font-semibold">Scan Error</Text>
              <Text className="text-red-600 text-sm mt-1">{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </SafeAreaView>
  );
};

export default ScanScreen;