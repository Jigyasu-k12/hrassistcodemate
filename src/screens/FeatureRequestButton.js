import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthContext from '../context/AuthContext';
import * as ApiService from '../Utils/Utils';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../constants/Colors';

const { width } = Dimensions.get('window');

const getFeatureBtnDismissKey = (userId) => `@feature_button_dismissed_until_${userId}`;
const FEATURE_BTN_DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const MAX_CHARACTERS = 100; // Maximum characters allowed in feature request


// Optional props let you reposition/restyle per screen without touching the internals.
export default function FeatureRequestButton({
  bottom = 100,
  right = width * 0.05,
  isVisibleByConfig = true, // Control visibility from parent (API config)
}) {
  const { AppUserData } = useContext(AuthContext);

  const [isFeatureModalVisible, setIsFeatureModalVisible] = useState(false);
  const [featureText, setFeatureText] = useState('');
  const [isSubmittingFeature, setIsSubmittingFeature] = useState(false);
  const [featureSubmitted, setFeatureSubmitted] = useState(false);
  const [showFeatureButton, setShowFeatureButton] = useState(false);

  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const bulbGlowAnim = useRef(new Animated.Value(0)).current;
  const burstAnim = useRef(new Animated.Value(0)).current;
  const iconSpinAnim = useRef(new Animated.Value(0)).current;
  const successCheckAnim = useRef(new Animated.Value(0)).current;
  const successBurstAnim = useRef(new Animated.Value(0)).current;

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const floatingButtonOpacity = useRef(new Animated.Value(1)).current;
  const dragged = useRef(false);

  // Continuous glow pulse
  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bulbGlowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(bulbGlowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, []);

  // Check the 3-day dismissal on mount and when config changes
  useEffect(() => {
    checkFeatureButtonDismissal();
  }, [isVisibleByConfig]);

  const checkFeatureButtonDismissal = async () => {
    try {
      // If API config says hide, don't show regardless of dismissal status
      if (!isVisibleByConfig) {
        console.log('FeatureRequestButton: Hidden by API config');
        setShowFeatureButton(false);
        return;
      }

      const userId = AppUserData?.data?.userId;
      if (!userId) {
        setShowFeatureButton(true);
        return;
      }

      const dismissKey = getFeatureBtnDismissKey(userId);
      const dismissedUntil = await AsyncStorage.getItem(dismissKey);
      if (dismissedUntil) {
        const dismissedUntilTime = parseInt(dismissedUntil, 10);
        if (!Number.isNaN(dismissedUntilTime) && Date.now() < dismissedUntilTime) {
          console.log('FeatureRequestButton: Hidden by user dismissal');
          setShowFeatureButton(false);
          return;
        }
      }
      floatingButtonOpacity.setValue(1);
      setShowFeatureButton(true);
    } catch (error) {
      console.log('Error checking feature button dismissal:', error);
      setShowFeatureButton(true);
    }
  };

  const handleDismissFeatureButton = async () => {
    try {
      const userId = AppUserData?.data?.userId;
      if (userId) {
        const dismissKey = getFeatureBtnDismissKey(userId);
        const dismissUntil = Date.now() + FEATURE_BTN_DISMISS_DURATION_MS;
        await AsyncStorage.setItem(dismissKey, dismissUntil.toString());
        console.log(`Feature button dismissed for user ${userId} until:`, new Date(dismissUntil).toLocaleString());
      }
    } catch (error) {
      console.log('Error saving feature button dismissal:', error);
    }

    closeFeatureModal();

    Animated.timing(floatingButtonOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowFeatureButton(false));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: () => {
        dragged.current = false;
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
        listener: (_, gestureState) => {
          if (Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4) {
            dragged.current = true;
          }
        },
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        if (!dragged.current) {
          openFeatureModal();
        }
      },
    })
  ).current;

  const openFeatureModal = () => {
    setIsFeatureModalVisible(true);
    setFeatureSubmitted(false);
    burstAnim.setValue(0);
    iconSpinAnim.setValue(0);
    Animated.parallel([
      Animated.spring(modalScaleAnim, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
      Animated.timing(modalOpacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(burstAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(iconSpinAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();
  };

  const closeFeatureModal = () => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(modalOpacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setIsFeatureModalVisible(false);
      setFeatureText('');
    });
  };

  // Filter function to allow only alphanumeric, spaces, and basic punctuation
  const filterSpecialCharacters = (text) => {
    // Allow: letters, numbers, spaces, and basic punctuation (. , ? ! ' -)
    return text.replace(/[^a-zA-Z0-9\s.,?!'\-]/g, '');
  };

  const handleFeatureTextChange = (text) => {
    const filteredText = filterSpecialCharacters(text);
    setFeatureText(filteredText);
  };

  const submitFeatureRequest = () => {
    if (!featureText.trim()) return;

    const userName = AppUserData?.data?.userId;
    const token = AppUserData?.token;

    const payload = {
      AppID: '1',
      FeatureReq: featureText.trim(),
      UserName: userName
    };

    console.log('Feature Request API Payload:', payload);

    setIsSubmittingFeature(true);

    ApiService.PostMethode(
      '/AddFeature',
      payload,
      token,
      AuthContext
    )
      .then(result => {
        console.log('Feature Request API Response:', result);
        setIsSubmittingFeature(false);
        if (result?.Value?.[0]?.P_OUT_ERROR === 'SUCCESS') {
          setFeatureSubmitted(true);
          // Trigger success animation
          successCheckAnim.setValue(0);
          successBurstAnim.setValue(0);
          Animated.parallel([
            Animated.spring(successCheckAnim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.timing(successBurstAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start();
          setTimeout(() => closeFeatureModal(), 2000);
        } else {
          ApiService.showErrorMessage('Failed to submit feature request', AuthContext);
        }
      })
      .catch(error => {
        console.log('Feature Request API Error:', error);
        setIsSubmittingFeature(false);
        ApiService.showErrorMessage(error, AuthContext);
      });
  };

  const iconSpin = iconSpinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const burstScale1 = burstAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.8] });
  const burstOpacity1 = burstAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 0.25, 0] });
  const burstScale2 = burstAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.4] });
  const burstOpacity2 = burstAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.15, 0] });

  const glowOpacity = bulbGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const glowScale = bulbGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });

  // Success animation interpolations
  const successCheckScale = successCheckAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const successCheckRotate = successCheckAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const successBurstScale1 = successBurstAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] });
  const successBurstOpacity1 = successBurstAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 0.4, 0] });
  const successBurstScale2 = successBurstAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 3.5] });
  const successBurstOpacity2 = successBurstAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.6, 0.3, 0] });

  // Hide if API config says no OR if user dismissed OR modal is not visible
  if ((!isVisibleByConfig || !showFeatureButton) && !isFeatureModalVisible) return null;

  return (
    <>
      {isVisibleByConfig && showFeatureButton && (
        <Animated.View
          style={[
            styles.floatingButtonWrapper,
            {
              bottom,
              right,
              opacity: floatingButtonOpacity,
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[styles.floatingGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
          />
          <View style={styles.floatingButton}>
            <LinearGradient
              colors={['#171C8F', '#01044B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.floatingButtonGradient}
            >
              <MaterialCommunityIcons name="lightbulb-on" size={24} color={'#FFFFFF'} />
            </LinearGradient>
          </View>
        </Animated.View>
      )}

      <Modal
        visible={isFeatureModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeFeatureModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Animated.View style={[styles.modalOverlay, { opacity: modalOpacityAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeFeatureModal} />
            <ScrollView
              contentContainerStyle={styles.modalKeyboardWrapper}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                style={[
                  styles.modalCard,
                  { transform: [{ scale: modalScaleAnim }], opacity: modalOpacityAnim },
                ]}
              >
                <LinearGradient colors={['#F5F5F5', 'rgba(23,28,143,0.1)']} style={styles.modalGradient}>
                  <View style={styles.modalIconWrapper}>
                    <Animated.View
                      style={[styles.burstRing, { transform: [{ scale: burstScale2 }], opacity: burstOpacity2 }]}
                    />
                    <Animated.View
                      style={[styles.burstRing, { transform: [{ scale: burstScale1 }], opacity: burstOpacity1 }]}
                    />
                    <View style={styles.modalIconCircle}>
                      <Animated.View style={{ transform: [{ rotate: iconSpin }] }}>
                        <MaterialCommunityIcons name="lightbulb-on-outline" size={30} color={'#01044B'} />
                      </Animated.View>
                    </View>
                  </View>

                  {featureSubmitted ? (
                    <>
                      <View style={styles.successIconWrapper}>
                        <Animated.View
                          style={[
                            styles.successBurstRing,
                            { transform: [{ scale: successBurstScale2 }], opacity: successBurstOpacity2 }
                          ]}
                        />
                        <Animated.View
                          style={[
                            styles.successBurstRing,
                            { transform: [{ scale: successBurstScale1 }], opacity: successBurstOpacity1 }
                          ]}
                        />
                        <View style={styles.successIconCircle}>
                          <Animated.View
                            style={{
                              transform: [
                                { scale: successCheckScale },
                                { rotate: successCheckRotate }
                              ]
                            }}
                          >
                            <MaterialCommunityIcons name="check-circle" size={50} color="#171C8F" />
                          </Animated.View>
                        </View>
                      </View>
                      <Text style={styles.modalTitle}>Thanks! 🎉</Text>
                      <Text style={styles.modalSubtitle}>Your idea has been sent to the team.</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.modalTitle}>Your Feedback Matters!</Text>
                      <Text style={styles.modalSubtitle}>We at Employee Experience want to create the best possible experience for you.</Text>

                      <TextInput
                        style={styles.modalInput}
                        placeholder="Request a new feature..."
                        placeholderTextColor={'rgba(1,4,75,0.62)'}
                        multiline
                        numberOfLines={4}
                        value={featureText}
                        onChangeText={handleFeatureTextChange}
                        textAlignVertical="top"
                        maxLength={MAX_CHARACTERS}
                      />
                      <Text style={styles.characterCounter}>
                        {featureText.length}/{MAX_CHARACTERS} characters • Letters, numbers, and basic punctuation only
                      </Text>

                      <View style={styles.modalButtonRow}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={closeFeatureModal}>
                          <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.modalSubmitBtn,
                            (!featureText.trim() || isSubmittingFeature) && styles.modalSubmitBtnDisabled,
                          ]}
                          onPress={submitFeatureRequest}
                          disabled={!featureText.trim() || isSubmittingFeature}
                        >
                          <Text style={styles.modalSubmitText}>
                            {isSubmittingFeature ? 'Sending...' : 'Submit'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.dismissButton}
                        onPress={handleDismissFeatureButton}
                      >
                        <Text style={styles.dismissButtonText}>Hide this</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButtonWrapper: {
    position: 'absolute',
    zIndex: 998,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#171C8F',
  },
  floatingButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    elevation: 10,
    shadowColor: '#01044B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  floatingButtonGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#171C8F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#01044B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(1,4,75,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboardWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalCard: {
    width: width * 0.85,
    borderRadius: 24,
    elevation: 15,
    shadowColor: '#01044B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  modalIconWrapper: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  burstRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#171C8F',
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#01044B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(1,4,75,0.62)',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    minHeight: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#01044B',
    borderWidth: 1,
    borderColor: '#171C8F',
    marginBottom: 8,
  },
  characterCounter: {
    fontSize: 12,
    color: 'rgba(1,4,75,0.62)',
    textAlign: 'right',
    marginBottom: 12,
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#171C8F',
  },
  modalCancelText: {
    color: '#171C8F',
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#171C8F',
  },
  modalSubmitBtnDisabled: {
    backgroundColor: '#F5F5F5',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successIconWrapper: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successBurstRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#171C8F',
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  dismissButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#171C8F',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});