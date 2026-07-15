import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function FormScreen() {
  // 1. STATE — every input needs a piece of state to hold its value
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [subscribe, setSubscribe] = useState(false);
  const [gender, setGender] = useState('male');

  // 2. VALIDATION — simple function, runs before "submit"
  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter your name');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email');
      return;
    }

    // 3. If validation passes, do something with the data
    Alert.alert(
      'Form submitted',
      `Name: ${name}\nEmail: ${email}\nAge: ${age}\nGender: ${gender}\nSubscribed: ${subscribe}`
    );

    // Reset form
    setName('');
    setEmail('');
    setAge('');
    setSubscribe(false);
  };

  return (
    // KeyboardAvoidingView pushes the form up when keyboard opens
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Registration Form</Text>

        {/* Text input */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />

        {/* Email input with keyboard type */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Numeric input */}
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="18"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        {/* Gender selection using pressable "chips" instead of a picker */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.row}>
          {['male', 'female', 'other'].map((option) => (
            <Pressable
              key={option}
              onPress={() => setGender(option)}
              style={[
                styles.chip,
                gender === option && styles.chipSelected,
              ]}
            >
              <Text
                style={
                  gender === option ? styles.chipTextSelected : styles.chipText
                }
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Switch (toggle) */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Subscribe to newsletter</Text>
          <Switch value={subscribe} onValueChange={setSubscribe} />
        </View>

        {/* Submit button */}
        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 4. STYLES — StyleSheet.create is how RN handles CSS-like styling
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipSelected: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  chipText: {
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#4A90D9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});