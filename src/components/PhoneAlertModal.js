import React, {useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Text from './reusable/Text';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../constants/Colors';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const PhoneAlertModal = ({visible, onClose}) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0.95);
      fadeAnim.setValue(0);

      // Start entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.6}
      animationIn="fadeIn"
      animationOut="fadeOut"
      useNativeDriver={true}
      onBackButtonPress={onClose}
      style={styles.modal}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle" size={38} color={GlobalColor.Primary} />
          </View>
          <Text style={styles.title} Bold>
            Action Required
          </Text>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.messageCard}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="information-circle" size={16} color={GlobalColor.Primary} />
                <Text style={styles.badgeText} Bold>
                  Phone Number Update
                </Text>
              </View>
            </View>

            <Text style={styles.message}>
              To comply with mandatory data privacy requirements, please update your phone number in NEEV under Contact Information. For any assistance, please contact HR
            </Text>
          </View>
        </View>

        {/* Button Section */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={onClose}
            activeOpacity={0.85}>
            <LinearGradient
              colors={[ThemeColor.Teal, ThemeColor.Teal, ThemeColor.TealSoft]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.button}>
              <Text style={styles.buttonText} Bold>
                Got It
              </Text>
              <Ionicons name="arrow-forward" size={16} color={GlobalColor.White} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.90,
    backgroundColor: GlobalColor.White,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: GlobalColor.Black,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: ThemeColor.TealLight,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: ThemeColor.TealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: GlobalColor.White,
    shadowColor: GlobalColor.Primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    color: GlobalColor.Primary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Content Section
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  messageCard: {
    backgroundColor: GlobalColor.White,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalColor.PrimaryLight,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    color: GlobalColor.Primary,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    color: GlobalColor.Text,
    textAlign: 'center',
    lineHeight: 22,
  },
  highlight: {
    color: GlobalColor.Primary,
    fontSize: 14,
  },

  // Button Section
  buttonSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
    backgroundColor: GlobalColor.White,
  },
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: GlobalColor.Secondary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    color: GlobalColor.White,
    fontSize: 15,
    letterSpacing: 0.4,
  },
});

export default PhoneAlertModal;
