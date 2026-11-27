// SignIn.js — HR Assist sign-in (dark glass sheet over the onboarding's last scene).
//
// Flow: onboarding orb → this screen (blurred "Built for every terrain" photo, original
// Maruti Suzuki + HR Assist logos, glass sheet) → Windows login, or OTP login
// (Staff ID → "Enter the code") → "Welcome, <name>" with a time-of-day greeting → app.
//
// FUNCTIONALITY IS UNCHANGED: every state, effect, handler, API call, validation rule
// and error condition is copied from the previous SignIn.js. The only difference in
// behaviour is presentational: after a successful login the welcome screen shows for
// ~2.4s (tap to skip) before the same authContext.signIn({payload}) call is made.

//import liraries
import React, {useEffect, useState, useContext, useRef} from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  StatusBar,
  TextInput as RNTextInput,
  Text as RNText,
  Platform,
  Keyboard,
  LayoutAnimation,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Formik} from 'formik';
import * as yup from 'yup';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AuthService, {AuthPost, showErrorMessage} from '../Service/AuthService';
import * as ApiService from './../Utils/Utils';
import AuthContext from '../context/AuthContext';
import Toast from 'react-native-simple-toast';
import Text from '../components/reusable/Text';
import {refreshStories} from '../components/home/storyStore';
import {refreshHistory} from '../components/home/historyStore';
import {Decrypt, encrypyDecrypt} from '../Service/Helper';

// ─── Assets ───
const BG_PHOTO = require('../assets/Images/splash/gypsy.jpg'); // last onboarding scene
const COCKPIT = require('../assets/Images/splash/cockpit.png'); // welcome scene
const GLOW = require('../assets/Images/splash/bloom_core.png'); // soft light, tinted teal
// Same full-colour wordmark as the sidebar & business card (8340×867)
const MSIL_LOGO = require('../assets/Images/MarutiLogo1.png');
const MSIL_RATIO = 867 / 8340;
const HR_LOGO = require('../assets/Images/hrass.png');

// ─── Tokens ───
// New MSIL palette (forest green · teal glow · amber), applied to this screen only for now
const C = {
  forest: '#0E2421', // page base
  forestDeep: '#0A1B19',
  forestMid: '#163B35',
  teal: '#2B8379', // Teal glow
  amber: '#F2CB8A', // Amber — the one highlighted action
  amberPressed: '#E4B56D',
  mint: '#9ED8CB',
  cream: '#F4F2EC',
  glass: 'rgba(14,38,34,0.86)',
  glassEdge: 'rgba(158,216,203,0.14)',
  fill: 'rgba(255,255,255,0.06)',
  fillBorder: 'rgba(255,255,255,0.13)',
  focus: '#F2CB8A',
  link: '#9ED8CB',
  white: '#FFFFFF',
  text2: 'rgba(244,242,236,0.66)',
  text3: 'rgba(244,242,236,0.38)',
  danger: '#FF9C8F',
  ink: '#16302B',
};
const E_LOGO = Easing.bezier(0.32, 0.72, 0, 1);
const E_OPEN = Easing.bezier(0.65, 0, 0.35, 1);
const WELCOME_HOLD = 2400;
const OTP_LENGTH = 4; // matches the existing maxLength={4}

// The blue hand-off from the onboarding orb plays once per app session
let hasPlayedArrival = false;

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) {
    return 'Good morning';
  }
  if (h < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
};
// Same rule as Home: the full EMPL_NAME as stored (HR records may start with
// a title, e.g. "MR. RAHUL SHARMA" — taking the first word showed just "Mr.").
const displayName = full => String(full || '').trim();
const maskMobile = otpMob =>
  otpMob == null ? '' : otpMob.slice(0, 2) + '•'.repeat(Math.max(0, otpMob.length - 6)) + otpMob.slice(-4);

// ─── Presentational pieces ───
const GlassField = ({label, focused, invalid, right, inputRef, ...input}) => (
  <Pressable
    onPress={() => inputRef?.current?.focus()}
    style={[styles.field, focused && styles.fieldFocused, invalid && styles.fieldInvalid]}>
    <View style={styles.flex}>
      <RNText style={[styles.fieldLabel, focused && {color: C.focus}, invalid && {color: C.danger}]}>{label}</RNText>
      <RNTextInput
        ref={inputRef}
        placeholderTextColor={C.text3}
        selectionColor={C.focus}
        keyboardAppearance="dark"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.fieldInput}
        {...input}
      />
    </View>
    {right}
  </Pressable>
);

