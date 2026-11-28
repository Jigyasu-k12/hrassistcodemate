// My profile — Teal Glow redesign (MyProfile.dc reference).
// Hero card with Digital ID / Business card / Scan card, then contact, HR,
// address and records cards. Same APIs and behaviour as the previous screen.
import React, {
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Switch,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import AuthContext from '../context/AuthContext';
import * as ApiService from '../Utils/Utils';
import {ThemeColor, HomePalette as P} from '../constants/Colors';
import {Decrypt} from '../Service/Helper';
import {HText, useReduceMotion} from './home/homeTheme';
import {HeaderBackdrop} from './home/HomeHeader';
import HomeSheet from './home/HomeSheet';
import {AppIcon, IconBadge} from './icons/AppIcon';
import useBusinessCardTools from './businessCard/useBusinessCardTools';

const BRAND_LOGO = require('../assets/Images/MarutiLogo1.png'); // 8340×867 wordmark
const APP_VERSION = '2.2.3';

// ── helpers ──
const dec = v => {
  try {
    return v ? String(Decrypt(v) || '').trim() : '';
  } catch (e) {
    return '';
  }
};
const joinParts = parts =>
  parts
    .map(p => (p || '').trim())
    .filter(Boolean)
    .join(', ');
const initialsOf = name => {
  const w = String(name || '')
    .replace(/\./g, ' ')
    .trim()
    .split(/\s+/)
    .filter(x => x && !/^(MR|MRS|MS|MISS|DR|SHRI|SMT)$/i.test(x));
  if (!w.length) {
    return '?';
  }
  return (
    (w[0][0] || '') + (w.length > 1 ? w[w.length - 1][0] : '')
  ).toUpperCase();
};
// Design: name size steps down for longer names (24 → 21 → 19)
const nameSize = name => {
  const n = String(name || '').length;
  return n <= 18 ? 24 : n <= 26 ? 21 : 19;
};

// ── building blocks ──
const Card = ({title, children, style}) => (
  <View style={[styles.card, style]}>
    {!!title && (
      <HText style={styles.cardTitle} accessibilityRole="header">
        {title}
      </HText>
    )}
    {children}
  </View>
);

// ── Collapsible section ──
// Header (title · one-line summary · chevron) toggles the body with a smooth
// height + fade. Open/closed is remembered per section across visits.
const SECTIONS_KEY = 'profile_sections_open_v1';
let sectionMemory = null; // {id: bool}, shared by all sections
const sectionsLoaded = AsyncStorage.getItem(SECTIONS_KEY)
  .then(v => {
    sectionMemory = {...(v ? JSON.parse(v) : {}), ...(sectionMemory || {})};
  })
  .catch(() => {
    sectionMemory = sectionMemory || {};
  });
const rememberSection = (id, open) => {
  sectionMemory = {...(sectionMemory || {}), [id]: open};
  AsyncStorage.setItem(SECTIONS_KEY, JSON.stringify(sectionMemory)).catch(
    () => {},
  );
};
const EASE_SECTION = Easing.bezier(0.2, 0.8, 0.2, 1);

const CollapsibleCard = ({
  id,
  title,
  summary,
  defaultOpen = false,
  children,
}) => {
  const reduceMotion = useReduceMotion();
  const initial =
    sectionMemory && id in sectionMemory ? sectionMemory[id] : defaultOpen;
  const [open, setOpen] = useState(initial);
  const [bodyH, setBodyH] = useState(0);
  const progress = useRef(new Animated.Value(initial ? 1 : 0)).current;

  // saved preference arrives after first paint (only on the very first visit)
  useEffect(() => {
    let alive = true;
    sectionsLoaded.then(() => {
      if (alive && sectionMemory && id in sectionMemory) {
        setOpen(sectionMemory[id]);
        progress.setValue(sectionMemory[id] ? 1 : 0);
      }
    });
    return () => {
      alive = false;
    };
  }, [id, progress]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    rememberSection(id, next);
    Animated.timing(progress, {
      toValue: next ? 1 : 0,
      duration: reduceMotion ? 0 : next ? 320 : 240,
      easing: EASE_SECTION,
      useNativeDriver: false, // animates height
    }).start();
  };

  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, bodyH],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const fade = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0.4, 1],
  });

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{expanded: open}}
        accessibilityLabel={`${title}${summary ? `, ${summary}` : ''}`}
        accessibilityHint={open ? 'Collapse section' : 'Expand section'}
        style={styles.sectionHead}>
        <View style={styles.sectionHeadText}>
          <HText style={styles.sectionTitle} accessibilityRole="header">
            {title}
          </HText>
          {!!summary && (
            <HText style={styles.sectionSummary} numberOfLines={1}>
              {summary}
            </HText>
          )}
        </View>
        <Animated.View
          style={[
            styles.sectionChevron,
            open && styles.sectionChevronOpen,
            {transform: [{rotate}]},
          ]}>
          <AppIcon
            name="arrowDown"
            size={15}
            color={open ? '#171C8F' : 'rgba(1,4,75,0.62)'}
            strokeWidth={2.2}
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[styles.sectionBody, {height, opacity: fade}]}
        pointerEvents={open ? 'auto' : 'none'}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={!open}>
        <View
          style={styles.sectionMeasure}
          onLayout={e => {
            const h = Math.ceil(e.nativeEvent.layout.height);
            if (h !== bodyH) {
              setBodyH(h); // content changed (e.g. toggle text) → follow it
            }
          }}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

// ── Family (GetEmployeeProfile · Table2 · ROW_TYPE = FAMILY) ──
const MON = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
const titleCase = s =>
  String(s || '')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
