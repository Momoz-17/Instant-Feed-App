import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function CreatePost() {
  const { session } = useAuth();
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${session?.user.id}-${Date.now()}.${fileExt}`;

      // Read the file as base64 (string literal 'base64' avoids the EncodingType typing issue)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const { error } = await supabase.storage
        .from('post-images')
        .upload(fileName, decode(base64), {
          contentType: `image/${fileExt}`,
        });

      if (error) throw error;

      const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !imageUri) {
      Alert.alert('Empty post', 'Write something or add an image.');
      return;
    }

    setUploading(true);

    let imageUrl: string | null = null;
    if (imageUri) {
      imageUrl = await uploadImage(imageUri);
      if (!imageUrl) {
        setUploading(false);
        Alert.alert('Upload failed', 'Could not upload image. Try again.');
        return;
      }
    }

    const { error } = await supabase.from('posts').insert({
      user_id: session?.user.id,
      content: content.trim(),
      image_url: imageUrl,
    });

    setUploading(false);

    if (error) {
      Alert.alert('Post failed', error.message);
      return;
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>New post</Text>

      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        multiline
        value={content}
        onChangeText={setContent}
      />

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      )}

      <Pressable style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>
          {imageUri ? 'Change image' : 'Add image'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.postButton}
        onPress={handlePost}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.postButtonText}>Post</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 16,
  },
  imageButton: {
    borderWidth: 1,
    borderColor: '#4A90D9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  imageButtonText: { color: '#4A90D9', fontWeight: '600' },
  postButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  postButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});