import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { MessageAPI, StatusAPI, BASE_URL } from '../services/api';

// Filters are applied as a semi-transparent color overlay directly on top
// of the live camera feed, then the WHOLE composited view (camera + tint)
// is snapshotted as one image via react-native-view-shot. This bakes the
// filter into the actual photo, rather than just being a preview-only effect.
const FILTERS = [
  { key: 'none', label: 'Normal', overlay: null },
  { key: 'warm', label: 'Warm', overlay: 'rgba(255,140,60,0.18)' },
  { key: 'cool', label: 'Cool', overlay: 'rgba(60,140,255,0.18)' },
  { key: 'mono', label: 'Mono', overlay: 'rgba(120,120,120,0.35)' },
  { key: 'flare', label: 'Flare', overlay: 'rgba(255,46,147,0.22)' },
];

export default function StoryCameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [filter, setFilter] = useState(FILTERS[0]);
  const [uploading, setUploading] = useState(false);
  const shotRef = useRef(null);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permText}>We need camera access to capture a story.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  async function handleCapture() {
    setUploading(true);
    try {
      const uri = await captureRef(shotRef, { format: 'jpg', quality: 0.6 });

      const formData = new FormData();
      formData.append('file', { uri, name: 'story.jpg', type: 'image/jpeg' });
      const { data: uploadData } = await MessageAPI.upload(formData);

      await StatusAPI.create(`${BASE_URL}${uploadData.url}`, '');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Failed to post story', err?.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View ref={shotRef} style={styles.shotArea} collapsable={false}>
        <CameraView style={StyleSheet.absoluteFill} facing={facing} />
        {filter.overlay && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: filter.overlay }]} pointerEvents="none" />
        )}
      </View>

      <SafeAreaView style={styles.overlayUI} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}>
            <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterStrip}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter.key === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={styles.filterChipText}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <View style={styles.captureInner} />}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  shotArea: { flex: 1 },
  overlayUI: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  filterStrip: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 14, flexWrap: 'wrap' },
  filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)' },
  filterChipActive: { backgroundColor: '#FF2E93' },
  filterChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  captureBtn: {
    alignSelf: 'center', width: 66, height: 66, borderRadius: 33,
    borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  captureInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff' },
  permText: { color: '#fff', textAlign: 'center', marginTop: 100, paddingHorizontal: 30 },
  permBtn: {
    alignSelf: 'center', marginTop: 20, backgroundColor: '#FF2E93',
    paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20,
  },
  permBtnText: { color: '#fff', fontWeight: '700' },
});