const FieldError = ({children}) => (
  <View style={styles.errorRow}>
    <Ionicons name="alert-circle" size={14} color={C.danger} />
    <Text style={styles.error}>{children}</Text>
  </View>
);

const PillButton = ({title, onPress, style, busy, busyTitle}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const press = to => Animated.spring(scale, {toValue: to, useNativeDriver: true, speed: 40, bounciness: 0}).start();
  return (
    <Animated.View style={[{transform: [{scale}]}, styles.pillShadow, style]}>
      <Pressable
        onPress={onPress}
        disabled={busy}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        accessibilityRole="button"
        accessibilityState={{busy: !!busy, disabled: !!busy}}
        style={({pressed}) => [styles.pill, (pressed || busy) && {backgroundColor: C.amberPressed}]}>
        {busy ? (
          <View style={styles.pillBusy}>
            <ActivityIndicator size="small" color={C.ink} />
            <RNText style={[styles.pillText, styles.pillBusyText]}>{busyTitle || title}</RNText>
          </View>
        ) : (
          <RNText style={styles.pillText}>{title}</RNText>
        )}
      </Pressable>
    </Animated.View>
  );
};

const Segmented = ({values, selectedIndex, onTabPress}) => {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(Number(selectedIndex))).current;
  useEffect(() => {
    Animated.spring(x, {toValue: Number(selectedIndex), useNativeDriver: true, speed: 18, bounciness: 3}).start();
  }, [selectedIndex, x]);
  const segW = (w - 6) / values.length;
  return (
    <View style={styles.segment} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Animated.View
          style={[styles.segmentThumb, {width: segW, transform: [{translateX: x.interpolate({inputRange: [0, 1], outputRange: [0, segW]})}]}]}
        />
      )}
      {values.map((label, i) => (
        <Pressable
          key={label}
          onPress={() => onTabPress(i)}
          accessibilityRole="tab"
          accessibilityState={{selected: selectedIndex == i}}
          style={styles.segmentItem}>
          <RNText style={[styles.segmentText, selectedIndex == i && styles.segmentTextActive]}>{label}</RNText>
        </Pressable>
      ))}
    </View>
  );
};

