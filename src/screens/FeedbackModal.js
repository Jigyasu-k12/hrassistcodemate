import React, {useState, useEffect, useRef} from 'react';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../constants/Colors';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  Vibration,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, Path} from 'react-native-svg';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import Text from '../components/reusable/Text';
import * as ApiService from '../Utils/Utils';
import {API_SERVICES_URL} from '../API/Api';

const {width: SCREEN_W} = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ────────────────────────────────────────────────
// How long the sheet waits, once `visible` turns true,
// before it actually slides up on screen.
// ────────────────────────────────────────────────
const SHOW_DELAY_MS = 2000;

// How long the "Thank You" success panel stays up before auto-closing.
const THANK_YOU_DISPLAY_MS = 2200;

// === THANK YOU: SVG success-checkmark geometry ===
const SUCCESS_CIRCLE_R = 42;
const SUCCESS_CIRCLE_CIRCUMFERENCE = 2 * Math.PI * SUCCESS_CIRCLE_R;
const SUCCESS_CHECK_PATH = 'M29 51 L44 66 L73 34';
const SUCCESS_CHECK_LENGTH = 70; // safe upper bound for the path above

// === THANK YOU: confetti burst config ===
const CONFETTI_COUNT = 10;
const CONFETTI_COLORS = ['#33A852', '#FFC94D', '#FF9F5C', '#4C6FFF', '#FF5C8A'];

const RATING_LABELS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

// Emoji-based rating scale (Myntra/Zomato-style), each with its own accent color
const RATING_CONFIG = [
  {value: 1, emoji: '😞', color: '#FF5C5C'},
  {value: 2, emoji: '😕', color: '#FF9F5C'},
  {value: 3, emoji: '😐', color: '#FFC94D'},
  {value: 4, emoji: '🙂', color: '#8BC34A'},
  {value: 5, emoji: '😍', color: '#33A852'},
];

// Reused purely to time a round trip for NetRTT — using dynamic API base URL
const RTT_PROBE_URL = `${API_SERVICES_URL}/GetAppConfig`;

const measureRTT = async () => {
  try {
    const start = Date.now();
    await fetch(RTT_PROBE_URL, {method: 'HEAD'});
    return Date.now() - start;
  } catch {
    return null;
  }
};

// Best-effort device/network snapshot, gathered only at Submit time (not
// for Skip/Not Interested, to keep those instant).
const gatherDeviceAndNetworkInfo = async () => {
  let netType = '';
  let netSpeed = '';
  let netEtype = '';
  let ipAddress = '';

  try {
    const state = await NetInfo.fetch();
    console.log('NetInfo state:', JSON.stringify(state, null, 2));

    netType = (state?.type || '').toUpperCase(); // WIFI / CELLULAR / NONE / UNKNOWN

    if (state?.type === 'wifi' && state?.details) {
      // linkSpeed (Mbps) is Android-only via NetInfo — unavailable on iOS
      if (
        state.details.linkSpeed !== undefined &&
        state.details.linkSpeed !== null
      ) {
        netSpeed = `${state.details.linkSpeed}Mbps`;
      }
      ipAddress = state.details.ipAddress || '';
    }

    if (state?.type === 'cellular' && state?.details) {
      netEtype = (state.details.cellularGeneration || '').toUpperCase(); // 2G/3G/4G/5G
      ipAddress = state.details.ipAddress || ipAddress;
    }
  } catch (error) {
    console.log('NetInfo error:', error);
    // leave defaults if NetInfo isn't available on this device/build
  }

  let userAgent = '';
  try {
    if (DeviceInfo.getUserAgent) {
      userAgent = await DeviceInfo.getUserAgent();
    }
  } catch {
    userAgent = '';
  }

  const rtt = await measureRTT();

  const networkInfo = {
    netType,
    netSpeed,
    netEtype,
    netRTT: rtt !== null ? String(rtt) : '',
    userAgent,
    ipAddress,
    deviceId: DeviceInfo.getDeviceId ? DeviceInfo.getDeviceId() : '',
  };

  console.log('Gathered network info:', networkInfo);
  return networkInfo;
};

// The "Other" option now comes from GetAppConfig itself (FDBK_CONFIG_ID: 0,
// FDBK_VALUE: "Other") rather than being a synthetic client-side entry.
// This is the only tag that forces the comment box to be mandatory.
const isOtherTag = tag =>
  !!tag &&
  (Number(tag.FDBK_CONFIG_ID) === 0 ||
    (tag.FDBK_VALUE || '').trim().toLowerCase() === 'other');

