import React, {useState, useEffect, useContext, useRef, memo, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Text from '../components/reusable/Text';
import RenderHtml from 'react-native-render-html';
import * as ApiService from '../Utils/Utils';
import AuthContext from '../context/AuthContext';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../constants/Colors';
import {Decrypt} from '../Service/Helper';

// Memoized HTML Content Component to prevent unnecessary re-renders
const ConsentHtmlContent = memo(({html, contentWidth}) => {
  const tagsStyles = useMemo(() => ({
    body: {
      fontSize: 14,
      color: GlobalColor.Text,
      lineHeight: 22,
      textAlign: 'left',
    },
    div: {
      marginBottom: 8,
    },
    p: {
      marginTop: 0,
      marginBottom: 12,
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'left',
    },
    h1: {
      fontSize: 19,
      fontWeight: 'bold',
      color: GlobalColor.Primary,
      marginBottom: 12,
      marginTop: 0,
      textAlign: 'left',
      letterSpacing: 0.3,
    },
    h2: {
      fontSize: 17,
      fontWeight: 'bold',
      color: GlobalColor.Primary,
      marginBottom: 10,
      marginTop: 16,
      textAlign: 'left',
      letterSpacing: 0.2,
    },
    h3: {
      fontSize: 15,
      fontWeight: '600',
      color: GlobalColor.Primary,
      marginBottom: 8,
      marginTop: 14,
      textAlign: 'left',
      letterSpacing: 0.2,
    },
    ol: {
      marginLeft: 8,
      marginBottom: 12,
      paddingLeft: 12,
    },
    ul: {
      marginLeft: 8,
      marginBottom: 12,
      paddingLeft: 12,
    },
    li: {
      marginBottom: 8,
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'left',
    },
    strong: {
      fontWeight: '600',
      color: GlobalColor.Primary,
    },
    b: {
      fontWeight: '600',
      color: GlobalColor.Primary,
    },
    em: {
      fontStyle: 'italic',
      color: GlobalColor.Text,
    },
    a: {
      color: GlobalColor.Secondary,
      textDecorationLine: 'underline',
    },
  }), []);

  return (
    <RenderHtml
      contentWidth={contentWidth}
      source={{html}}
      tagsStyles={tagsStyles}
    />
  );
});

ConsentHtmlContent.displayName = 'ConsentHtmlContent';

const ConsentModal = ({visible, onClose, onSubmitted, consentData}) => {
  const {authContext, AppUserData} = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const {width: windowWidth} = Dimensions.get('window');
  const scrollViewRef = useRef(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lastProgressUpdate = useRef(0);

  // Success animation values
  const successCheckmarkScale = useRef(new Animated.Value(0)).current;
  const successCheckmarkRotate = useRef(new Animated.Value(0)).current;
  const successCircleScale = useRef(new Animated.Value(0)).current;
  const successRippleScale = useRef(new Animated.Value(0.7)).current;
  const successRippleOpacity = useRef(new Animated.Value(0)).current;
  const successTextFade = useRef(new Animated.Value(0)).current;
  const successTextSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      // Reset states when opening
      setScrollProgress(0);
      setHasScrolledToBottom(false);
      setShowSuccess(false);
      setSelectedLanguage('english');
      scaleAnim.setValue(0.3);
      fadeAnim.setValue(0);
      progressAnim.setValue(0);
      lastProgressUpdate.current = 0;

      // Reset success animation values
      successCheckmarkScale.setValue(0);
      successCheckmarkRotate.setValue(0);
      successCircleScale.setValue(0);
      successRippleScale.setValue(0.7);
      successRippleOpacity.setValue(0);
      successTextFade.setValue(0);
      successTextSlide.setValue(30);
    }
  }, [visible, scaleAnim, fadeAnim, progressAnim, successCheckmarkScale, successCheckmarkRotate, successCircleScale, successRippleScale, successRippleOpacity, successTextFade, successTextSlide]);

  // Success animation - Clean, smooth, aesthetic animation
  const playSuccessAnimation = () => {
    console.log('ConsentModal: Playing success animation');
    setShowSuccess(true);

    // Use setTimeout to ensure state update completes
    setTimeout(() => {
      requestAnimationFrame(() => {
        console.log('ConsentModal: Starting success animations');

        // Stage 1: Circle appears with smooth bounce
        Animated.spring(successCircleScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }).start(() => {
          console.log('ConsentModal: Circle appeared');
        });

        // Stage 2: Background ripple expands and fades (simultaneous with circle)
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(successRippleScale, {
              toValue: 1.4,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(successRippleOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(successRippleOpacity, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }, 50);

        // Stage 3: Checkmark bounces in
        setTimeout(() => {
          Animated.spring(successCheckmarkScale, {
            toValue: 1,
            tension: 50,
            friction: 6,
            useNativeDriver: true,
          }).start(() => {
            console.log('ConsentModal: Checkmark appeared');
          });
        }, 250);

        // Stage 4: Text slides up and fades in
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(successTextFade, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.spring(successTextSlide, {
              toValue: 0,
              tension: 50,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start(() => {
            console.log('ConsentModal: All animations completed');
          });
        }, 450);
      });
    }, 100);
  };

  // Scroll to bottom handler
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({animated: true});
    }
  };

  // Handle scroll event with progress tracking - optimized to reduce re-renders
  const handleScroll = ({nativeEvent}) => {
    const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;

    // Calculate scroll progress (0 to 1)
    const scrollRange = contentSize.height - layoutMeasurement.height;
    const progress = Math.min(Math.max(contentOffset.y / scrollRange, 0), 1);

    // Only update if progress changed by more than 2% to reduce re-renders
    const progressPercent = Math.round(progress * 100);
    if (Math.abs(progressPercent - lastProgressUpdate.current) >= 2) {
      lastProgressUpdate.current = progressPercent;
      setScrollProgress(progress);

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }

    // Check if reached bottom
    const paddingToBottom = 20;
    const isScrolledToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isScrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
      console.log('ConsentModal: User has scrolled to bottom');
    }
  };

  // Fetch missing fields from GetEmployeeProfile API
  const fetchMissingProfileFields = async (fieldsToFetch) => {
    try {
      const token = AppUserData?.token;
      const username = AppUserData?.data?.username;

      if (!token || !username) {
        console.log('ConsentModal: Missing token or username for GetEmployeeProfile');
        return {};
      }

      const payload = {
        UserName: username,
      };

      console.log('ConsentModal: Fetching missing profile fields from GetEmployeeProfile:', fieldsToFetch);

      const result = await ApiService.PostMethode(
        '/GetEmployeeProfile',
        payload,
        token,
        authContext,
      );

      if (result?.Value?.Table1 && result.Value.Table1.length > 0) {
        const data = result.Value.Table1[0];
        const fetchedFields = {};

        if (fieldsToFetch.includes('empldob') && data.EMPL_BIRTH_DATE) {
          fetchedFields.empldob = Decrypt(data.EMPL_BIRTH_DATE);
          console.log('ConsentModal: Fetched empldob:', fetchedFields.empldob);
        }

        if (fieldsToFetch.includes('emplemailid') && data.EMPL_EMAIL_ID) {
          fetchedFields.emplemailid = Decrypt(data.EMPL_EMAIL_ID);
          console.log('ConsentModal: Fetched emplemailid:', fetchedFields.emplemailid);
        }

        return fetchedFields;
      } else {
        console.warn('ConsentModal: Invalid GetEmployeeProfile response structure');
        return {};
      }
    } catch (error) {
      console.error('ConsentModal: Error fetching profile fields from GetEmployeeProfile:', error);
      return {};
    }
  };

  // Log consent submission error to backend
  const logConsentError = async (errorCode, errorDesc) => {
    try {
      const token = AppUserData?.token;

      const logPayload = {
        AppId: '1',
        AppModu: 'DPDP_CONS_FORM',
        Actn: 'SUBMIT',
        StatCode: errorCode,
        StatDesc: errorDesc,
        ReslFlag: 'N',
      };

      console.log('ConsentModal: Logging error to InsAppStatLog:', JSON.stringify(logPayload, null, 2));

      const result = await ApiService.PostMethode(
        '/InsAppStatLog',
        logPayload,
        token,
        authContext,
      );

      if (result?.Value === 'SUCCESS') {
        console.log('ConsentModal: Error logged successfully');
      } else {
        console.warn('ConsentModal: Error log response:', result);
      }
    } catch (logError) {
      console.error('ConsentModal: Failed to log error:', logError);
      // Don't throw - this is a non-blocking operation
    }
  };

  // Submit consent
  const handleSubmitConsent = async () => {
    if (!consentData) {
      console.error('ConsentModal: No consent data available');
      return;
    }

    setSubmitting(true);

    try {
      const token = AppUserData?.token;

      // Check what fields are missing and fetch them in one API call
      const fieldsToFetch = [];
      if (!AppUserData?.data?.empldob) fieldsToFetch.push('empldob');
      if (!AppUserData?.data?.emplemailid) fieldsToFetch.push('emplemailid');

      let fetchedFields = {};
      if (fieldsToFetch.length > 0) {
        console.log('ConsentModal: ⚠️  Missing fields in context:', fieldsToFetch.join(', '));
        fetchedFields = await fetchMissingProfileFields(fieldsToFetch);
      }

      // Get email and append @maruti.co.in if not present
      let userEmail = AppUserData?.data?.emplemailid || fetchedFields.emplemailid || '';
      userEmail = userEmail ? String(userEmail).trim() : '';

      if (userEmail && !userEmail.includes('@')) {
        userEmail = userEmail + '@maruti.co.in';
        console.log('ConsentModal: Appended domain to email:', userEmail);
      }

      // Calculate age from empldob
      let userAge = null;
      let emplDob = AppUserData?.data?.empldob || fetchedFields.empldob;

      if (emplDob) {
        try {
          console.log('ConsentModal: empldob value:', emplDob);

          const dobString = emplDob.toString().trim();
          const dob = new Date(dobString);

          if (isNaN(dob.getTime())) {
            throw new Error('Invalid date format');
          }

          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();

          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
          }

          if (age > 0 && age < 120) {
            userAge = age;
            console.log('ConsentModal: Calculated age from empldob:', userAge, '(DOB:', dob.toLocaleDateString(), ')');
          } else {
            console.warn('ConsentModal: Calculated age seems invalid:', age);
          }
        } catch (error) {
          console.error('ConsentModal: Error calculating age from empldob:', error);
        }
      } else {
        console.log('ConsentModal: empldob not available, age will be null');
      }

      // Get EmployeeID from context
      const employeeId = AppUserData?.data?.userId
        ? String(AppUserData.data.userId).trim()
        : '';

      // Add country code (91) to phone number
      const phoneWithCountryCode = `91${consentData.phone}`;

      console.log('ConsentModal: Submitting with Phone:', JSON.stringify(phoneWithCountryCode));
      console.log('ConsentModal: Submitting with Email:', JSON.stringify(userEmail));
      console.log('ConsentModal: Submitting with Age:', userAge);
      console.log('ConsentModal: Submitting with EmployeeID:', JSON.stringify(employeeId));

      const payload = {
        Phone: phoneWithCountryCode,
        Email: userEmail,
        Age: userAge,
        PurposeIds: consentData.parentPurposeIds,
        CustomIDType: "staffid",
        EmployeeID: employeeId,
        UserAgent: "Mozilla/5.0"
      };

      console.log('ConsentModal: CollectDPDPConsent payload:', JSON.stringify(payload, null, 2));

      const result = await ApiService.PostMethode(
        '/CollectDPDPConsent',
        payload,
        token,
        authContext,
      );

      if (result?.Value) {
        const parsedData = JSON.parse(result.Value);

        if (parsedData?.error === false) {
          console.log('ConsentModal: Consent submitted successfully');
          console.log('ConsentModal: Response data:', parsedData.data);

          setSubmitting(false);

          // Play success animation
          playSuccessAnimation();

          // Wait 2 seconds then close modal
          setTimeout(() => {
            if (onSubmitted) {
              onSubmitted();
            } else {
              onClose();
            }
          }, 2000);
        } else {
          throw new Error('Failed to submit consent');
        }
      }
    } catch (error) {
      console.error('ConsentModal: Error submitting consent:', error);

      // Log error to backend without blocking user
      try {
        const errorCode = error?.status || error?.code || 'ERR001';
        const errorDesc = error?.message || error?.toString() || 'Consent submission failed';

        await logConsentError(errorCode, errorDesc);

        // Show user-friendly message
        ApiService.showErrorMessage(
          'Your consent could not be captured at this time. The issue has been logged and you can continue using the app.',
          authContext
        );
      } catch (logError) {
        console.error('ConsentModal: Failed to log error:', logError);
        ApiService.showErrorMessage(error, authContext);
      }

      setSubmitting(false);

      // Close modal after showing message so user can continue
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  };

  // Don't show modal if no consent data
  if (!consentData) {
    return null;
  }

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={undefined}
      onBackButtonPress={undefined}
      style={styles.modal}
      animationIn="fadeInUp"
      animationOut="fadeOutDown"
      backdropOpacity={0.6}
      useNativeDriver={true}>
      <View style={[styles.container, showSuccess && styles.successModalContainer]}>
        {showSuccess ? (
          // Success View - Clean, Modern, Aesthetic Design
          <View style={styles.successContainer}>
            <View style={styles.successInnerContainer}>
              {/* Single Clean Animated Circle with Checkmark */}
              <Animated.View
                style={[
                  styles.successCircleWrapper,
                  {
                    opacity: successCircleScale,
                    transform: [{scale: successCircleScale}],
                  },
                ]}>
                {/* Soft Background Circle - Animated Ripple */}
                <Animated.View
                  style={[
                    styles.successBackgroundCircle,
                    {
                      opacity: successRippleOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.15],
                      }),
                      transform: [{scale: successRippleScale}],
                    },
                  ]}
                />

                {/* Main Success Circle with Gradient Border */}
                <View style={styles.successCircleBorder}>
                  <LinearGradient
                    colors={[ThemeColor.Teal, ThemeColor.TealDark]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.successCircleGradient}>
                    <View style={styles.successCircleInner}>
                      {/* Checkmark Icon */}
                      <Animated.View
                        style={{
                          transform: [{scale: successCheckmarkScale}],
                        }}>
                        <Ionicons name="checkmark-circle" size={70} color={ThemeColor.Teal} />
                      </Animated.View>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>

              {/* Animated Text Content */}
              <Animated.View
                style={[
                  styles.successTextContainer,
                  {
                    opacity: successTextFade,
                    transform: [{translateY: successTextSlide}],
                  },
                ]}>
                <Text style={styles.successTitle} Bold>
                  Declaration Submitted!
                </Text>
              </Animated.View>
            </View>
          </View>
        ) : (
          <>
            {/* Modern Header */}
            <View style={styles.header}>
              <View style={styles.headerContentWrapper}>
                <View style={styles.headerIconBg}>
                  <Ionicons name="shield-checkmark" size={32} color={GlobalColor.Primary} />
                </View>
                <View style={styles.headerTextWrapper}>
                  <Text style={styles.headerTitle} Bold>
                    DECLARATION FOR PROCESSING OF PERSONAL DATA
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    Please review and accept to continue
                  </Text>
                </View>
              </View>

              {/* Language Selector - Both options visible */}
              <View style={styles.languageSelector}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    selectedLanguage === 'english' && styles.languageButtonActive
                  ]}
                  onPress={() => {
                    if (selectedLanguage !== 'english') {
                      setSelectedLanguage('english');
                      setScrollProgress(0);
                      setHasScrolledToBottom(false);
                      progressAnim.setValue(0);
                      lastProgressUpdate.current = 0;
                    }
                  }}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.languageButtonText,
                      selectedLanguage === 'english' && styles.languageButtonTextActive
                    ]}
                    Bold={selectedLanguage === 'english'}>
                    English
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    selectedLanguage === 'hindi' && styles.languageButtonActive
                  ]}
                  onPress={() => {
                    if (selectedLanguage !== 'hindi') {
                      setSelectedLanguage('hindi');
                      setScrollProgress(0);
                      setHasScrolledToBottom(false);
                      progressAnim.setValue(0);
                      lastProgressUpdate.current = 0;
                    }
                  }}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.languageButtonText,
                      selectedLanguage === 'hindi' && styles.languageButtonTextActive
                    ]}
                    Bold={selectedLanguage === 'hindi'}>
                    हिंदी
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {hasScrolledToBottom ? '✓ Review Complete' : `${Math.round(scrollProgress * 100)}% reviewed`}
              </Text>
            </View>

            {/* Content Card */}
            <View style={styles.contentCard}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.contentScroll}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
                onScroll={handleScroll}
                scrollEventThrottle={100}
                key={selectedLanguage}>
                {consentData ? (
                  <View style={styles.htmlWrapper}>
                    <ConsentHtmlContent
                      html={selectedLanguage === 'english' ? consentData.htmlEnglish : consentData.htmlHindi}
                      contentWidth={windowWidth * 0.94 - 80}
                    />
                  </View>
                ) : (
                  <Text style={styles.noDataText}>
                    No consent information available.
                  </Text>
                )}
              </ScrollView>

              {/* Floating Scroll to Bottom Button */}
              {!hasScrolledToBottom && scrollProgress > 0.1 && (
                <TouchableOpacity
                  style={styles.scrollToBottomButton}
                  onPress={scrollToBottom}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={[ThemeColor.Teal, ThemeColor.TealDark]}
                    style={styles.scrollButtonGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}>
                    <Ionicons name="arrow-down" size={24} color={GlobalColor.White} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Action Area */}
            <View style={styles.bottomContainer}>
              {!hasScrolledToBottom && (
                <View style={styles.scrollHintCard}>
                  <Ionicons name="arrow-down-circle" size={20} color={GlobalColor.Secondary} />
                  <Text style={styles.scrollHintText}>
                    Please scroll to read the full document
                  </Text>
                </View>
              )}

              {/* Action Button */}
              {!hasScrolledToBottom ? (
                <View style={styles.buttonWrapper}>
                  <View style={styles.submitButtonDisabled}>
                    <Ionicons name="lock-closed" size={20} color={GlobalColor.LightDark} />
                    <Text style={styles.submitButtonTextDisabled}>
                      I Confirm
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.buttonWrapper}
                  onPress={handleSubmitConsent}
                  disabled={submitting}
                  activeOpacity={0.85}>
                  <LinearGradient
                    colors={[ThemeColor.Teal, ThemeColor.Teal, ThemeColor.TealSoft]}
                    style={styles.submitButton}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                    {submitting ? (
                      <ActivityIndicator size="small" color={GlobalColor.White} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={22} color={GlobalColor.White} />
                        <Text style={styles.submitButtonText} Bold>
                           I Confirm
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  container: {
    backgroundColor: ThemeColor.TealLight,
    borderRadius: 24,
    maxHeight: Dimensions.get('window').height * 0.85,
    width: Dimensions.get('window').width * 0.94,
    overflow: 'hidden',
    shadowColor: GlobalColor.Black,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
    marginVertical: 16,
  },
  successModalContainer: {
    maxHeight: Dimensions.get('window').height * 0.65,
    height: 480,
    justifyContent: 'center',
  },

  // Header Styles
  header: {
    backgroundColor: ThemeColor.TealLight,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColor.TealLight,
  },
  headerContentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GlobalColor.White,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: GlobalColor.Primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: GlobalColor.Primary,
    letterSpacing: 0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: GlobalColor.LightDark,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  // Language Selector - Segmented Control Style
  languageSelector: {
    flexDirection: 'row',
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: ThemeColor.TealLight,
    borderRadius: 20,
    padding: 3,
    shadowColor: GlobalColor.Primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  languageButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 17,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonActive: {
    backgroundColor: GlobalColor.White,
    shadowColor: GlobalColor.Primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  languageButtonText: {
    fontSize: 14,
    color: GlobalColor.LightDark,
    letterSpacing: 0.2,
  },
  languageButtonTextActive: {
    color: GlobalColor.Primary,
    letterSpacing: 0.3,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GlobalColor.White,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: GlobalColor.Black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Progress Bar
  progressBarContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: ThemeColor.TealLight,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: ThemeColor.TealLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: GlobalColor.Secondary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: GlobalColor.Primary,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Content Card
  contentCard: {
    backgroundColor: GlobalColor.White,
    marginHorizontal: 20,
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GlobalColor.PrimaryLight,
    overflow: 'hidden',
  },
  contentScroll: {
    maxHeight: Dimensions.get('window').height * 0.38,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  htmlWrapper: {
    width: '100%',
    alignSelf: 'stretch',
  },
  noDataText: {
    fontSize: 15,
    color: GlobalColor.LightDark,
    textAlign: 'center',
    marginVertical: 40,
    fontStyle: 'italic',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: GlobalColor.Black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom Container
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: ThemeColor.TealLight,
  },
  scrollHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColor.TealLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: ThemeColor.TealLight,
  },
  scrollHintText: {
    fontSize: 13,
    color: GlobalColor.Primary,
    fontWeight: '600',
  },

  // Button Styles
  buttonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 4,
  },
  submitButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: GlobalColor.Secondary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: GlobalColor.White,
    fontSize: 16,
    letterSpacing: 0.4,
  },
  submitButtonDisabled: {
    flexDirection: 'row',
    backgroundColor: GlobalColor.Light,
    paddingVertical: 14,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: GlobalColor.PrimaryLight,
    borderRadius: 14,
  },
  submitButtonTextDisabled: {
    color: GlobalColor.LightDark,
    fontSize: 16,
    letterSpacing: 0.4,
    fontWeight: '600',
  },

  // Success Styles
  // Success Animation Styles - Clean, Modern, Aesthetic
  successContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  successInnerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  successCircleWrapper: {
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
    width: 140,
    height: 140,
  },
  successBackgroundCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: ThemeColor.Teal,
  },
  successCircleBorder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    padding: 4,
    backgroundColor: GlobalColor.White,
    shadowColor: ThemeColor.Teal,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  successCircleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 66,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircleInner: {
    width: '100%',
    height: '100%',
    borderRadius: 63,
    backgroundColor: GlobalColor.White,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  successTitle: {
    fontSize: 24,
    color: GlobalColor.Primary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  successSubtitle: {
    fontSize: 15,
    color: ThemeColor.Teal,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  successMessage: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
    opacity: 0.85,
  },
});

export default ConsentModal;
