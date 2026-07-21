import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Profile = {
  id: string;
  username: string;
  bio: string | null;
  is_following: boolean;
};

export default function Search() {
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${text}%`)
      .neq('id', session?.user.id)
      .limit(20);

    if (error) {
      console.error('Search error:', error);
      setLoading(false);
      return;
    }

    const { data: myFollows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session?.user.id);

    const followingIds = new Set(myFollows?.map((f) => f.following_id));

    setResults(
      profiles.map((p) => ({
        ...p,
        is_following: followingIds.has(p.id),
      }))
    );
    setLoading(false);
  };

  const toggleFollow = async (profile: Profile) => {
    setResults((prev) =>
      prev.map((p) =>
        p.id === profile.id ? { ...p, is_following: !p.is_following } : p
      )
    );

    if (profile.is_following) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', session?.user.id)
        .eq('following_id', profile.id);
      if (error) console.error('Unfollow error:', error);
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: session?.user.id, following_id: profile.id });
      if (error) console.error('Follow error:', error);
    }
  };

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search</Text>
      <TextInput
        style={styles.input}
        placeholder="Search username..."
        value={query}
        onChangeText={search}
        autoCapitalize="none"
      />

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.resultRow}>
            <View>
              <Text style={styles.username}>{item.username}</Text>
              {item.bio && <Text style={styles.bio}>{item.bio}</Text>}
            </View>
            <Pressable
              style={[styles.followButton, item.is_following && styles.followingButton]}
              onPress={() => toggleFollow(item)}
            >
              <Text style={item.is_following ? styles.followingText : styles.followText}>
                {item.is_following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          query.trim() && !loading ? (
            <Text style={styles.emptyText}>No users found</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  username: { fontSize: 16, fontWeight: '600' },
  bio: { fontSize: 13, color: '#888', marginTop: 2 },
  followButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#eee',
  },
  followText: { color: '#fff', fontWeight: '600' },
  followingText: { color: '#333', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888' },
});