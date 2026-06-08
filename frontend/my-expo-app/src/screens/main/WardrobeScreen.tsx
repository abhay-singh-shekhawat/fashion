import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppDispatch, RootState } from '../../store/store';
import {
  fetchWardrobe,
  addClothingItem,
  deleteClothingItem,
} from '../../store/slices/wardrobeSlice';
import ClothingItemCard from '../../components/common/ClothingItemCard';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';

type WardrobeScreenProps = NativeStackScreenProps<any, 'Wardrobe'>;

export const WardrobeScreen: React.FC<WardrobeScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error, itemCount } = useSelector(
    (state: RootState) => state.wardrobe
  );

  const [tab, setTab] = useState<'browse' | 'add'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Add item form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'top',
    color: 'black',
    formality: 'casual',
  });
  const [addingItem, setAddingItem] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadWardrobe();
  }, []);

  const loadWardrobe = async () => {
    try {
      await dispatch(fetchWardrobe()).unwrap();
    } catch (err) {
      console.log('Error loading wardrobe:', err);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadWardrobe();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const categories = [
    'top',
    'bottom',
    'outerwear',
    'footwear',
    'accessory',
    'other',
  ];

  const handleAddItem = async () => {
    if (!formData.name.trim()) {
      setToastMessage('Please enter item name');
      return;
    }

    try {
      setAddingItem(true);
      await dispatch(
        addClothingItem({
          name: formData.name,
          category: formData.category,
          color: formData.color,
          formality: formData.formality,
        })
      ).unwrap();

      setToastMessage('Item added successfully!');
      setFormData({
        name: '',
        category: 'top',
        color: 'black',
        formality: 'casual',
      });
      setTab('browse');
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await dispatch(deleteClothingItem(itemId)).unwrap();
      setToastMessage('Item deleted successfully!');
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to delete item');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-4 ${
            tab === 'browse' ? 'border-b-2 border-blue-500' : ''
          }`}
          onPress={() => setTab('browse')}
        >
          <Text
            className={`text-center font-semibold ${
              tab === 'browse' ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            Browse ({itemCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-4 ${
            tab === 'add' ? 'border-b-2 border-blue-500' : ''
          }`}
          onPress={() => setTab('add')}
        >
          <Text
            className={`text-center font-semibold ${
              tab === 'add' ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            Add Item
          </Text>
        </TouchableOpacity>
      </View>

      {/* Browse Tab */}
      {tab === 'browse' && (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 py-4 bg-white mb-4"
          >
            <TouchableOpacity
              className={`mr-3 px-4 py-2 rounded-full ${
                selectedCategory === null
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                className={`font-semibold ${
                  selectedCategory === null
                    ? 'text-white'
                    : 'text-gray-700'
                }`}
              >
                All
              </Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                className={`mr-3 px-4 py-2 rounded-full ${
                  selectedCategory === category
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  className={`font-semibold capitalize ${
                    selectedCategory === category
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Items List */}
          <View className="px-4">
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" />
            ) : filteredItems.length === 0 ? (
              <View className="bg-white rounded-lg p-6 items-center">
                <Text className="text-gray-600 text-center">
                  No items found. Add your first item!
                </Text>
              </View>
            ) : (
              filteredItems.map((item) => (
                <ClothingItemCard
                  key={item._id}
                  item={item}
                  onDelete={handleDeleteItem}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Add Item Tab */}
      {tab === 'add' && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Input
            label="Item Name"
            placeholder="e.g., Blue T-shirt"
            value={formData.name}
            onChangeText={(text) =>
              setFormData({ ...formData, name: text })
            }
            placeholderTextColor="#999"
          />

          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  className={`px-4 py-2 rounded ${
                    formData.category === cat
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text
                    className={`capitalize font-semibold ${
                      formData.category === cat
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Color"
            placeholder="e.g., blue"
            value={formData.color}
            onChangeText={(text) =>
              setFormData({ ...formData, color: text })
            }
            placeholderTextColor="#999"
          />

          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Formality</Text>
            <View className="flex-row flex-wrap gap-2">
              {['casual', 'smart_casual', 'formal', 'party'].map((formal) => (
                <TouchableOpacity
                  key={formal}
                  className={`px-4 py-2 rounded ${
                    formData.formality === formal
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                  onPress={() =>
                    setFormData({ ...formData, formality: formal })
                  }
                >
                  <Text
                    className={`capitalize font-semibold ${
                      formData.formality === formal
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {formal.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Add Item"
            onPress={handleAddItem}
            loading={addingItem}
            disabled={addingItem}
          />
        </ScrollView>
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastMessage.includes('success') ? 'success' : 'error'}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </SafeAreaView>
  );
};

export default WardrobeScreen;