// 4 code boxes driven by one hidden input (keeps a single onChangeText / value)
const CodeBoxes = ({value, onChangeText, onBlur}) => {
  const ref = useRef(null);
  const [focused, setFocused] = useState(true);
  const digits = String(value || '').split('');
  return (
    <Pressable style={styles.codeRow} onPress={() => ref.current?.focus()}>
      {Array.from({length: OTP_LENGTH}).map((_, i) => {
        const active = focused && i === Math.min(digits.length, OTP_LENGTH - 1);
        return (
          <View key={i} style={[styles.codeBox, digits[i] && styles.codeBoxFilled, active && styles.codeBoxActive]}>
            <RNText style={styles.codeDigit}>{digits[i] || ''}</RNText>
          </View>
        );
      })}
      <RNTextInput
        ref={ref}
        autoFocus
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={e => {
          setFocused(false);
          onBlur(e);
        }}
        maxLength={OTP_LENGTH}
        keyboardType="numeric"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        keyboardAppearance="dark"
        caretHidden
        style={styles.codeHidden}
      />
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const SignIn = ({navigation}) => {
  const {authContext, AppUserData} = useContext(AuthContext);
  const [showPass, setShowPass] = useState(true);
  const [Loader, setLoader] = useState(false);
  const [isSelectedAD, setSelectionAD] = useState(false);
  const [isSelectedOTP, setSelectionoOTP] = useState(false);
  const [isFieldOTP, setisFieldOTP] = useState(false);
  const [isFieldUser, setisFieldUser] = useState(true);
  const [Btn_GenOTP, setBtn_GenOTP] = useState(true);
  const [MarkAttandance, setMarkAttandance] = useState(0);
  const [countNum, setCountNum] = useState(1);
  const [isStarted, setIsStarted] = useState(false);
  const [hitCount, setHitCount] = useState(0);

  const [otp, setOtp] = useState('');
  const [minutes, setMinutes] = useState(4);
  const [seconds, setSeconds] = useState(59);
  const [otpExp, setOTPEXP] = useState('');
  const [otpMob, setOTPMob] = useState('');

  let timer = () => {};

  const [selectedId, setSelectedId] = useState('1');
  const [Usr_id, setUsr_ID] = useState('');

  // UI-only state
  const [focused, setFocused] = useState(null);
  const [welcome, setWelcome] = useState(null); // {name, payload}
  const insets = useSafeAreaInsets();
  const userRef = useRef(null);
  const passRef = useRef(null);
  const staffRef = useRef(null);
  const welcomeTimer = useRef(null);
  const welcomeStart = useRef(0);
  const signedIn = useRef(false);
  const {width: winW} = useWindowDimensions();

  // Keyboard: lift the sheet above it (iOS; Android resizes the window via
  // adjustResize) and switch to a compact layout so nothing needs scrolling.
  const [kb, setKb] = useState({open: false, pad: 0});
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const anim = e => {
      if (ios && e && e.duration) {
        LayoutAnimation.configureNext({
          duration: e.duration,
          update: {type: LayoutAnimation.Types.keyboard},
        });
      }
    };
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', e => {
      anim(e);
      setKb({open: true, pad: ios ? e.endCoordinates.height : 0});
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', e => {
      anim(e);
      setKb({open: false, pad: 0});
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Show the welcome screen straight away; sign-in calls run behind it.
  const startWelcome = () => {
    welcomeStart.current = Date.now();
    setWelcome({name: '', payload: null});
  };
  const cancelWelcome = () => {
    clearTimeout(welcomeTimer.current);
    setWelcome(null);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      }

      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(interval);
        } else {
          setSeconds(59);
          setMinutes(minutes - 1);
        }
      }
    }, 1000);

    if (minutes < 1 && seconds < 1) {
      setBtn_GenOTP(true);
      setisFieldUser(true);
      setisFieldOTP(false);
      setMinutes(4);
      setSeconds(59);
    }

    return () => {
      clearInterval(interval);
    };
  }, [seconds]);

  const resendOTP = () => {
    setMinutes(4);
    setSeconds(59);
  };

  const handle_OTP = values => {
    let data = {
      UserName: encrypyDecrypt(values),
      // Password: encrypyDecrypt(values.Password),
    };
    setUsr_ID(values);

    if (values == '') {
      Toast.show('Please enter User Id');
      setisFieldOTP(false);
    } else {
      if (Loader) {
        return;
      }
      setLoader(true); // inline spinner on the button (no full-page loader)
      AuthPost('GenOTP', data)
        .then(res => {
          setLoader(false);
          setHitCount(res.Result[0].OTP_HIT_COUNT);
          setOTPEXP(res.Result[0].OTP_VALID_FOR);
          setOTPMob(res.Result[0].OTP_MOB_NUM);
          setCountNum(1);
          if (res.Result != '') {
            setIsStarted(true);
            setLoader(false);
            setisFieldUser(false);
            setBtn_GenOTP(false);
            setisFieldOTP(true);
            setMinutes(res.Result[0].OTP_VALID_FOR - 1);
            setSeconds(59);
          }
        })
        .catch(error => {
          setLoader(false);
          showErrorMessage(error);
        });
    }
  };

  function add(count) {
    setCountNum(count + 1); //try count+1 ,not count=count+1
  }

  const loginAgain = () => {
    setBtn_GenOTP(true);
    setisFieldUser(true);
    setisFieldOTP(false);
  };

  const validate_OTP = values => {
    let data = {
      UserName: encrypyDecrypt(Usr_id),
      Password: encrypyDecrypt(values.UserOTP),
    };

    if (countNum > hitCount - 1) {
      setisFieldUser(true);
      setisFieldOTP(false);
      setBtn_GenOTP(true);
      // setHitCount(0);
    }

    if (values.UserOTP == '') {
      Toast.show('Please enter OTP');
    } else {
      startWelcome();
      AuthPost('ValidateOTP', data)
        .then(res => {
          let contextData = {
            token: res.token,
            user: Usr_id,
          };
          GetUserDetails(contextData);
        })
        .catch(error => {
          cancelWelcome();
          showErrorMessage(error);

          add(countNum);
        });
    }
  };

  const handleLogin = values => {
    console.log(values.UserName);
    console.log(values.Password);

    let data = {
      AppName: 'HR-ASSIST',
      UserName: encrypyDecrypt(values.UserName),
      Password: encrypyDecrypt(values.Password),
      StatusFlag: 'Y',
      EligFlag: 'Y',
    };

    startWelcome();
    AuthPost('authenticate', data)
      .then(res => {
        console.log(data);
        let contextData = {
          token: res.token,
          user: values.UserName,
        };

        GetUserDetails(contextData);
      })
      .catch(error => {
        cancelWelcome();
        showErrorMessage(error);
      });
  };

  // Same sign-in call as before, made after the welcome screen
  const finishSignIn = payload => {
    if (signedIn.current) {
      return;
    }
    signedIn.current = true;
    clearTimeout(welcomeTimer.current);
    authContext.signIn({
      payload: payload,
    });
  };

  const GetUserDetails = ({token, user}) => {
    let data = {UserName: user};
    console.log(data);
    console.log('token: ', token);
    ApiService.PostMethode('/GetEmployeeProfile', data, token)
      .then(res => {
        //ACCS_FLAG
        let response = res.Value;
        console.log('GetEmployeeProfile response:', token);

        if (response && response.Table1) {
          let userData = {
            EMPL_NAME: Decrypt(response.Table1[0].EMPL_NAME),
            profile_photo: response.Table1[0].profile_photo,
            userId: Decrypt(response.Table1[0].EMPL_ID),
            userNT: Decrypt(response.Table1[0].EMPL_NT_USER),
            username: user,
            EMPL_DESG_CODE: Decrypt(response.Table1[0].EMPL_DESG_CODE),
            userFlag: Decrypt(response.Table1[0].ACCS_FLAG),
            userDept: Decrypt(response.Table1[0].EMPL_DEPT_CODE),
            personalPhone: Decrypt(response.Table1[0].PERSONAL_PHONE),
            officialPhone: Decrypt(response.Table1[0].EXTN),
            empllocn: Decrypt(response.Table1[0].EMPL_LOCN_CODE),
            empldivncode: Decrypt(response.Table1[0].EMPL_DIVN_CODE),
            emplvertcode: Decrypt(response.Table1[0].DIVN_DIRC_CODE),
            emplcompcode: Decrypt(response.Table1[0].EMPL_COMP_CODE),
            emplusername: Decrypt(response.Table1[0].EMPL_NAME),
            empldob: Decrypt(response.Table1[0].EMPL_BIRTH_DATE),
            emplpresentphone: Decrypt(response.Table1[0].PRESENT_PHONE),
            emplemailid: Decrypt(response.Table1[0].EMPL_EMAIL_ID),
            emplisdpm: Decrypt(response.Table1[0].EMPL_IS_DPM),
          };
          let contextData = {
            token: token,
            user: userData,
          };
          // Name appears on the welcome screen, then the same authContext.signIn({payload}) as before
          setWelcome({name: displayName(userData.EMPL_NAME), payload: contextData});
          // Head start: find MSIL Happenings stories while "Welcome" is showing,
          // so Home opens with them already in place.
          refreshStories({force: true});
          // …and "The journey continues" timeline (+ its latest photos)
          refreshHistory({token, userId: userData.userId, force: true});
        } else {
          cancelWelcome();
          Toast.show('Please Retry');
        }
      })
      .catch(error => {
        cancelWelcome();
        ApiService.showErrorMessage(error, authContext);
      });
  };

  const handleMarkAttandance = index => {
    setMarkAttandance(index);
  };

  const loginValidationSchema = yup.object().shape({
    UserName: yup.string().required('Username is required'),
    Password: yup.string().required('Password is required'),
  });

  // ── Motion (UI only) ──
  const arrival = useRef(new Animated.Value(hasPlayedArrival ? 0 : 1)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current; // slow Ken Burns on the photo
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {toValue: 1, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(drift, {toValue: 0, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);
  const welcomeIn = useRef(new Animated.Value(0)).current;
  const welcomeProgress = useRef(new Animated.Value(0)).current;
  const nameIn = useRef(new Animated.Value(0)).current;
  const welcomeShown = !!welcome;
  const welcomePayload = welcome ? welcome.payload : null;
  useEffect(() => {
    if (welcome) {
      return;
    }
    const steps = [];
    if (!hasPlayedArrival) {
      hasPlayedArrival = true;
      steps.push(Animated.timing(arrival, {toValue: 0, duration: 650, easing: E_OPEN, useNativeDriver: true}));
    }
    enter.setValue(0);
    Animated.parallel([
      ...steps,
      Animated.timing(enter, {toValue: 1, duration: 850, delay: steps.length ? 200 : 0, easing: E_LOGO, useNativeDriver: true}),
    ]).start();
  }, [welcome, arrival, enter]);
  // Welcome screen appears: fade in, progress runs while sign-in calls finish
  useEffect(() => {
    if (!welcomeShown) {
      return;
    }
    welcomeIn.setValue(0);
    welcomeProgress.setValue(0);
    nameIn.setValue(0);
    Animated.timing(welcomeIn, {toValue: 1, duration: 900, easing: E_LOGO, useNativeDriver: true}).start();
    Animated.timing(welcomeProgress, {toValue: 0.8, duration: WELCOME_HOLD, easing: Easing.out(Easing.quad), useNativeDriver: true}).start();
  }, [welcomeShown, welcomeIn, welcomeProgress, nameIn]);

  // Profile ready: show the name, then open the app once the greeting has been seen
  useEffect(() => {
    if (!welcomePayload) {
      return;
    }
    const wait = Math.max(700, WELCOME_HOLD - (Date.now() - welcomeStart.current));
    Animated.timing(nameIn, {toValue: 1, duration: 500, easing: E_LOGO, useNativeDriver: true}).start();
    Animated.timing(welcomeProgress, {toValue: 1, duration: wait, easing: Easing.inOut(Easing.quad), useNativeDriver: true}).start();
    welcomeTimer.current = setTimeout(() => finishSignIn(welcomePayload), wait);
    return () => clearTimeout(welcomeTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomePayload]);

  // ── Successful login: Welcome, <name> ──
  if (welcome) {
    const wi = (a, b, r = [0, 1]) => welcomeIn.interpolate({inputRange: r, outputRange: [a, b], extrapolate: 'clamp'});
    return (
      <Pressable
        style={styles.welcome}
        onPress={() => welcome.payload && finishSignIn(welcome.payload)}
        disabled={!welcome.payload}
        accessibilityLabel={welcome.payload ? 'Continue' : 'Signing in'}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <Animated.Image
          source={COCKPIT}
          resizeMode="cover"
          blurRadius={4}
          style={[styles.fill, {opacity: wi(0, 1), transform: [{scale: wi(1.06, 1)}]}]}
        />
        <LinearGradient
          colors={['rgba(10,27,25,0.92)', 'rgba(14,40,36,0.62)', 'rgba(12,34,31,0.74)', 'rgba(10,27,25,0.96)']}
          locations={[0, 0.4, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={{alignItems: 'center', opacity: wi(0, 1, [0.15, 0.7]), transform: [{translateY: wi(14, 0)}]}}>
          <RNText style={styles.welcomeKicker}>{greeting().toUpperCase()}</RNText>
          <RNText style={styles.welcomeTitle}>Welcome</RNText>
          {/* Full name fades in when the profile arrives; long names wrap to 2 lines / shrink */}
          <Animated.Text
            style={[styles.welcomeName, {opacity: nameIn, transform: [{translateY: nameIn.interpolate({inputRange: [0, 1], outputRange: [6, 0]})}]}]}
            numberOfLines={2}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            maxFontSizeMultiplier={1.2}>
            {welcome.name || ' '}
          </Animated.Text>
          <RNText style={styles.welcomeSub}>
            {welcome.payload ? 'Opening HR Assist' : 'Signing you in…'}
          </RNText>
        </Animated.View>
        <Animated.View style={[styles.welcomeBar, {opacity: wi(0, 1, [0.4, 1])}]}>
          <Animated.View
            style={[styles.welcomeBarFill, {transform: [{translateX: welcomeProgress.interpolate({inputRange: [0, 1], outputRange: [-120, 0]})}]}]}
          />
        </Animated.View>
      </Pressable>
    );
  }

  const msilW = Math.min(winW * 0.64, 290);
  const io = (a, b, r = [0, 1]) => enter.interpolate({inputRange: r, outputRange: [a, b], extrapolate: 'clamp'});
  const focusProps = name => ({onFocus: () => setFocused(name)});
  const blurWith = (name, handleBlur) => e => {
    setFocused(f => (f === name ? null : f));
    handleBlur(name)(e);
  };
  const eye = (
    <TouchableOpacity
      hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
      accessibilityLabel={showPass ? 'Show password' : 'Hide password'}
      onPress={() => {
        if (showPass == false) {
          setShowPass(true);
        } else {
          setShowPass(false);
        }
      }}>
      <Ionicons name={showPass == true ? 'eye-outline' : 'eye-off-outline'} size={21} color={C.text2} />
    </TouchableOpacity>
  );
  const codeStep = MarkAttandance != '0' && isFieldOTP == true;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Background: the last onboarding scene, blurred */}
      <Animated.Image
        source={BG_PHOTO}
        resizeMode="cover"
        blurRadius={Platform.OS === 'ios' ? 7 : 4}
        style={[styles.fill, {transform: [{scale: drift.interpolate({inputRange: [0, 1], outputRange: [1.04, 1.12]})}, {translateY: drift.interpolate({inputRange: [0, 1], outputRange: [0, -14]})}]}]}
      />
      <LinearGradient
        colors={['rgba(14,36,33,0.62)', 'rgba(16,44,40,0.18)', 'rgba(12,32,29,0.42)', 'rgba(10,27,25,0.92)']}
        locations={[0, 0.34, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Image source={GLOW} resizeMode="stretch" style={[styles.glow, styles.glowTop]} />
      <Image source={GLOW} resizeMode="stretch" style={[styles.glow, styles.glowBottom]} />

      {/* DEV ONLY: Remove this button before production */}
      <TouchableOpacity
        onPress={() => navigation.navigate('OnboardingScreen')}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          right: 12,
          backgroundColor: '#FF6B6B',
          padding: 10,
          borderRadius: 8,
          zIndex: 999,
        }}>
        <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>DEV: View Onboarding</Text>
      </TouchableOpacity>
      {/* END DEV ONLY */}

      <View style={styles.flex}>
        {/* Brand — fills the space above the sheet; steps aside for the keyboard */}
        <Pressable
          onPress={Keyboard.dismiss}
          accessible={false}
          style={[styles.brandArea, {paddingTop: insets.top + 44}]}>
          {!kb.open && (
            <Animated.View style={[styles.brand, {opacity: io(0, 1, [0, 0.5]), transform: [{scale: io(1.06, 1)}]}]}>
              <View style={styles.msilPlate}>
                <Image
                  source={MSIL_LOGO}
                  resizeMode="contain"
                  accessibilityLabel="Maruti Suzuki"
                  style={{width: msilW, height: msilW * MSIL_RATIO}}
                />
              </View>
              <View style={styles.brandRule} />
              <Image source={HR_LOGO} resizeMode="contain" style={styles.hrLogo} accessibilityLabel="HR Assist" />
            </Animated.View>
          )}
        </Pressable>

        <Formik
          validationSchema={loginValidationSchema}
          initialValues={{
            UserName: '',
            Password: '',
            UserId: '',
            UserOTP: '',
          }}
          onSubmit={values => {
            handleLogin(values);
          }}>
          {({handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched, isValid}) => (
            <Animated.View
              style={[
                styles.sheet,
                {paddingBottom: kb.open ? 12 : insets.bottom + 14, opacity: io(0, 1, [0.1, 0.5]), transform: [{translateY: io(60, 0)}]},
              ]}>
              <View style={styles.handle} />

              {codeStep ? (
                /* ── OTP: Enter the code ── */
                <View>
                  <View style={styles.codeHeader}>
                    <TouchableOpacity
                      onPress={() => loginAgain()}
                      accessibilityLabel="Back"
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                      style={styles.backBtn}>
                      <Ionicons name="chevron-back" size={20} color={C.white} />
                    </TouchableOpacity>
                    <RNText style={styles.title}>Enter the code</RNText>
                  </View>
                  <RNText style={styles.subtitle}>Sent to +91 {maskMobile(otpMob)}</RNText>

                  <CodeBoxes value={values.UserOTP} onChangeText={handleChange('UserOTP')} onBlur={handleBlur('UserOTP')} />
                  {errors.UserOTP && touched.UserOTP && <FieldError>{errors.UserOTP}</FieldError>}

                  <PillButton style={styles.cta} onPress={() => validate_OTP(values)} title="Verify" />

                  <RNText style={styles.timer}>
                    Code valid for {minutes}:{seconds < 10 ? '0' + seconds : seconds}
                  </RNText>
                  <TouchableOpacity onPress={() => loginAgain()} style={styles.linkWrap}>
                    <RNText style={styles.link}>Didn't get it? Resend code</RNText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {!kb.open && <RNText style={styles.kicker}>EX NEXT · EMPLOYEE EXPERIENCE</RNText>}
                  <RNText style={styles.title} maxFontSizeMultiplier={1.25}>
                    Meet the new HR Assist
                  </RNText>
                  {!kb.open && (
                    <RNText style={styles.subtitle} maxFontSizeMultiplier={1.25}>
                      Leave, pay, people & more — all in one place
                    </RNText>
                  )}

                  <Segmented
                    values={['Windows login', 'OTP login']}
                    selectedIndex={MarkAttandance}
                    onTabPress={index => {
                      handleMarkAttandance(index);
                    }}
                  />

                  {MarkAttandance == '0' ? (
                    /* ── Windows login ── */
                    <View>
                      <GlassField
                        label="Login ID"
                        inputRef={userRef}
                        focused={focused === 'UserName'}
                        invalid={!!(errors.UserName && touched.UserName)}
                        placeholder="Enter your login ID"
                        secureTextEntry={false}
                        maxLength={8}
                        returnKeyType="next"
                        onSubmitEditing={() => passRef.current?.focus()}
                        {...focusProps('UserName')}
                        onChangeText={handleChange('UserName')}
                        onBlur={blurWith('UserName', handleBlur)}
                        value={values.UserName}
                      />
                      {errors.UserName && touched.UserName && <FieldError>{errors.UserName}</FieldError>}

                      <GlassField
                        label="Windows password"
                        inputRef={passRef}
                        focused={focused === 'Password'}
                        invalid={!!(errors.Password && touched.Password)}
                        right={eye}
                        placeholder="Enter your password"
                        maxLength={30}
                        secureTextEntry={showPass}
                        returnKeyType="go"
                        onSubmitEditing={() => handleSubmit()}
                        {...focusProps('Password')}
                        onChangeText={handleChange('Password')}
                        onBlur={blurWith('Password', handleBlur)}
                        value={values.Password}
                      />
                      {errors.Password && touched.Password && <FieldError>{errors.Password}</FieldError>}

                      <PillButton style={styles.cta} onPress={() => handleSubmit()} title="Sign in" />
                    </View>
                  ) : (
                    /* ── OTP login: Staff ID ── */
                    <View>
                      {isFieldUser == true ? (
                        <GlassField
                          key="userIDV"
                          label="Staff ID"
                          inputRef={staffRef}
                          focused={focused === 'UserId'}
                          placeholder="e.g. 104582"
                          secureTextEntry={false}
                          maxLength={7}
                          keyboardType="numeric"
                          {...focusProps('UserId')}
                          onChangeText={handleChange('UserId')}
                          onBlur={blurWith('UserId', handleBlur)}
                          value={values.UserId}
                        />
                      ) : null}
                      {errors.User && touched.UserName && <FieldError>{errors.UserName}</FieldError>}

                      {Btn_GenOTP == true ? (
                        <PillButton
                          style={styles.cta}
                          busy={Loader}
                          busyTitle="Sending code…"
                          onPress={() => {
                            Keyboard.dismiss();
                            setFieldValue('UserOTP', ''); // fresh boxes for the new code
                            handle_OTP(values.UserId);
                          }}
                          title={countNum > 2 ? 'Resend Code' : 'Send Code'}
                        />
                      ) : null}
                    </View>
                  )}
                </View>
              )}

              {!kb.open && <RNText style={styles.copyRight}>Copyright {'©'} 2018 Maruti Suzuki India Ltd.</RNText>}
              {/* keeps the sheet's glass behind the keyboard on iOS */}
              {kb.pad > 0 && <View style={{height: kb.pad - 12}} />}
            </Animated.View>
          )}
        </Formik>
      </View>

      {/* Hand-off from the onboarding orb */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {opacity: arrival}]}>
        <LinearGradient colors={[C.teal, '#3A9488', C.teal]} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
};

// define your styles
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.forest,
  },
  glow: {
    position: 'absolute',
    tintColor: C.teal,
  },
  glowTop: {
    width: 520,
    height: 620,
    top: -260,
    right: -200,
    opacity: 0.5,
  },
  glowBottom: {
    width: 420,
    height: 500,
    bottom: -120,
    left: -220,
    opacity: 0.35,
  },
  flex: {
    flex: 1,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  brandArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },

  // Brand (original logos)
  brand: {
    alignItems: 'center',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 2},
  },
  msilPlate: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 6,
  },
  brandRule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    marginVertical: 18,
    backgroundColor: C.amber,
  },
  hrLogo: {
    width: '74%',
    maxWidth: 300,
    height: 86,
    tintColor: C.white,
  },

  // Glass sheet
  sheet: {
    marginTop: 28,
    backgroundColor: C.glass,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: C.glassEdge,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.32)',
    marginBottom: 18,
  },
  kicker: {
    marginBottom: 6,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.amber,
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '700',
    color: C.white,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15.5,
    lineHeight: 21,
    color: C.text2,
  },

  // Segmented
  segment: {
    marginTop: 18,
    marginBottom: 4,
    flexDirection: 'row',
    padding: 3,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  segmentThumb: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 9,
    backgroundColor: 'rgba(43,131,121,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(158,216,203,0.28)',
  },
  segmentItem: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: C.text2,
  },
  segmentTextActive: {
    color: C.white,
    fontWeight: '600',
  },

  // Fields
  field: {
    marginTop: 12,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.fillBorder,
    backgroundColor: C.fill,
  },
  fieldFocused: {
    borderColor: C.focus,
    borderWidth: 1.5,
  },
  fieldInvalid: {
    borderColor: C.danger,
  },
  fieldLabel: {
    fontSize: 12.5,
    color: C.text2,
  },
  fieldInput: {
    marginTop: 2,
    paddingVertical: 0,
    fontSize: 17,
    color: C.white,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 2,
  },
  error: {
    marginLeft: 5,
    color: C.danger,
    fontSize: 12.5,
  },

  // Code step
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  codeRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  codeBox: {
    width: 58,
    height: 64,
    marginHorizontal: 6,
    borderRadius: 13,
    borderWidth: 1.2,
    borderColor: C.fillBorder,
    backgroundColor: C.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxFilled: {
    borderColor: 'rgba(158,216,203,0.6)',
  },
  codeBoxActive: {
    borderColor: C.focus,
    borderWidth: 1.6,
  },
  codeDigit: {
    fontSize: 26,
    fontWeight: '600',
    color: C.white,
  },
  codeHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  timer: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 13.5,
    color: C.text3,
  },

  // Buttons & links
  cta: {
    marginTop: 20,
  },
  pillShadow: {
    borderRadius: 27,
    shadowColor: C.amber,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
  },
  pill: {
    height: 54,
    borderRadius: 27,
    backgroundColor: C.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 17,
    fontWeight: '600',
    color: C.ink,
  },
  pillBusy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillBusyText: {
    marginLeft: 10,
  },
  linkWrap: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  link: {
    fontSize: 14.5,
    fontWeight: '500',
    color: C.link,
  },
  copyRight: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.3)',
  },

  // Welcome
  welcome: {
    flex: 1,
    backgroundColor: C.forestDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  welcomeKicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.4,
    color: C.amber,
  },
  welcomeTitle: {
    marginTop: 10,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: C.white,
    textAlign: 'center',
  },
  welcomeName: {
    marginTop: 4,
    minHeight: 30,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    color: C.white,
    textAlign: 'center',
    textTransform: 'capitalize', // same as Home
    alignSelf: 'stretch',
  },
  welcomeSub: {
    marginTop: 8,
    fontSize: 16,
    color: C.text2,
  },
  welcomeBar: {
    position: 'absolute',
    bottom: 72,
    width: 120,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(244,242,236,0.12)',
  },
  welcomeBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: C.amber,
  },
});

//make this component available to the app
export default SignIn;