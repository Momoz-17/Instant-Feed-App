import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Post = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  like_count: number;
  liked_by_me: boolean;
};

export default function Feed() {
  const { session, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch posts error:', error);
      return;
    }

    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('post_id, user_id');

    if (likesError) {
      console.error('Fetch likes error:', likesError);
      return;
    }

    const merged = postsData.map((post) => {
      const postLikes = likesData.filter((l) => l.post_id === post.id);
      return {
        ...post,
        like_count: postLikes.length,
        liked_by_me: postLikes.some((l) => l.user_id === session?.user.id),
      };
    });

    setPosts(merged as Post[]);
  };

  useFocusEffect(
    useCallback(() => {
      setFetching(true);
      fetchPosts().finally(() => setFetching(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const toggleLike = async (post: Post) => {
    // Optimistic UI update — flip it instantly, then sync with server
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              like_count: p.liked_by_me ? p.like_count - 1 : p.like_count + 1,
            }
          : p
      )
    );

    if (post.liked_by_me) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', session?.user.id);
      if (error) console.error('Unlike error:', error);
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: post.id, user_id: session?.user.id });
      if (error) console.error('Like error:', error);
    }
  };

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Feed</Text>
        <Pressable style={styles.newPostButton} onPress={() => router.push('/create-post')}>
          <Text style={styles.newPostButtonText}>+ New</Text>
        </Pressable>
      </View>

      {fetching ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : posts.length === 0 ? (
        <Text style={styles.emptyText}>No posts yet. Be the first to post!</Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <Pressable style={styles.post} onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}>
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.postImage} />
              )}
              {item.content ? <Text style={styles.postContent}>{item.content}</Text> : null}

              <View style={styles.footer}>
                <Pressable style={styles.likeButton} onPress={() => toggleLike(item)}>
                  <Ionicons
                    name={item.liked_by_me ? 'heart' : 'heart-outline'}
                    size={22}
                    color={item.liked_by_me ? '#e74c3c' : '#666'}
                  />
                  <Text style={styles.likeCount}>{item.like_count}</Text>
                </Pressable>
                <Text style={styles.postDate}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: { fontSize: 24, fontWeight: 'bold' },
  newPostButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newPostButtonText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888' },
  post: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  postImage: { width: '100%', height: 220 },
  postContent: { padding: 12, fontSize: 15 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: 14, color: '#666' },
  postDate: { fontSize: 12, color: '#999' },
});