// 'yes' | 'no' | '' (not on record)
const depState = v => {
  const t = String(v || '').trim();
  if (/^(y|yes|true|1)$/i.test(t)) {
    return 'yes';
  }
  return /^(n|no|false|0)$/i.test(t) ? 'no' : '';
};
// "15-AUG-1990", "15/08/1990", "1990-08-15T00:00:00", "15 Aug 1990 12:00AM"…
const parseDob = raw => {
  const t = String(raw || '').trim();
  if (!t) {
    return null;
  }
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (m) {
    return new Date(+m[1], +m[2] - 1, +m[3]);
  }
  m = /^(\d{1,2})[-/ .]([A-Za-z]{3,9})[-/ .,]*(\d{2,4})/.exec(t);
  if (m) {
    const mi = MON.findIndex(
      x => x.toLowerCase() === m[2].slice(0, 3).toLowerCase(),
    );
    if (mi >= 0) {
      const y = +m[3] < 100 ? 1900 + +m[3] : +m[3];
      return new Date(y, mi, +m[1]);
    }
  }
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(t);
  if (m) {
    return new Date(+m[3], +m[2] - 1, +m[1]); // Indian order: dd/mm/yyyy
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
};
const dobText = raw => {
  const d = parseDob(raw);
  if (!d || isNaN(d.getTime())) {
    return String(raw || '').split(/[ T]/)[0]; // show what we got, minus time
  }
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  ) {
    age--;
  }
  const date = `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
  return age >= 0 && age < 130
    ? `${date} · ${age} ${age === 1 ? 'yr' : 'yrs'}`
    : date;
};
// Split Table2 by ROW_TYPE. Older replies without ROW_TYPE are all nominations.
const splitTable2 = rows => {
  const list = Array.isArray(rows) ? rows : [];
  const type = r => dec(r.ROW_TYPE).toUpperCase();
  if (!list.some(r => type(r))) {
    return {nominations: list, family: []};
  }
  return {
    nominations: list.filter(r => type(r) === 'NOMINATION'),
    family: list
      .filter(r => type(r) === 'FAMILY')
      .map((r, i) => ({
        key: `fam-${i}`,
        name: titleCase(dec(r.FAM_NAME)),
        relation: titleCase(dec(r.FAM_REL)),
        dob: dec(r.FAML_BIRTH_DATE),
        medical: depState(dec(r.MED_DEP)),
        ltc: depState(dec(r.LTC_DEP)),
      }))
      .filter(m => m.name || m.relation),
  };
};

const FAMILY_HUES = ['#F5F5F5', '#F5F5F5', '#F5F5F5', '#F5F5F5'];

// Dependent status — always shown: "Medical  ✓ Yes" / "LTC  — No"
const DepPill = ({label, state}) => {
  const yes = state === 'yes';
  const known = state === 'yes' || state === 'no';
  return (
    <View style={[styles.dep, yes ? styles.depYes : styles.depNo]}>
      <HText style={[styles.depLabel, yes && styles.depLabelYes]}>
        {label}
      </HText>
      <View style={[styles.depDivider, yes && styles.depDividerYes]} />
      <View
        style={[styles.depIcon, yes ? styles.depIconYes : styles.depIconNo]}>
        <AppIcon
          name={yes ? 'check' : known ? 'minusCircle' : 'close'}
          size={yes ? 9 : 10}
          color={yes ? '#FFFFFF' : '#FFFFFF'}
          strokeWidth={yes ? 3 : 2.4}
        />
      </View>
      <HText
        style={[styles.depValue, yes ? styles.depValueYes : styles.depValueNo]}>
        {yes ? 'Yes' : known ? 'No' : 'Not set'}
      </HText>
    </View>
  );
};
const FamilyRow = ({member, last}) => {
  const hue =
    FAMILY_HUES[
      (member.name || member.relation)
        .split('')
        .reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) %
        FAMILY_HUES.length
    ];
  const dob = member.dob ? dobText(member.dob) : '';
  return (
    <View
      style={[styles.row, styles.famRow, last && styles.rowLast]}
      accessible
      accessibilityLabel={[
        member.name,
        member.relation,
        dob && `born ${dob}`,
        `medical dependent: ${member.medical || 'not on record'}`,
        `LTC dependent: ${member.ltc || 'not on record'}`,
      ]
        .filter(Boolean)
        .join(', ')}>
      <View style={[styles.famAvatar, {backgroundColor: hue}]}>
        <HText style={styles.famInitials}>
          {initialsOf(member.name || member.relation)}
        </HText>
      </View>
      <View style={styles.rowText}>
        {/* relation as a quiet eyebrow, the name as the headline */}
        {!!member.relation && !!member.name && (
          <HText style={styles.famRel} numberOfLines={1}>
            {member.relation.toUpperCase()}
          </HText>
        )}
        <HText style={styles.famName} numberOfLines={2}>
          {member.name || member.relation}
        </HText>
        {!!dob && (
          <View style={styles.famDobRow}>
            <AppIcon name="cake" size={12} color={'rgba(1,4,75,0.62)'} strokeWidth={2} />
            <HText style={styles.famDob}>{dob}</HText>
          </View>
        )}
        <View style={styles.famTags}>
          <DepPill label="Medical dependent" state={member.medical} />
          <DepPill label="LTC dependent" state={member.ltc} />
        </View>
      </View>
    </View>
  );
};

// ── Details verification (campaign: GetFeedbackElig AppID 4) ──
const VERIFY_OPTIONS = [
  {
    value: 'Y',
    title: 'OK – I have verified my details and all information is correct.',
    hindi: 'मैंने अपने विवरणों की जांच की है और सारी जानकारी सही है।',
  },
  {
    value: 'N',
    title: 'Not OK – Correction required: details need to be updated.',
    hindi: 'सुधार की जरूरत है – विवरण अपडेट करने की जरूरत है।',
  },
];

const VerifyOption = ({option, selected, disabled, onPress}) => {
  const ok = option.value === 'Y';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{checked: selected, disabled}}
      accessibilityLabel={option.title}
      style={[
        styles.vOption,
        selected && (ok ? styles.vOptionOk : styles.vOptionNo),
      ]}>
      <View
        style={[styles.vBox, selected && (ok ? styles.vBoxOk : styles.vBoxNo)]}>
        {selected && (
          <AppIcon name="check" size={13} color="#01044B" strokeWidth={3} />
        )}
      </View>
      <View style={styles.vOptionText}>
        <HText style={styles.vOptionTitle}>{option.title}</HText>
        <HText style={styles.vOptionHindi}>{option.hindi}</HText>
      </View>
    </TouchableOpacity>
  );
};

const VerifyCard = ({choice, onChoose, onSubmit, submitting, result}) => {
  const done = !!result;
  return (
    <View style={styles.vCard}>
      <LinearGradient
        colors={['#FFFFFF', '#F5F5F5']}
        start={{x: 0, y: 0}}
        end={{x: 0.4, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.vHead}>
        <View style={styles.vHeadIcon}>
          <AppIcon
            name={done ? 'approve' : 'profile'}
            size={18}
            color={'#171C8F'}
            strokeWidth={2}
          />
        </View>
        <View style={{flex: 1}}>
          <HText style={styles.vEyebrow}>ACTION NEEDED</HText>
          <HText style={styles.vTitle} accessibilityRole="header">
            Verify your details
          </HText>
          <HText style={styles.vSub}>
            Please review the information above and confirm.
          </HText>
        </View>
      </View>

      {done ? (
        <View style={styles.vDone} accessibilityLiveRegion="polite">
          <View style={styles.vDoneIcon}>
            <AppIcon name="check" size={18} color="#FFFFFF" strokeWidth={3} />
          </View>
          <View style={{flex: 1}}>
            <HText style={styles.vDoneTitle}>
              {choice === 'N' ? 'Correction requested' : 'Details confirmed'}
            </HText>
            <HText style={styles.vDoneText}>{result}</HText>
          </View>
        </View>
      ) : (
        <>
          {VERIFY_OPTIONS.map(o => (
            <VerifyOption
              key={o.value}
              option={o}
              selected={choice === o.value}
              disabled={submitting}
              onPress={() => onChoose(o.value)}
            />
          ))}
          <TouchableOpacity
            onPress={onSubmit}
            disabled={!choice || submitting}
            accessibilityRole="button"
            accessibilityState={{
              disabled: !choice || submitting,
              busy: submitting,
            }}
            style={[
              styles.vSubmit,
              (!choice || submitting) && styles.vSubmitIdle,
            ]}>
            {submitting ? (
              <ActivityIndicator color={'#01044B'} />
            ) : (
              <HText
                style={[styles.vSubmitText, !choice && styles.vSubmitTextIdle]}>
                {choice ? 'Submit response' : 'Select an option'}
              </HText>
            )}
          </TouchableOpacity>
        </>
      )}

      <View style={styles.vNote}>
        <AppIcon name="helpdesk" size={14} color={'rgba(1,4,75,0.62)'} strokeWidth={2} />
        <View style={{flex: 1, marginLeft: 8}}>
          <HText style={styles.vNoteText}>
            For any correction, please contact your respective shop coordinator.
          </HText>
          <HText style={styles.vNoteText}>
            किसी भी सुधार के लिए कृपया अपने संबंधित शॉप कोऑर्डिनेटर से संपर्क
            करें।
          </HText>
        </View>
      </View>
    </View>
  );
};

const Row = ({icon, label, value, onPress, right, last, multiline}) => {
  const body = (
    <>
      <IconBadge name={icon} size={36} iconSize={18} />
      <View style={styles.rowText}>
        <HText style={styles.rowLabel}>{label}</HText>
        <HText
          style={[styles.rowValue, onPress && styles.rowValueLink]}
          numberOfLines={multiline ? 4 : 1}
          selectable={!onPress}>
          {value || 'Not available'}
        </HText>
      </View>
      {right}
    </>
  );
  const rowStyle = [styles.row, last && styles.rowLast];
  return onPress && value ? (
    <TouchableOpacity
      onPress={onPress}
      style={rowStyle}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}>
      {body}
    </TouchableOpacity>
  ) : (
    <View style={rowStyle}>{body}</View>
  );
};

const CallButton = ({phone, name}) =>
  phone ? (
    <TouchableOpacity
      onPress={() => Linking.openURL(`tel:${phone}`)}
      accessibilityRole="button"
      accessibilityLabel={`Call ${name}`}
      style={styles.callBtn}>
      <AppIcon name="phone" size={17} color={'#171C8F'} strokeWidth={2} />
    </TouchableOpacity>
  ) : null;

const HeroButton = ({icon, label, onPress, primary, style}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={[
      styles.heroBtn,
      primary ? styles.heroBtnPrimary : styles.heroBtnGlass,
      style,
    ]}>
    <AppIcon
      name={icon}
      size={18}
      color={primary ? '#01044B' : '#FFFFFF'}
      strokeWidth={1.9}
    />
    <HText
      style={[styles.heroBtnText, {color: primary ? '#01044B' : '#FFFFFF'}]}
      numberOfLines={1}>
      {label}
    </HText>
  </TouchableOpacity>
);

// ── Digital ID (palette version of the old ID card) ──
const DigitalIdSheet = ({
  visible,
  onClose,
  photo,
  name,
  staffId,
  designation,
  dept,
  location,
}) => (
  <HomeSheet
    visible={visible}
    onClose={onClose}
    eyebrow="Maruti Suzuki India Limited"
    title="Digital ID">
    <View style={styles.idCard}>
      <LinearGradient
        colors={['#171C8F', '#01044B']}
        start={{x: 0.9, y: 0}}
        end={{x: 0.1, y: 1}}
        style={styles.idTop}>
        <View style={styles.idLogoBadge}>
          <Image
            source={BRAND_LOGO}
            style={styles.idLogo}
            resizeMode="contain"
            accessibilityLabel="Maruti Suzuki"
          />
        </View>
        <HText style={styles.idKicker}>EMPLOYEE IDENTITY CARD</HText>
      </LinearGradient>
      <View style={styles.idPhotoRing}>
        {photo ? (
          <Image source={{uri: photo}} style={styles.idPhoto} />
        ) : (
          <View style={[styles.idPhoto, styles.avatarFallback]}>
            <HText style={styles.idInitials}>{initialsOf(name)}</HText>
          </View>
        )}
      </View>
      <HText style={styles.idName} numberOfLines={2}>
        {name || 'Employee'}
      </HText>
      {!!designation && <HText style={styles.idDesg}>{designation}</HText>}
      <View style={styles.idRows}>
        {[
          ['Staff No', staffId],
          ['Department', dept],
          ['Location', location],
        ].map(([k, v], i) => (
          <View
            key={k}
            style={[styles.idRow, i === 2 && {borderBottomWidth: 0}]}>
            <HText style={styles.idKey}>{k}</HText>
            <HText style={styles.idVal} numberOfLines={2}>
              {v || '—'}
            </HText>
          </View>
        ))}
      </View>
      {/* brand stripe kept from the original card */}
      <View style={styles.idStripe}>
        <View style={{flex: 1, backgroundColor: '#FFFFFF'}} />
        <View style={{flex: 3, backgroundColor: '#171C8F'}} />
      </View>
    </View>
    <HText style={styles.idNote}>
      Show this card when asked for your employee ID.
    </HText>
  </HomeSheet>
);

// ── Screen ──
const EditProfile = ({navigation}) => {
  const {authContext, AppUserData} = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const bc = useBusinessCardTools();

  const [loader, setLoader] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [profile, setProfile] = useState(null); // Table1[0]
  const [nominiData, setNominiData] = useState('');
  const [family, setFamily] = useState([]);
  // details verification campaign
  const [verifyElig, setVerifyElig] = useState(false);
  const [verifyChoice, setVerifyChoice] = useState(null); // 'Y' | 'N'
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyResult, setVerifyResult] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [idOpen, setIdOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [heroSize, setHeroSize] = useState({width: 0, height: 0});

  const usrAccess = AppUserData?.data?.userFlag;
  const photo = AppUserData?.data?.profile_photo;

  // Verification card: only for usrAccess 'Y' users, and only while the
  // campaign is open for them (GetFeedbackElig · AppID 4 · flag 'Y')
  const checkVerifyElig = useCallback(() => {
    if (usrAccess !== 'Y' || !AppUserData?.data?.userId) {
      setVerifyElig(false);
      return;
    }
    ApiService.PostMethode(
      '/GetFeedbackElig',
      {AppID: '4', EmployeeID: AppUserData.data.userId},
      AppUserData.token,
      authContext,
    )
      .then(result => {
        const row = Array.isArray(result?.Value) ? result.Value[0] : null;
        setVerifyElig(row?.FDBK_ELIGIBILITY_FLAG === 'Y');
      })
      .catch(() => setVerifyElig(false)); // silent: just don't show the card
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usrAccess, AppUserData?.token]);

  const submitVerification = () => {
    if (!verifyChoice || verifySubmitting) {
      return;
    }
    setVerifySubmitting(true);
    ApiService.PostMethode(
      '/SubmitEmplVerification',
      {
        UserName: String(AppUserData?.data?.userId || ''),
        Response: verifyChoice,
      },
      AppUserData.token,
      authContext,
    )
      .then(result => {
        setVerifySubmitting(false);
        const msg =
          typeof result?.Value === 'string' && result.Value.trim()
            ? result.Value.trim()
            : 'Your response has been submitted successfully.';
        setVerifyResult(msg);
        Toast.show(msg);
      })
      .catch(error => {
        setVerifySubmitting(false);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  // ── same API as before ──
  const employeProfile = useCallback(() => {
    setLoader(true);
    setLoadFailed(false);
    ApiService.PostMethode(
      '/GetEmployeeProfile',
      {UserName: AppUserData?.data?.username},
      AppUserData.token,
      authContext,
    )
      .then(result => {
        setLoader(false);
        const row = result?.Value?.Table1?.[0];
        if (!row) {
          setLoadFailed(true);
          return;
        }
        setProfile(row);
        // Table2 carries both nominations and family (ROW_TYPE)
        const t2 = splitTable2(result.Value.Table2);
        setNominiData(t2.nominations);
        setFamily(t2.family);
        setEmpPhone(dec(row.EXTN));
        setIsEnabled(dec(row.PRIVATE_FLAG) !== 'Y');
      })
      .catch(error => {
        setLoader(false);
        setLoadFailed(true);
        ApiService.showErrorMessage(error, authContext);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [AppUserData?.token]);

  // Light page → dark status bar text while this screen is focused
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#F5F5F5');
      }
      employeProfile();
      bc.checkScanAccess();
      if (!verifyResult) {
        checkVerifyElig();
      }
      return () => {
        StatusBar.setBarStyle('light-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#171C8F');
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // ── phone visibility toggle (same confirm + API as before) ──
  const UpdateEmpProf = value => {
    ApiService.PostMethode(
      '/UpdateEmpProf',
      {
        StaffNo: AppUserData?.data?.userId,
        PresonalNo: '',
        ExtensionNo: empPhone,
        EmergencyNo: '',
        Flag: value ? 'N' : 'Y',
      },
      AppUserData.token,
      authContext,
    )
      .then(result =>
        Toast.show(
          result.Result ? 'Profile updated successfully' : 'Update Failed',
        ),
      )
      .catch(error => ApiService.showErrorMessage(error, authContext));
  };
  const handleSwitchChange = value => {
    setIsEnabled(value);
    Alert.alert(
      'Update Number',
      `Your number is ${
        value ? 'Public' : 'Private'
      }. Please press OK to save!!`,
      [
        {text: 'Cancel', onPress: () => setIsEnabled(!value), style: 'cancel'},
        {text: 'OK', onPress: () => UpdateEmpProf(value)},
      ],
    );
  };

  // ── sign out (same API as the side menu) ──
  const signOut = () => {
    setSigningOut(true);
    ApiService.PostMethode('/Logout', {}, AppUserData.token, authContext)
      .then(result => {
        setSigningOut(false);
        if (result && result.Result == false) {
          Toast.show('Logout failed try again');
        } else {
          setSignOutOpen(false);
          authContext.signOut();
        }
      })
      .catch(error => {
        setSigningOut(false);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  // ── derived values (hero shows instantly from the signed-in session) ──
  const name =
    (profile ? dec(profile.EMPL_NAME) : '') ||
    AppUserData?.data?.EMPL_NAME ||
    'User';
  const staffId =
    (profile ? dec(profile.EMPL_ID) : '') || AppUserData?.data?.userId || '';
  const designation =
    (profile ? dec(profile.EMPL_DESG_CODE) : '') ||
    AppUserData?.data?.EMPL_DESG_CODE ||
    '';
  const dept =
    (profile ? dec(profile.EMPL_DEPT_CODE) : '') ||
    AppUserData?.data?.userDept ||
    '';
  const division = profile
    ? dec(profile.EMPL_DIVN_CODE)
    : AppUserData?.data?.empldivncode || '';
  const vertical = profile
    ? dec(profile.DIVN_DIRC_CODE)
    : AppUserData?.data?.emplvertcode || '';
  const location = profile ? dec(profile.LOCN_DESC) : '';
  const personalPhone = profile ? dec(profile.PRESENT_PHONE) : '';
  const officialPhone = profile ? dec(profile.EXTN) : '';
  const emailLocal = profile ? dec(profile.EMPL_EMAIL_ID) : '';
  const email = emailLocal ? `${emailLocal}@maruti.co.in` : '';
  const hrbp = profile ? dec(profile.HRBP) : '';
  const hrss = profile ? dec(profile.HRSS) : '';
  const permanent = profile
    ? joinParts([
        dec(profile.PERMANENT_ADDRESS_LINE1),
        dec(profile.PERMANENT_ADDRESS_LINE2),
        dec(profile.PERMANENT_ADDRESS_LINE3),
        dec(profile.PERMANENT_CITY),
        dec(profile.PERMANENT_ADDRESS),
        dec(profile.PERMANENT_PINCODE),
      ])
    : '';
  const present = profile
    ? joinParts([
        dec(profile.PRESENT_ADDRESS_LINE1),
        dec(profile.PRESENT_ADDRESS_LINE2),
        dec(profile.PRESENT_ADDRESS_LINE3),
        dec(profile.PRESENT_CITY),
        dec(profile.PRESENT_ADDRESS),
        dec(profile.PRESENT_PINCODE),
      ])
    : '';
  const showCards = usrAccess != 'Y'; // same rule Home used for Business / Scan card
  const subtitle = [designation, dept].filter(Boolean).join(' · ');

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28},
        ]}>
        {/* ── Title bar ── */}
        <View style={styles.titleBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}>
            <AppIcon
              name="chevronLeft"
              size={20}
              color={'#01044B'}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
          <HText style={styles.pageTitle} accessibilityRole="header">
            My profile
          </HText>
        </View>

        {/* ── Hero ── */}
        <View
          style={styles.hero}
          onLayout={e => {
            const {width, height} = e.nativeEvent.layout;
            if (width !== heroSize.width || height !== heroSize.height) {
              setHeroSize({width, height});
            }
          }}>
          <HeaderBackdrop
            width={heroSize.width}
            height={heroSize.height}
            idPrefix="prof"
          />

          <View style={styles.heroTop}>
            <View style={styles.avatarRing}>
              {photo ? (
                <Image
                  source={{uri: photo}}
                  style={styles.avatar}
                  accessibilityLabel={`Profile photo of ${name}`}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <HText style={styles.avatarInitials}>
                    {initialsOf(name)}
                  </HText>
                </View>
              )}
            </View>
            <View style={styles.heroText}>
              <HText
                style={[
                  styles.heroName,
                  {fontSize: nameSize(name), lineHeight: nameSize(name) * 1.18},
                ]}
                numberOfLines={2}
                ellipsizeMode="tail">
                {name}
              </HText>
              {!!subtitle && (
                <HText style={styles.heroSub} numberOfLines={2}>
                  {subtitle}
                </HText>
              )}
              <View style={styles.heroMeta}>
                {!!staffId && (
                  <HText style={styles.heroMetaText}>{staffId}</HText>
                )}
                {!!staffId && !!location && <View style={styles.dot} />}
                {!!location && (
                  <HText
                    style={[styles.heroMetaText, {flexShrink: 1}]}
                    numberOfLines={1}>
                    {location}
                  </HText>
                )}
              </View>
            </View>
          </View>

          <View style={styles.stats}>
            {[
              ['Vertical', vertical],
              ['Division', division],
              ['Department', dept],
            ].map(([k, v], i) => (
              <View key={k} style={[styles.stat, i === 1 && styles.statMid]}>
                <HText style={styles.statKey}>{k}</HText>
                <HText style={styles.statVal} numberOfLines={1}>
                  {v || '—'}
                </HText>
              </View>
            ))}
          </View>

          <View style={styles.heroBtns}>
            <HeroButton
              icon="qr"
              label="Digital ID"
              primary
              onPress={() => setIdOpen(true)}
              style={showCards ? {marginRight: 10} : null}
            />
            {showCards && (
              <HeroButton
                icon="card"
                label="Business card"
                onPress={bc.openBusinessCard}
              />
            )}
          </View>
          {showCards && bc.scanAvailable && (
            <HeroButton
              icon="scan"
              label="Scan a business card"
              onPress={bc.openScanCard}
              style={styles.scanBtn}
            />
          )}
        </View>

        {/* ── Details ── */}
        {loader && !profile ? (
          <View style={styles.loading}>
            <ActivityIndicator color={'#171C8F'} />
            <HText style={styles.loadingText}>Loading your details…</HText>
          </View>
        ) : loadFailed && !profile ? (
          <Card>
            <View style={styles.retry}>
              <HText style={styles.retryText}>
                We couldn't load your details.
              </HText>
              <TouchableOpacity
                onPress={employeProfile}
                accessibilityRole="button"
                style={styles.retryBtn}>
                <AppIcon
                  name="reset"
                  size={16}
                  color={'#01044B'}
                  strokeWidth={2.2}
                />
                <HText style={styles.retryBtnText}>Try again</HText>
              </TouchableOpacity>
            </View>
          </Card>
        ) : profile ? (
          <>
            <Card title="Contact">
              <Row
                icon="phone"
                label="Personal phone"
                value={personalPhone}
                onPress={() => Linking.openURL(`tel:${personalPhone}`)}
              />
              <View style={styles.toggleRow}>
                <View style={{flex: 1}}>
                  <HText style={styles.toggleLabel}>
                    Show my number to colleagues
                  </HText>
                  <HText style={styles.toggleSub}>
                    {isEnabled
                      ? 'Public — visible in Employee Lookup'
                      : 'Private — hidden from colleagues'}
                  </HText>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={handleSwitchChange}
                  trackColor={{false: '#F5F5F5', true: '#171C8F'}}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={P.lineStrong}
                  accessibilityLabel="Show my number to colleagues"
                />
              </View>
              <Row
                icon="phone"
                label="Official phone"
                value={officialPhone}
                onPress={() => Linking.openURL(`tel:${officialPhone}`)}
              />
              <Row
                icon="mail"
                label="Email"
                value={email}
                onPress={() => Linking.openURL(`mailto:${email}`)}
                last
              />
            </Card>

            <Card title="HR contacts">
              <Row
                icon="profile"
                label="HR business partner (HRBP)"
                value={hrbp}
                right={
                  <CallButton
                    phone={dec(profile.HRBP_PHONE)}
                    name={hrbp || 'HRBP'}
                  />
                }
              />
              <Row
                icon="helpdesk"
                label="HR shared services (HRSS)"
                value={hrss}
                right={
                  <CallButton
                    phone={dec(profile.HRSS_PHONE)}
                    name={hrss || 'HRSS'}
                  />
                }
                last
              />
            </Card>

            <CollapsibleCard
              id="addresses"
              title="Addresses"
              summary="Permanent & present">
              <Row
                icon="home"
                label="Permanent address"
                value={permanent}
                multiline
              />
              <Row
                icon="pin"
                label="Present address"
                value={present}
                multiline
                last
              />
            </CollapsibleCard>

            <CollapsibleCard
              id="family"
              title="Family"
              summary={
                family.length
                  ? `${family.length} ${
                      family.length === 1 ? 'member' : 'members'
                    }`
                  : 'No family details on record'
              }>
              {family.length ? (
                family.map((m, i) => (
                  <FamilyRow
                    key={m.key}
                    member={m}
                    last={i === family.length - 1}
                  />
                ))
              ) : (
                <View style={[styles.row, styles.rowLast]}>
                  <IconBadge name="people" size={36} iconSize={18} />
                  <View style={styles.rowText}>
                    <HText style={styles.rowLabel}>
                      Family details will appear here once they're on record
                      with HR.
                    </HText>
                  </View>
                </View>
              )}
            </CollapsibleCard>

            <Card title="My records">
              <TouchableOpacity
                style={[styles.row, styles.rowLast]}
                onPress={() =>
                  navigation.navigate('Nomination', {data: nominiData})
                }
                accessibilityRole="button">
                <IconBadge name="people" size={36} iconSize={18} />
                <View style={styles.rowText}>
                  <HText style={styles.navLabel}>Nominations</HText>
                  <HText style={styles.rowLabel}>
                    Nominee details on record
                  </HText>
                </View>
                <AppIcon
                  name="chevronRight"
                  size={16}
                  color={'rgba(1,4,75,0.62)'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </Card>
          </>
        ) : null}

        {/* ── Details verification (campaign) ── */}
        {profile && (verifyElig || !!verifyResult) && (
          <VerifyCard
            choice={verifyChoice}
            onChoose={setVerifyChoice}
            onSubmit={submitVerification}
            submitting={verifySubmitting}
            result={verifyResult}
          />
        )}

        {/* ── Sign out ── */}
        <TouchableOpacity
          onPress={() => setSignOutOpen(true)}
          accessibilityRole="button"
          style={styles.signOut}>
          <AppIcon name="logout" size={18} color="#01044B" strokeWidth={2} />
          <HText style={styles.signOutText}>Sign out</HText>
        </TouchableOpacity>
        <HText style={styles.version}>HR Assist · version {APP_VERSION}</HText>
      </ScrollView>

      <DigitalIdSheet
        visible={idOpen}
        onClose={() => setIdOpen(false)}
        photo={photo}
        name={name}
        staffId={staffId}
        designation={designation}
        dept={dept}
        location={location}
      />

      <HomeSheet
        visible={signOutOpen}
        onClose={() => !signingOut && setSignOutOpen(false)}
        title="Sign out of HR Assist?">
        <HText style={styles.sheetBody}>
          You'll need to sign in again to use HR Assist on this device.
        </HText>
        <View style={styles.sheetBtns}>
          <TouchableOpacity
            onPress={() => setSignOutOpen(false)}
            disabled={signingOut}
            accessibilityRole="button"
            style={[styles.sheetBtn, styles.sheetBtnOutline]}>
            <HText style={styles.sheetBtnOutlineText}>Stay signed in</HText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={signOut}
            disabled={signingOut}
            accessibilityRole="button"
            style={[styles.sheetBtn, styles.sheetBtnDanger]}>
            {signingOut ? (
              <ActivityIndicator color="#01044B" />
            ) : (
              <HText style={styles.sheetBtnDangerText}>Sign out</HText>
            )}
          </TouchableOpacity>
        </View>
      </HomeSheet>

      {/* Business card + Scan card modals (shared with what Home used to show) */}
      {bc.modals}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},
  scroll: {paddingHorizontal: 16},

  titleBar: {flexDirection: 'row', alignItems: 'center', marginBottom: 14},
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: '#01044B',
  },

  hero: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    backgroundColor: '#171C8F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
    shadowColor: '#01044B',
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 16},
    elevation: 8,
  },
  heroTop: {flexDirection: 'row', alignItems: 'center'},
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    backgroundColor: '#FCBE62',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: '#171C8F',
  },
  avatarFallback: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {fontSize: 22, fontWeight: '700', color: '#01044B'},
  heroText: {flex: 1, minWidth: 0, marginLeft: 16},
  heroName: {
    fontWeight: '300',
    letterSpacing: -0.4,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  heroSub: {fontSize: 13.5, lineHeight: 18, color: 'rgba(255,255,255,0.72)', marginTop: 4},
  heroMeta: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  heroMetaText: {fontSize: 12, color: 'rgba(255,255,255,0.72)'},
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#171C8F',
    marginHorizontal: 6,
  },

  stats: {
    flexDirection: 'row',
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  stat: {flex: 1, paddingVertical: 12, paddingHorizontal: 12},
  statMid: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  statKey: {fontSize: 11.5, color: 'rgba(255,255,255,0.72)'},
  statVal: {fontSize: 15, fontWeight: '500', color: '#FFFFFF', marginTop: 4},

  heroBtns: {flexDirection: 'row', marginTop: 18},
  heroBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  heroBtnPrimary: {
    backgroundColor: '#FCBE62',
    shadowColor: '#01044B',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 4,
  },
  heroBtnGlass: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  heroBtnText: {fontSize: 14, fontWeight: '600', marginLeft: 8},
  scanBtn: {flex: 0, marginTop: 10},

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionHead: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionHeadText: {flex: 1, minWidth: 0, marginRight: 12},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: '#01044B'},
  sectionSummary: {fontSize: 12.5, color: 'rgba(1,4,75,0.62)', marginTop: 2},
  sectionChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23,28,143,0.05)',
  },
  sectionChevronOpen: {backgroundColor: '#F5F5F5'},
  sectionBody: {overflow: 'hidden', marginTop: -4},
  sectionMeasure: {position: 'absolute', left: 0, right: 0, top: 0},
  cardTitle: {
    marginTop: 14,
    marginBottom: 2,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: 'rgba(1,4,75,0.62)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23,28,143,0.1)',
  },
  rowLast: {borderBottomWidth: 0},
  rowText: {flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8},
  rowLabel: {fontSize: 12, color: 'rgba(1,4,75,0.62)'},
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#01044B',
    marginTop: 2,
    lineHeight: 19,
  },
  rowValueLink: {color: '#171C8F'},
  famAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  famInitials: {fontSize: 13, fontWeight: '700', color: '#171C8F'},
  vCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  vHead: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14},
  vHeadIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  vEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#171C8F',
  },
  vTitle: {fontSize: 16, fontWeight: '700', color: '#01044B', marginTop: 2},
  vSub: {fontSize: 12.5, color: 'rgba(1,4,75,0.62)', marginTop: 2, lineHeight: 17},
  vOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  vOptionOk: {borderColor: '#171C8F', backgroundColor: '#F5F5F5'},
  vOptionNo: {borderColor: '#FCBE62', backgroundColor: '#F5F5F5'},
  vBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.6,
    borderColor: 'rgba(23,28,143,0.18)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  vBoxOk: {backgroundColor: '#171C8F', borderColor: '#171C8F'},
  vBoxNo: {backgroundColor: '#FCBE62', borderColor: '#FCBE62'},
  vOptionText: {flex: 1, marginLeft: 12},
  vOptionTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#01044B',
    lineHeight: 19,
  },
  vOptionHindi: {fontSize: 13, color: 'rgba(1,4,75,0.62)', lineHeight: 20, marginTop: 3},
  vSubmit: {
    height: 48,
    borderRadius: 24,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCBE62',
    shadowColor: '#01044B',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  },
  vSubmitIdle: {
    backgroundColor: 'rgba(23,28,143,0.06)',
    shadowOpacity: 0,
    elevation: 0,
  },
  vSubmitText: {fontSize: 15, fontWeight: '700', color: '#01044B'},
  vSubmitTextIdle: {color: 'rgba(1,4,75,0.62)'},
  vDone: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.25)',
  },
  vDoneIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171C8F',
  },
  vDoneTitle: {fontSize: 14.5, fontWeight: '700', color: '#171C8F'},
  vDoneText: {fontSize: 13, color: '#01044B', lineHeight: 19, marginTop: 2},
  vNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
  },
  vNoteText: {fontSize: 12, color: 'rgba(1,4,75,0.62)', lineHeight: 18},
  famRow: {alignItems: 'flex-start', paddingVertical: 14},
  famRel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#171C8F',
    marginBottom: 2,
  },
  famName: {fontSize: 15, fontWeight: '700', lineHeight: 20, color: '#01044B'},
  famDobRow: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  famDob: {fontSize: 12, color: 'rgba(1,4,75,0.62)', marginLeft: 5},
  famTags: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 8},
  dep: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    paddingLeft: 9,
    paddingRight: 9,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 2,
    borderWidth: 1,
  },
  depYes: {backgroundColor: '#F5F5F5', borderColor: 'rgba(23,28,143,0.22)'},
  depNo: {backgroundColor: '#FFFFFF', borderColor: 'rgba(23,28,143,0.1)'},
  depLabel: {fontSize: 11.5, fontWeight: '600', color: 'rgba(1,4,75,0.62)'},
  depLabelYes: {color: '#171C8F'},
  depDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 7,
    backgroundColor: '#F5F5F5',
  },
  depDividerYes: {backgroundColor: 'rgba(23,28,143,0.25)'},
  depIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  depIconYes: {backgroundColor: '#171C8F'},
  depIconNo: {backgroundColor: 'rgba(255,255,255,0)'},
  depValue: {fontSize: 11.5, fontWeight: '700'},
  depValueYes: {color: '#171C8F'},
  depValueNo: {color: '#171C8F'},
  navLabel: {fontSize: 14, fontWeight: '600', color: '#01044B', marginBottom: 2},
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23,28,143,0.1)',
  },
  toggleLabel: {fontSize: 13.5, fontWeight: '600', color: '#01044B'},
  toggleSub: {fontSize: 12, color: 'rgba(1,4,75,0.62)', marginTop: 2, marginRight: 8},

  loading: {alignItems: 'center', paddingVertical: 28},
  loadingText: {fontSize: 13, color: 'rgba(1,4,75,0.62)', marginTop: 8},
  retry: {alignItems: 'center', paddingVertical: 20},
  retryText: {fontSize: 14, color: '#01044B'},
  retryBtn: {
    marginTop: 12,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#FCBE62',
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#01044B',
    marginLeft: 6,
  },

  signOut: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#01044B',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#01044B',
    marginLeft: 8,
  },
  version: {textAlign: 'center', fontSize: 11, color: 'rgba(1,4,75,0.62)', marginTop: 12},

  sheetBody: {fontSize: 14, lineHeight: 21, color: '#01044B'},
  sheetBtns: {flexDirection: 'row', marginTop: 16},
  sheetBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnOutline: {borderWidth: 1, borderColor: 'rgba(23,28,143,0.18)', marginRight: 10},
  sheetBtnOutlineText: {fontSize: 14, fontWeight: '700', color: '#01044B'},
  sheetBtnDanger: {backgroundColor: '#F5F5F5'},
  sheetBtnDangerText: {fontSize: 14, fontWeight: '700', color: '#01044B'},

  idCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  idTop: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 46,
  },
  idLogoBadge: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  idLogo: {width: 135, height: 14},
  idKicker: {
    marginTop: 10,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.72)',
  },
  idPhotoRing: {
    marginTop: -40,
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
    backgroundColor: '#FCBE62',
  },
  idPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  idInitials: {fontSize: 26, fontWeight: '700', color: '#01044B'},
  idName: {
    marginTop: 10,
    paddingHorizontal: 16,
    fontSize: 19,
    fontWeight: '700',
    color: '#01044B',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  idDesg: {fontSize: 13, color: 'rgba(1,4,75,0.62)', marginTop: 2},
  idRows: {
    alignSelf: 'stretch',
    marginTop: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23,28,143,0.1)',
  },
  idKey: {width: 96, fontSize: 12, fontWeight: '600', color: 'rgba(1,4,75,0.62)'},
  idVal: {flex: 1, fontSize: 14, fontWeight: '600', color: '#01044B'},
  idStripe: {alignSelf: 'stretch', height: 5, flexDirection: 'row'},
  idNote: {fontSize: 12, color: 'rgba(1,4,75,0.62)', textAlign: 'center', marginTop: 12},
});

export default EditProfile;
