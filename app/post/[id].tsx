import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Comment = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    username: string;
};

type PostDetail = {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
};

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { session } = useAuth();
    const [post, setPost] = useState<PostDetail | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    
    const insets = useSafeAreaInsets();

    const fetchData = async () => {
        const { data: postData } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();
        setPost(postData);

        const { data: commentsData, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Fetch comments error:', error);
            return;
        }

        if (!commentsData || commentsData.length === 0) {
            setComments([]);
            return;
        }

        const userIds = [...new Set(commentsData.map((c) => c.user_id))];
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

        const usernameMap = new Map(profilesData?.map((p) => [p.id, p.username]));

        setComments(
            commentsData.map((c) => ({
                id: c.id,
                content: c.content,
                created_at: c.created_at,
                user_id: c.user_id,
                username: usernameMap.get(c.user_id) ?? 'Unknown',
            }))
        );
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchData().finally(() => setLoading(false));
        }, [id])
    );

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setPosting(true);

        const { error } = await supabase.from('comments').insert({
            post_id: id,
            user_id: session?.user.id,
            content: newComment.trim(),
        });

        setPosting(false);

        if (error) {
            console.error('Comment error:', error);
            return;
        }

        setNewComment('');
        Keyboard.dismiss();
        fetchData();
    };

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 60 }} />;
    }

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1, backgroundColor: '#fff' }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 44}
        >
            <View style={{ flex: 1 }}>
                <FlatList
                    style={styles.container}
                    data={comments}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListHeaderComponent={
                        <>
                            {post?.image_url && (
                                <Image source={{ uri: post.image_url }} style={styles.postImage} />
                            )}
                            {post?.content ? <Text style={styles.postContent}>{post.content}</Text> : null}
                            <Text style={styles.commentsHeader}>
                                Comments ({comments.length})
                            </Text>
                        </>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.commentRow}>
                            <Text style={styles.commentUsername}>{item.username}</Text>
                            <Text style={styles.commentContent}>{item.content}</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                    }
                />

                <View style={[
                    styles.inputRow, 
                    { paddingBottom: Math.max(insets.bottom, 12) }
                ]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline={false}
                    />
                    <Pressable style={styles.sendButton} onPress={handleAddComment} disabled={posting}>
                        <Ionicons name="send" size={20} color="#fff" />
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    postImage: { width: '100%', height: 220, borderRadius: 8, marginTop: 12 },
    postContent: { fontSize: 16, marginTop: 12, marginBottom: 8 },
    commentsHeader: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
    commentRow: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    commentUsername: { fontWeight: '600', fontSize: 14 },
    commentContent: { fontSize: 14, marginTop: 2, color: '#333' },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 8,
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    sendButton: {
        backgroundColor: '#4A90D9',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
});