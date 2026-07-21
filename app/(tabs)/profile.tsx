import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type MyPost = {
  id: string;
  image_url: string | null;
  content: string;
};

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const itemSize = (screenWidth - 32 - (numColumns - 1) * 4) / numColumns;

export default function Profile() {
  const { session, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const fetchProfile = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session?.user.id)
      .single();

    if (profile) setUsername(profile.username);

    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', session?.user.id);

    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', session?.user.id);

    setFollowerCount(followers ?? 0);
    setFollowingCount(following ?? 0);
  };

  const fetchMyPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('id, image_url, content')
      .eq('user_id', session?.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch my posts error:', error);
      return;
    }

    setMyPosts(data as MyPost[]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      setLoadingPosts(true);
      fetchMyPosts().finally(() => setLoadingPosts(false));
    }, [])
  );

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <View style={styles.container}>
      <FlatList
        data={myPosts}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {username ? username[0].toUpperCase() : '?'}
              </Text>
            </View>
            <Text style={styles.username}>{username || session?.user.email}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{myPosts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{followerCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            <Pressable
              style={styles.button}
              onPress={async () => {
                await signOut();
                router.replace('/(auth)/login');
              }}
            >
              <Text style={styles.buttonText}>Sign out</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>My Posts</Text>

            {loadingPosts && <ActivityIndicator style={{ marginTop: 10 }} />}
            {!loadingPosts && myPosts.length === 0 && (
              <Text style={styles.emptyText}>You haven&apos;t posted anything yet.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.gridItem}
            onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.gridImage} />
            ) : (
              <View style={[styles.gridImage, styles.textOnlyCard]}>
                <Text style={styles.textOnlyContent} numberOfLines={4}>
                  {item.content}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: '#f7f7f7' },
  header: { alignItems: 'center', paddingHorizontal: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '600' },
  username: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statNumber: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: '#888' },
  button: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 30,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptyText: { color: '#888', marginBottom: 20 },
  gridContent: { paddingHorizontal: 16, paddingBottom: 30 },
  row: { gap: 4, marginBottom: 4 },
  gridItem: { width: itemSize, height: itemSize },
  gridImage: { width: '100%', height: '100%', borderRadius: 4 },
  textOnlyCard: {
    backgroundColor: '#f0f0f0',
    padding: 6,
    justifyContent: 'center',
  },
  textOnlyContent: { fontSize: 10, color: '#333' },
});