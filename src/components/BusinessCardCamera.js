import React from 'react';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../constants/Colors';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Business card aspect ratio (typically 3.5:2 or 85.6mm x 54mm)
const CARD_ASPECT_RATIO = 1.75;
const FRAME_WIDTH = SCREEN_WIDTH * 0.8;
const FRAME_HEIGHT = FRAME_WIDTH / CARD_ASPECT_RATIO;

const BusinessCardGuide = ({onOpenCamera, onClose}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan Business Card</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle-outline" size={28} color="rgba(1,4,75,0.62)" />
            </TouchableOpacity>
          </View>

          {/* Camera Icon */}
          <View style={styles.iconContainer}>
            <Animated.View style={{transform: [{scale: pulseAnim}]}}>
              <Ionicons name="camera" size={70} color={'#171C8F'} />
            </Animated.View>
          </View>

          {/* Title */}
          <Text style={styles.guideTitle}>Position Your Card</Text>
          <Text style={styles.guideSubtitle}>
            When the camera opens, align the business card within the green frame
          </Text>

          {/* Frame Preview with Cutout Guide */}
          <View style={styles.framePreview}>
            <View style={styles.frameContainer}>
              {/* Simulate dark overlay */}
              <View style={styles.overlaySimulation} />

              {/* Cutout area showing the frame */}
              <View style={styles.cutoutFrame}>
                {/* Corner brackets */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {/* Green Border */}
                <View style={styles.frameBorder} />

                {/* Card icon in center */}
                <View style={styles.cardIconWrapper}>
                  <Ionicons name="card-outline" size={50} color="#FFFFFF" />
                  <Text style={styles.centerText}>Align Here</Text>
                </View>
              </View>
            </View>

            {/* Instructional Label */}
            <View style={styles.labelContainer}>
              <Ionicons name="information-circle" size={16} color="#171C8F" />
              <Text style={styles.labelText}>
                You'll see this frame in the camera
              </Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionTitle}>Tips for Best Results:</Text>

            <View style={styles.instructionRow}>
              <View style={styles.bulletContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#171C8F" />
              </View>
              <Text style={styles.instructionText}>
                Place card on a flat surface with solid background
              </Text>
            </View>

            <View style={styles.instructionRow}>
              <View style={styles.bulletContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#171C8F" />
              </View>
              <Text style={styles.instructionText}>
                Ensure bright, even lighting without shadows
              </Text>
            </View>

            <View style={styles.instructionRow}>
              <View style={styles.bulletContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#171C8F" />
              </View>
              <Text style={styles.instructionText}>
                Hold phone directly above the card (parallel)
              </Text>
            </View>

            <View style={styles.instructionRow}>
              <View style={styles.bulletContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#171C8F" />
              </View>
              <Text style={styles.instructionText}>
                Fit all 4 corners within the green frame
              </Text>
            </View>
          </View>

          {/* Open Camera Button */}
          <TouchableOpacity
            style={styles.openCameraBtn}
            onPress={onOpenCamera}
            activeOpacity={0.8}>
            <Ionicons name="camera" size={22} color="#FFFFFF" />
            <Text style={styles.openCameraBtnText}>Open Camera</Text>
          </TouchableOpacity>

          {/* Additional Note */}
          <Text style={styles.footnote}>
            Keep this frame position in mind when capturing
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(1,4,75,0.5)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  content: {
    width: SCREEN_WIDTH * 0.92,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171C8F',
  },
  closeBtn: {
    padding: 4,
  },
  iconContainer: {
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#01044B',
    marginBottom: 8,
    textAlign: 'center',
  },
  guideSubtitle: {
    fontSize: 14,
    color: 'rgba(1,4,75,0.62)',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  framePreview: {
    marginBottom: 24,
    alignItems: 'center',
  },
  frameContainer: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    backgroundColor: '#01044B',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  overlaySimulation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(1,4,75,0.5)',
  },
  cutoutFrame: {
    width: FRAME_WIDTH * 0.85,
    height: (FRAME_WIDTH * 0.85) / CARD_ASPECT_RATIO,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  frameBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#171C8F',
    borderRadius: 8,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#171C8F',
    zIndex: 1,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  cardIconWrapper: {
    alignItems: 'center',
    opacity: 0.7,
  },
  centerText: {
    color: '#171C8F',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  labelContainer: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#171C8F',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
    fontSize: 13,
    color: '#171C8F',
    fontWeight: '600',
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#01044B',
    marginBottom: 14,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletContainer: {
    marginRight: 10,
    marginTop: 1,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(1,4,75,0.62)',
    lineHeight: 20,
  },
  openCameraBtn: {
    flexDirection: 'row',
    backgroundColor: '#171C8F',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#01044B',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  openCameraBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footnote: {
    fontSize: 12,
    color: 'rgba(1,4,75,0.62)',
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default BusinessCardGuide;
