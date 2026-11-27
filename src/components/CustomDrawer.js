import React, {useContext, useMemo, useState} from 'react';
import {
  DrawerContentScrollView,
  useDrawerStatus,
} from '@react-navigation/drawer';
import {View, StyleSheet, Image, TouchableOpacity, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Share from 'react-native-share';
import QRCode from 'react-native-qrcode-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AuthContext from '../context/AuthContext';
import {HomePalette as P} from '../constants/Colors';
import * as ApiService from '../Utils/Utils';
import {LoadingScreen} from './reusable/LoadingScreen';
import Toast from 'react-native-simple-toast';
import {AppIcon, IconBadge} from './icons/AppIcon';
import {HText} from './home/homeTheme';
import HomeSheet from './home/HomeSheet';
import {
  buildBusinessCardLink,
  shareBusinessCardLink,
} from './businessCard/businessCardLink';

const BRAND_LOGO = require('../assets/Images/MarutiLogo1.png'); // 8340×867 wordmark
const BRAND_MARK = require('../assets/Images/mslogo.png'); // 784×312 M·S marks
const APP_VERSION = '2.2.3';
const QR_SIZE = 152;

const myCustomeSharing = async () => {
  const shareOption = {
    message:
      'You may download latest version of HR Assist mobile app from following link:https://msilappstore.in/HrAssist/',
  };
  try {
    await Share.open(shareOption);
  } catch (error) {
    // user dismissed the share sheet
  }
};

const initialsOf = name => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) {
    return '?';
  }
  return (
    (parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')
  ).toUpperCase();
};

const titleCase = s =>
  String(s || '')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

// QR inside scanner-style amber corners, with the Maruti mark at the centre.
// The mark is overlaid (not the QR lib's square logo) so it keeps its shape;
// error correction "H" keeps the code scannable underneath it.
const ScanFrame = ({value, size}) => {
  const frame = size + 36;
  return (
    <View style={[styles.frame, {width: frame, height: frame}]}>
      {['tl', 'tr', 'bl', 'br'].map(c => (
        <View key={c} style={[styles.corner, styles[c]]} />
      ))}
      <View style={styles.qrBox}>
        <QRCode
          value={value}
          size={size}
          color={P.deep}
          backgroundColor="#FFFFFF"
          ecl="H"
          quietZone={0}
        />
        <View style={styles.markWrap} pointerEvents="none">
          <View style={styles.markBadge}>
            <Image
              source={BRAND_MARK}
              style={{width: size * 0.22, height: (size * 0.22 * 312) / 784}}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const MenuRow = ({icon, label, onPress}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={styles.row}>
    <IconBadge name={icon} size={36} iconSize={19} />
    <HText style={styles.rowLabel} numberOfLines={1}>
      {label}
    </HText>
    <AppIcon
      name="chevronRight"
      size={16}
      color={P.lineStrong}
      strokeWidth={2}
    />
  </TouchableOpacity>
);

function CustomDrawer(props) {
  const {authContext, AppUserData} = useContext(AuthContext);
  const [loader, setLoader] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const drawerStatus = useDrawerStatus();
  const {navigation} = props;

  const usrAccess = AppUserData?.data?.userFlag;
  const userId = AppUserData?.data?.userId;
  const fullName = AppUserData?.data?.EMPL_NAME || 'User';
  const photo = AppUserData?.data?.profile_photo;
  const showCard = usrAccess != 'Y'; // same rule as Business card on Home / Profile

  // Rebuilt each time the drawer opens → always today's valid link
  const link = useMemo(
    () => buildBusinessCardLink(userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, drawerStatus],
  );

  const go = (route, params) => {
    navigation.closeDrawer();
    navigation.navigate(route, params);
  };

  const logoutApi = () => {
    setLoader(true);
    ApiService.PostMethode('/Logout', {}, AppUserData.token, authContext)
      .then(result => {
        setLoader(false);
        if (result && result.Result == false) {
          Toast.show('Logout failed try again');
        } else {
          authContext.signOut();
        }
      })
      .catch(error => {
        setLoader(false);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  const confirmLogout = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign out', style: 'destructive', onPress: logoutApi},
    ]);

  if (loader) {
    return <LoadingScreen />;
  }

  return (
    <DrawerContentScrollView
      {...props}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[P.tealInk, P.deep, P.deep]}
        locations={[0, 0.5, 1]}
        start={{x: 0.85, y: 0}}
        end={{x: 0.2, y: 1}}
        style={[
          styles.header,
          {paddingTop: insets.top + 16, paddingBottom: showCard ? 58 : 18},
        ]}>
        <View style={styles.headerTop}>
          <View style={styles.logoBadge}>
            <Image
              source={BRAND_LOGO}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Maruti Suzuki"
            />
          </View>
          <TouchableOpacity
            onPress={() => navigation.closeDrawer()}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            style={styles.closeBtn}>
            <AppIcon name="close" size={16} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.profile}
          activeOpacity={0.8}
          onPress={() => go('EditProfile')}
          accessibilityRole="button"
          accessibilityLabel={`${titleCase(fullName)}. Open my profile`}>
          {photo ? (
            <Image source={{uri: photo}} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={[P.mutedOnDark, P.mint]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.avatar}>
              <HText style={styles.avatarText}>{initialsOf(fullName)}</HText>
            </LinearGradient>
          )}
          <View style={styles.profileText}>
            <HText style={styles.name}>{titleCase(fullName)}</HText>
            <HText style={styles.profileSub}>View my profile</HText>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Business card QR (PhonePe-style card overlapping the header) ── */}
      {showCard && (
        <View style={styles.qrCard}>
          <View style={styles.qrHead}>
            <HText style={styles.qrEyebrow}>MY BUSINESS CARD</HText>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setQrOpen(true)}
            accessibilityRole="imagebutton"
            accessibilityLabel="Business card QR code. Tap to enlarge"
            style={styles.qrTap}>
            <ScanFrame value={link.url} size={QR_SIZE} />
          </TouchableOpacity>

          <HText style={styles.qrTitle}>Scan to view my business card</HText>
          <HText style={styles.qrSub}>
            Valid till 11:59 PM today · tap the code to enlarge
          </HText>

          <View style={styles.qrBtns}>
            <TouchableOpacity
              onPress={() => shareBusinessCardLink(userId, titleCase(fullName))}
              accessibilityRole="button"
              style={[styles.qrBtn, styles.qrBtnAmber]}>
              <AppIcon
                name="share"
                size={16}
                color={P.onAmber}
                strokeWidth={2}
              />
              <HText style={styles.qrBtnAmberText}>Share link</HText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Menu ── */}
      <View style={styles.menu}>
        <MenuRow icon="home" label="Home" onPress={() => go('Home')} />
        <MenuRow icon="share" label="Share App" onPress={myCustomeSharing} />

        <TouchableOpacity
          onPress={confirmLogout}
          accessibilityRole="button"
          style={styles.signOut}>
          <AppIcon name="logout" size={18} color="#C2362F" strokeWidth={2} />
          <HText style={styles.signOutText}>Sign out</HText>
        </TouchableOpacity>

        <HText style={styles.footer}>
          HR Assist · version {APP_VERSION}
          {'\n'}Copyright {'©'} 2018 Maruti Suzuki India Ltd.
        </HText>
      </View>

      {/* Enlarged QR for easier scanning */}
      {showCard && (
        <HomeSheet
          visible={qrOpen}
          onClose={() => setQrOpen(false)}
          eyebrow="My business card"
          title="Scan to view my card">
          <View style={styles.bigQr}>
            <ScanFrame value={link.url} size={232} />
            <HText style={styles.bigQrName}>{titleCase(fullName)}</HText>
            <HText style={styles.qrSub}>Valid till 11:59 PM today</HText>
          </View>
        </HomeSheet>
      )}
    </DrawerContentScrollView>
  );
}