const FeedbackModal = ({
  visible,
  onSkip,           // "Skip for now" button — Home.js stores the 1-day cooldown
  onDismiss,        // X button / backdrop / swipe-down — just closes without cooldown
  onSubmitted,       // Called after the Thank You panel finishes showing
  onNotInterested,   // Called after a successful Not Interested call
  campaignId,
  AppUserData,
  authContext,
  trigger = 'login',
}) => {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null); // tag object from API, or null
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false); // === THANK YOU: success panel ===

  // ── Delayed-appearance state: `visible` can flip true immediately from the
  // parent, but the sheet itself only becomes visible after SHOW_DELAY_MS ──
  const [shown, setShown] = useState(false);
  const showTimerRef = useRef(null);
  const thankYouTimerRef = useRef(null); // === THANK YOU: auto-close timer ===
  const confettiTimerRef = useRef(null); // === THANK YOU: confetti fire timer ===
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (visible) {
      showTimerRef.current = setTimeout(() => setShown(true), SHOW_DELAY_MS);
    } else {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      setShown(false);
    }
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [visible]);

  // Clear any pending timers on unmount
  useEffect(() => {
    return () => {
      if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    };
  }, []);

  // Per-emoji scale animation (bounce on select)
  const scaleAnims = useRef(RATING_CONFIG.map(() => new Animated.Value(1))).current;
  // Tag/comment section fade-slide-in once a rating is picked
  const tagSectionAnim = useRef(new Animated.Value(0)).current;

  // === THANK YOU: stroke-draw checkmark (circle then check), icon pop,
  // confetti burst, and text fade-in — Stripe / Google Pay style ===
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const circleProgress = useRef(new Animated.Value(0)).current;
  const checkProgress = useRef(new Animated.Value(0)).current;
  const thankTextOpacity = useRef(new Animated.Value(0)).current;
  const thankTextTranslateY = useRef(new Animated.Value(10)).current;
  const confettiAnims = useRef(
    Array.from({length: CONFETTI_COUNT}).map(() => ({
      translate: new Animated.Value(0),
      opacity: new Animated.Value(0),
      angle: Math.random() * Math.PI * 2,
      distance: 36 + Math.random() * 26,
      size: 5 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    })),
  ).current;

  const fireConfetti = () => {
    confettiAnims.forEach(p => {
      p.translate.setValue(0);
      p.opacity.setValue(1);
      Animated.parallel([
        Animated.timing(p.translate, {
          toValue: 1,
          duration: 650 + Math.random() * 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 550,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  useEffect(() => {
    if (showThankYou) {
      Vibration.vibrate(35); // subtle haptic tick on success, same as Swiggy/Zomato-style confirmations

      iconScale.setValue(0.6);
      circleProgress.setValue(0);
      checkProgress.setValue(0);
      thankTextOpacity.setValue(0);
      thankTextTranslateY.setValue(10);
      confettiAnims.forEach(p => {
        p.translate.setValue(0);
        p.opacity.setValue(0);
      });

      Animated.sequence([
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(circleProgress, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false, // stroke props aren't supported by the native driver
        }),
        Animated.timing(checkProgress, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.parallel([
          Animated.timing(thankTextOpacity, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(thankTextTranslateY, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Confetti bursts right as the circle finishes drawing and the check begins
      confettiTimerRef.current = setTimeout(fireConfetti, 560);
    }
  }, [showThankYou]);

  useEffect(() => {
    RATING_CONFIG.forEach((r, i) => {
      Animated.spring(scaleAnims[i], {
        toValue: rating === r.value ? 1.18 : 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    });

    Animated.timing(tagSectionAnim, {
      toValue: rating > 0 ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [rating]);

  useEffect(() => {
    if (visible) {
      setRating(0);
      setTags([]);
      setSelectedTag(null);
      setCommentText('');
      setSubmitting(false);
      setShowThankYou(false); // === THANK YOU: reset on fresh open ===
      if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
      tagSectionAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (rating > 0 && rating <= 5 && tags.length === 0 && !tagsLoading) {
      fetchFeedbackTags(rating);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rating]);

  const fetchFeedbackTags = (ratingValue) => {
    const token = AppUserData?.token;
    setTagsLoading(true);

    // Determine keyword based on rating
    const keyword = ratingValue <= 3 ? 'HR_ASSIST_FEED_NEGATIVE' : 'HR_ASSIST_FEED_POSITIVE';

    ApiService.PostMethode(
      '/GetAppConfig',
      {AppID: '1', Keyword: keyword},
      token,
      authContext,
    )
      .then(result => {
        setTagsLoading(false);
        const tagList = Array.isArray(result?.Value) ? result.Value : [];
        // Sort tags to ensure "Other" option appears at the end
        const sortedTags = tagList.sort((a, b) => {
          const aIsOther = isOtherTag(a);
          const bIsOther = isOtherTag(b);
          if (aIsOther && !bIsOther) return 1;
          if (!aIsOther && bIsOther) return -1;
          return 0;
        });
        setTags(sortedTags);
      })
      .catch(error => {
        setTagsLoading(false);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  const handleSelectRating = value => {
    setRating(value);
    setTags([]); // Clear tags to trigger fresh fetch
    setSelectedTag(null);
    setCommentText('');
  };

  const handleSelectTag = tag => {
    setSelectedTag(tag);
    setCommentText('');
  };

  const needsTagSelection = rating > 0 && rating <= 5;

  const isSubmitDisabled = () => {
    if (submitting || rating === 0) return true;
    if (needsTagSelection) {
      if (!selectedTag) return true;
      if (isOtherTag(selectedTag) && commentText.trim().length === 0) {
        return true;
      }
    }
    return false;
  };

  const buildPayload = (overrides = {}) => {
    const username = AppUserData?.data?.username || '';
    const userNT = AppUserData?.data?.userNT || '';
    const employeeId = AppUserData?.data?.userId || '';
    const token = AppUserData?.token;

    let tagId = '';
    let tagName = '';

    if (selectedTag && selectedTag.FDBK_CONFIG_ID !== undefined) {
      tagId = String(selectedTag.FDBK_CONFIG_ID); // includes "0" for Other
      tagName = selectedTag.FDBK_VALUE || '';
    }

    const payload = {
      AppID: '1',
      SessionID: `${username}_${Date.now()}`, // no shared session-id source exists elsewhere yet
      EmployeeID: employeeId,
      UserRole: 'employee',
      Trigger: trigger,
      RingiRef: '',
      Rating: String(rating),
      TagID: tagId,
      TagName: tagName,
      Comments: commentText.trim(),
      Event:
        campaignId !== undefined && campaignId !== null
          ? String(campaignId)
          : '',
      NetType: '',
      NetSpeed: '',
      NetEtype: '',
      NetRTT: '',
      UserAgent: '',
      IPAddress: '',
      DeviceID: DeviceInfo.getDeviceId ? DeviceInfo.getDeviceId() : '',
      DeviceType: 'mobile',
      UserName: userNT,
      token,
    };

    return {...payload, ...overrides};
  };

  const callSubmitFeedback = (overrides, onDone, onSuccess) => {
    console.log('buildPayload overrides:', JSON.stringify(overrides, null, 2));
    const {token, ...apiData} = buildPayload(overrides);

    console.log('SubmitFeedbackG final payload:', JSON.stringify(apiData, null, 2));

    ApiService.PostMethode('/SubmitFeedbackG', apiData, token, authContext)
      .then(response => {
        console.log(
          'SubmitFeedbackG response:',
          JSON.stringify(response, null, 2),
        );
        onDone();
        if (onSuccess) onSuccess();
      })
      .catch(error => {
        console.log('SubmitFeedbackG error:', JSON.stringify(error, null, 2));
        onDone();
        ApiService.showErrorMessage(error, authContext);
      });
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled()) return;
    setSubmitting(true);

    const netInfo = await gatherDeviceAndNetworkInfo();

    const networkOverrides = {
      NetType: netInfo.netType || '',
      NetSpeed: netInfo.netSpeed || '',
      NetEtype: netInfo.netEtype || '',
      NetRTT: netInfo.netRTT || '',
      UserAgent: netInfo.userAgent || '',
      IPAddress: netInfo.ipAddress || '',
      DeviceID: netInfo.deviceId || '',
    };

    console.log('Network overrides being sent:', networkOverrides);

    callSubmitFeedback(
      networkOverrides,
      () => setSubmitting(false),
      () => {
        // === THANK YOU: show the success panel, then let the parent close
        // the modal after it's had time to play out ===
        setShowThankYou(true);
        thankYouTimerRef.current = setTimeout(() => {
          if (onSubmitted) onSubmitted();
        }, THANK_YOU_DISPLAY_MS);
      },
    );
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
  };

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
  };

  const activeConfig = RATING_CONFIG.find(r => r.value === rating);

  // Don't render the modal at all if not visible - prevents touch blocking issues
  if (!visible && !shown) {
    return null;
  }

  return (
    <Modal
      isVisible={shown}
      onBackdropPress={showThankYou ? undefined : handleDismiss}
      onSwipeComplete={showThankYou ? undefined : handleDismiss}
      swipeDirection={showThankYou ? [] : ['down']}
      propagateSwipe
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.45}
      useNativeDriver
      avoidKeyboard={true}
      style={fbStyles.modalWrapper}
      onModalHide={() => {
        // Ensure modal is fully cleaned up after hide animation
        if (!visible) {
          setShown(false);
        }
      }}>
      <View style={fbStyles.sheet}>
        {/* Drag handle */}
        <View style={fbStyles.dragHandle} />

        {showThankYou ? (
          // ── === THANK YOU: success panel (SVG stroke-draw checkmark + confetti) === ──
          <View style={fbStyles.thankYouWrap}>
            <Animated.View
              style={[
                fbStyles.thankYouIconWrap,
                {transform: [{scale: iconScale}]},
              ]}>
              {confettiAnims.map((p, i) => (
                <Animated.View
                  key={i}
                  pointerEvents="none"
                  style={[
                    fbStyles.confettiDot,
                    {
                      width: p.size,
                      height: p.size,
                      borderRadius: p.size / 2,
                      backgroundColor: p.color,
                      opacity: p.opacity,
                      transform: [
                        {
                          translateX: p.translate.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, Math.cos(p.angle) * p.distance],
                          }),
                        },
                        {
                          translateY: p.translate.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, Math.sin(p.angle) * p.distance],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}

              <Svg width={84} height={84} viewBox="0 0 100 100">
                <AnimatedCircle
                  cx={50}
                  cy={50}
                  r={SUCCESS_CIRCLE_R}
                  stroke="#33A852"
                  strokeWidth={6}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={SUCCESS_CIRCLE_CIRCUMFERENCE}
                  strokeDashoffset={circleProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SUCCESS_CIRCLE_CIRCUMFERENCE, 0],
                  })}
                  origin="50, 50"
                  rotation="-90"
                />
                <AnimatedPath
                  d={SUCCESS_CHECK_PATH}
                  stroke="#33A852"
                  strokeWidth={7}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={SUCCESS_CHECK_LENGTH}
                  strokeDashoffset={checkProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SUCCESS_CHECK_LENGTH, 0],
                  })}
                />
              </Svg>
            </Animated.View>

            <Animated.View
              style={{
                opacity: thankTextOpacity,
                transform: [{translateY: thankTextTranslateY}],
                alignItems: 'center',
              }}>
              <Text style={fbStyles.thankYouTitle} Bold>
                Thank You!
              </Text>
              <Text style={fbStyles.thankYouSubtitle}>
                Your feedback helps us make HR Assist better for everyone.
              </Text>
            </Animated.View>
          </View>
        ) : (
          <>
            <View style={fbStyles.header}>
              <View style={{flex: 1}}>
                <Text style={fbStyles.headerTitle} Bold>
                  Rate Your Experience
                </Text>
                <Text style={fbStyles.headerSubtitle}>
                  Help us make HR Assist better for you
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleDismiss}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="close" size={22} color="#9B9B9B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={fbStyles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* Emoji rating row */}
              <View style={fbStyles.emojiRow}>
                {RATING_CONFIG.map((item, i) => {
                  const active = rating === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      activeOpacity={0.75}
                      onPress={() => handleSelectRating(item.value)}
                      style={fbStyles.emojiTouchable}>
                      <Animated.View
                        style={[
                          fbStyles.emojiCircle,
                          {transform: [{scale: scaleAnims[i]}]},
                          active && {
                            backgroundColor: `${item.color}1A`,
                            borderColor: item.color,
                          },
                        ]}>
                        <Text style={fbStyles.emojiText}>{item.emoji}</Text>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {rating > 0 && (
                <View style={fbStyles.ratingLabelWrap}>
                  <View
                    style={[
                      fbStyles.ratingLabelDot,
                      {backgroundColor: activeConfig?.color},
                    ]}
                  />
                  <Text
                    style={[fbStyles.ratingLabel, {color: activeConfig?.color}]}
                    Bold>
                    {RATING_LABELS[rating]}
                  </Text>
                </View>
              )}

              {needsTagSelection && (
                <Animated.View
                  style={[
                    fbStyles.tagSection,
                    {
                      opacity: tagSectionAnim,
                      transform: [
                        {
                          translateY: tagSectionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 0],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <Text style={fbStyles.tagPrompt}>
                    {rating <= 3
                      ? 'What went wrong?'
                      : 'What did you like the most?'}
                  </Text>

                  {tagsLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={ThemeColor.TealDark}
                      style={{marginTop: 16, marginBottom: 8}}
                    />
                  ) : (
                    <View style={fbStyles.tagWrap}>
                      {tags.map((tag, index) => {
                        const active = selectedTag === tag;
                        return (
                          <TouchableOpacity
                            key={`${tag.FDBK_CONFIG_ID}_${index}`}
                            activeOpacity={0.75}
                            onPress={() => handleSelectTag(tag)}
                            style={[
                              fbStyles.tagChip,
                              active && fbStyles.tagChipActive,
                            ]}>
                            {active && (
                              <Ionicons
                                name="checkmark-circle"
                                size={15}
                                color="#ffffff"
                                style={{marginRight: 5}}
                              />
                            )}
                            <Text
                              style={[
                                fbStyles.tagChipText,
                                active && fbStyles.tagChipTextActive,
                              ]}>
                              {tag.FDBK_VALUE}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {!!selectedTag && (
                    <View style={fbStyles.commentCard}>
                      <TextInput
                        style={fbStyles.commentBox}
                        placeholder={
                          isOtherTag(selectedTag)
                            ? 'Please tell us more…'
                            : 'Additional comments (optional)'
                        }
                        placeholderTextColor="#A6A6A6"
                        multiline
                        numberOfLines={4}
                        value={commentText}
                        onChangeText={setCommentText}
                        onFocus={() => {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({animated: true});
                          }, 300);
                        }}
                      />
                    </View>
                  )}
                </Animated.View>
              )}
            </ScrollView>

            {/* Footer - Always visible at bottom */}
            <View style={fbStyles.footer}>
              <TouchableOpacity
                style={fbStyles.submitBtn}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={isSubmitDisabled()}>
                <LinearGradient
                  colors={
                    isSubmitDisabled()
                      ? [ThemeColor.TealSoft, ThemeColor.TealSoft]
                      : [ThemeColor.TealDark, ThemeColor.TealDark]
                  }
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={fbStyles.submitGradient}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={fbStyles.submitBtnText} Bold>
                        Submit Feedback
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#ffffff"
                        style={{marginLeft: 6}}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={fbStyles.secondaryRow}>
                <TouchableOpacity
                  onPress={handleSkip}
                  disabled={submitting}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={fbStyles.secondaryLink}>Maybe later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const fbStyles = StyleSheet.create({
  modalWrapper: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: SCREEN_W,
    maxHeight: Dimensions.get('window').height * 0.85,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#E2E2E2',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerTitle: {fontSize: 19, color: '#1A1A2E'},
  headerSubtitle: {
    fontSize: 12.5,
    color: '#8A8A8F',
    marginTop: 3,
  },
  scrollContent: {paddingBottom: 4},
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  emojiTouchable: {
    alignItems: 'center',
  },
  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#F5F5F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {fontSize: 26},
  ratingLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  ratingLabelDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  ratingLabel: {
    fontSize: 14.5,
    letterSpacing: 0.2,
  },
  tagSection: {marginTop: 20},
  tagPrompt: {fontSize: 14, color: '#1A1A2E', marginBottom: 12, fontWeight: '600'},
  tagWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E1E2ED',
    backgroundColor: '#F9F9FC',
  },
  tagChipActive: {
    backgroundColor: ThemeColor.TealDark,
    borderColor: ThemeColor.TealDark,
    shadowColor: ThemeColor.TealDark,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  tagChipText: {fontSize: 13, color: '#4C4C57', fontWeight: '500'},
  tagChipTextActive: {color: '#ffffff'},
  commentCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EAEAF2',
    backgroundColor: '#FAFAFD',
    borderRadius: 14,
    padding: 4,
  },
  commentBox: {
    padding: 12,
    fontSize: 13.5,
    color: '#333333',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  footer: {
    marginTop: 18,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryLink: {
    fontSize: 13,
    color: '#6B6B76',
    fontWeight: '600',
  },
  secondaryDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#DCDCE3',
    marginHorizontal: 16,
  },
  // === THANK YOU: success panel styles ===
  thankYouWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  thankYouIconWrap: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    position: 'relative',
  },
  confettiDot: {
    position: 'absolute',
    top: 38,
    left: 38,
  },
  thankYouTitle: {
    fontSize: 21,
    color: '#1A1A2E',
    marginBottom: 8,
  },
  thankYouSubtitle: {
    fontSize: 13.5,
    color: '#8A8A8F',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
});

export default FeedbackModal;