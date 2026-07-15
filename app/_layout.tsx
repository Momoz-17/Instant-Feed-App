import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="create-post" options={{ presentation: 'modal', title: 'New Post' }} />
        <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
      </Stack>
    </AuthProvider>
  );
}