const CORNER = 24;
const THICK = 3;

const styles = StyleSheet.create({
  scroll: {backgroundColor: P.canvas},
  // DrawerContentScrollView adds its own top inset; the header handles it instead.
  scrollContent: {paddingTop: 0},
  header: {paddingHorizontal: 18, borderBottomRightRadius: 24},
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logoBadge: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  logo: {width: 124, height: 13},
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profile: {flexDirection: 'row', alignItems: 'center'},
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  avatarText: {fontSize: 16, fontWeight: '700', color: P.deep},
  profileText: {flex: 1, marginLeft: 12},
  name: {fontSize: 16, lineHeight: 20, fontWeight: '700', color: '#FFFFFF'},
  profileSub: {fontSize: 12, color: P.lineStrong, marginTop: 2},

  // QR card
  qrCard: {
    marginTop: -42,
    marginHorizontal: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    alignItems: 'center',
    shadowColor: P.deeper,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
  },
  qrHead: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  qrEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: P.amberInk,
  },
  qrTap: {alignItems: 'center'},
  frame: {alignItems: 'center', justifyContent: 'center'},
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: P.amber,
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: THICK,
    borderLeftWidth: THICK,
    borderTopLeftRadius: 10,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: THICK,
    borderRightWidth: THICK,
    borderTopRightRadius: 10,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: THICK,
    borderLeftWidth: THICK,
    borderBottomLeftRadius: 10,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: THICK,
    borderRightWidth: THICK,
    borderBottomRightRadius: 10,
  },
  qrBox: {padding: 6, borderRadius: 10, backgroundColor: '#FFFFFF'},
  markWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBadge: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  qrTitle: {
    marginTop: 12,
    fontSize: 14.5,
    fontWeight: '700',
    color: P.deep,
    textAlign: 'center',
  },
  qrSub: {marginTop: 3, fontSize: 12, color: P.sub, textAlign: 'center'},
  qrBtns: {flexDirection: 'row', alignSelf: 'stretch', marginTop: 14},
  qrBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBtnAmber: {
    backgroundColor: P.amber,
    shadowColor: P.amberStrong,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },
  qrBtnAmberText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.onAmber,
    marginLeft: 6,
  },
  bigQr: {alignItems: 'center', paddingVertical: 8},
  bigQrName: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: P.deep,
    textTransform: 'capitalize',
  },

  menu: {paddingHorizontal: 10, paddingTop: 12, paddingBottom: 16},
  row: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  rowLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: P.deep,
  },
  signOut: {
    marginTop: 14,
    marginHorizontal: 10,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0C9C6',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C2362F',
    marginLeft: 8,
  },
  footer: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    color: P.sub,
  },
});

export default CustomDrawer;
