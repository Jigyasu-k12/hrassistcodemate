// Business Card + Scan Biz Card — moved verbatim from Home.js so any screen
// (now: My Profile) can offer them. Same APIs, caching, share link, OCR scan,
// save-to-contacts / gallery and access check as before.
//
//   const bc = useBusinessCardTools();
//   bc.openBusinessCard();          // opens the digital business card
//   bc.scanAvailable && bc.openScanCard();
//   bc.checkScanAccess();           // call on focus (cached, no flicker)
//   return (<>…{bc.modals}</>);     // render once per screen
import React, {useContext, useState, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from 'react-native-modal';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import QRCode from 'react-native-qrcode-svg';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Contacts from 'react-native-contacts';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import AuthContext from '../../context/AuthContext';
import {GlobalColor, ThemeColor} from '../../constants/Colors';
import Text from '../reusable/Text';
import * as ApiService from '../../Utils/Utils';
import {Decrypt, encrypyDecrypt} from '../../Service/Helper';
import {BUSINESSCARD_URL} from '../../API/Api';

// ── Responsive font/size scaler (base width = iPhone 11/standard 375pt) ──
const BASE_WIDTH = 375;
const scale = size => {
  const winW = Dimensions.get('window').width;
  const newSize = size * (winW / BASE_WIDTH);
  return Math.max(size * 0.85, Math.min(newSize, size * 1.15)); // clamp so tablets don't blow up
};

// ── Business card bottom image (resolved once so we know its real aspect ratio) ──
const BC_BOTTOM_IMAGE = require('../../assets/Images/businesscardbelow.jpg');
const BC_BOTTOM_IMAGE_META = Image.resolveAssetSource(BC_BOTTOM_IMAGE) || {};
const BC_BOTTOM_IMAGE_RATIO =
  BC_BOTTOM_IMAGE_META.width && BC_BOTTOM_IMAGE_META.height
    ? BC_BOTTOM_IMAGE_META.height / BC_BOTTOM_IMAGE_META.width
    : null;

// ── Vertical space around the bottom image (must match bcStyles below) ──
// card paddingTop (14) + card paddingBottom (24)
const BC_CARD_V_PADDING = 14 + 24;
// bottomImageSpace marginBottom (0) + scrollContent paddingBottom (0)
// (card paddingBottom above already gives the bottom margin)
const BC_SPACE_BELOW_IMAGE = 0;
// Smallest the image box is allowed to shrink to on extremely small screens
const BC_MIN_IMAGE_H = 40;

// ── Dynamic cache key scoped per username ──
const getBcCacheKey = username => `bc_card_cache_v1_${username}`;

// === SCAN BIZ CARD: dynamic cache key for AI access check, scoped per username ===
const getScanAccessCacheKey = username => `scan_biz_access_cache_v1_${username}`;

// ────────────────────────────────────────────────
// Utility: title-case
// ────────────────────────────────────────────────
const toTitleCase = str => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ────────────────────────────────────────────────
// Utility: shorten social media URL to handle only
// ────────────────────────────────────────────────
const getSocialHandle = url => {
  if (!url) return '';
  try {
    const cleaned = url.replace(/\/$/, '');
    const parts = cleaned.split('/');
    const handle = parts[parts.length - 1];
    if (!handle || handle.includes('.')) {
      return cleaned.replace(/^https?:\/\/(www\.)?/, '');
    }
    return `@${handle}`;
  } catch {
    return url;
  }
};

// ────────────────────────────────────────────────
// Helper extractors
// ────────────────────────────────────────────────
const getPhoneNumber = d => {
  if (!d) return '';
  const arr = Array.isArray(d) ? d : [d];
  const chosen =
    arr.find(p => p.phoneType === '3287') ||
    arr.find(p => p.phoneType === '3288') ||
    arr[0];
  return chosen?.phoneNumber ? `+91 ${chosen.phoneNumber}` : '';
};

const getEmail = d => {
  if (!d) return '';
  const arr = Array.isArray(d) ? d : [d];
  const emailAddr =
    (arr.find(e => e.emailType === '3294') || arr[0])?.emailAddress || '';
  return emailAddr.toLowerCase();
};

const getSocialMedia = d => {
  if (!d) return {linkedin: '', instagram: '', facebook: '', twitter: ''};
  const arr = Array.isArray(d) ? d : [d];
  return {
    linkedin:
      arr.find(a => a?.domainNav?.PicklistOption?.localeLabel === 'LinkedIn')
        ?.url || '',
    instagram:
      arr.find(a => a?.domainNav?.PicklistOption?.localeLabel === 'Instagram')
        ?.url || '',
    facebook:
      arr.find(a => a?.domainNav?.PicklistOption?.localeLabel === 'Facebook')
        ?.url || '',
    twitter:
      arr.find(a => a?.domainNav?.PicklistOption?.localeLabel === 'Twitter/X')
        ?.url || '',
  };
};

// === SCAN BIZ CARD: tiny base64 encoder (UTF-8 safe, no external deps) ===
const B64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const utf8ToBase64 = str => {
  // UTF-8 encode first
  const utf8Bytes = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) {
      utf8Bytes.push(charcode);
    } else if (charcode < 0x800) {
      utf8Bytes.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8Bytes.push(
        0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f),
      );
    } else {
      // surrogate pair
      i++;
      charcode =
        0x10000 +
        (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8Bytes.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f),
      );
    }
  }

  let result = '';
  for (let i = 0; i < utf8Bytes.length; i += 3) {
    const b1 = utf8Bytes[i];
    const b2 = utf8Bytes[i + 1];
    const b3 = utf8Bytes[i + 2];

    const triplet = (b1 << 16) | ((b2 || 0) << 8) | (b3 || 0);

    result += B64_CHARS[(triplet >> 18) & 0x3f];
    result += B64_CHARS[(triplet >> 12) & 0x3f];
    result += b2 !== undefined ? B64_CHARS[(triplet >> 6) & 0x3f] : '=';
    result += b3 !== undefined ? B64_CHARS[triplet & 0x3f] : '=';
  }
  return result;
};

// === SCAN BIZ CARD: build a vCard 3.0 string from scanned contact data (fallback path) ===
const buildVCardFromScan = data => {
  if (!data) return '';
  const name = data.name_english || data.name || '';
  const org = data.company_english || data.company || '';
  const title = data.title_english || data.title || '';
  const phone = data.phone || '';
  const email = data.email || '';
  const address = data.address_english || data.address || '';
  const website = data.website || '';
  const note = data.additional_info_english || data.additional_info || '';

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${name};;;`,
    `FN:${name}`,
  ];
  if (org) lines.push(`ORG:${org}`);
  if (title) lines.push(`TITLE:${title}`);
  if (phone) lines.push(`TEL;TYPE=WORK,VOICE:${phone}`);
  if (email) lines.push(`EMAIL;TYPE=WORK:${email}`);
  if (address) lines.push(`ADR;TYPE=WORK:;;${address};;;;`);
  if (website) lines.push(`URL:${website}`);
  if (note) lines.push(`NOTE:${note.replace(/\n/g, '\\n')}`);
  lines.push('END:VCARD');

  return lines.join('\r\n');
};

// === SCAN BIZ CARD: request contacts permission (Android only; iOS prompts automatically) ===
const requestContactsPermission = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS,
      {
        title: 'Contacts Permission',
        message: 'HR Assist needs access to your contacts to save the scanned business card.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

// === SCAN BIZ CARD: request storage permission for saving image to gallery (Android only) ===
// On Android 10+ (API 29+), CameraRoll.save() writes via MediaStore and does not
// require WRITE_EXTERNAL_STORAGE. Older Android versions still need it granted.
const requestStoragePermission = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    if (Platform.Version >= 29) return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'HR Assist needs access to your storage to save this image to your gallery.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

// === SCAN BIZ CARD: sanity-check that the captured image looks like a card,
// not a badly cropped / off-frame shot. Business cards are roughly 1.4–2.2:1;
// we widen the band a bit to tolerate background in the shot, but still catch
// near-square or extreme panorama-style captures that won't fit the preview box.
const CARD_ASPECT_MIN = 1.15;
const CARD_ASPECT_MAX = 2.6;

const isCardFramedProperly = (width, height) => {
  if (!width || !height) return true; // can't verify — don't block the user
  const ratio = width / height;
  const normalized = ratio < 1 ? 1 / ratio : ratio; // orientation-agnostic
  return normalized >= CARD_ASPECT_MIN && normalized <= CARD_ASPECT_MAX;
};

// === SCAN BIZ CARD: map scanned data -> react-native-contacts record shape ===
const buildContactRecordFromScan = data => {
  if (!data) return null;

  const fullName = (data.name_english || data.name || '').trim();
  const nameParts = fullName.split(' ').filter(Boolean);
  const givenName = nameParts.length ? nameParts[0] : '';
  const familyName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const phone = data.phone || '';
  const email = data.email || '';
  const company = data.company_english || data.company || '';
  const title = data.title_english || data.title || '';
  const address = data.address_english || data.address || '';
  const website = data.website || '';
  const note = data.additional_info_english || data.additional_info || '';

  return {
    givenName,
    familyName,
    displayName: fullName || undefined,
    company,
    jobTitle: title,
    phoneNumbers: phone
      ? [{label: 'work', number: phone}]
      : [],
    emailAddresses: email
      ? [{label: 'work', email}]
      : [],
    postalAddresses: address
      ? [
          {
            label: 'work',
            formattedAddress: address,
            street: address,
            city: '',
            state: '',
            region: '',
            postCode: '',
            country: '',
          },
        ]
      : [],
    urlAddresses: website ? [{label: 'work', url: website}] : [],
    note: note || '',
  };
};

// ────────────────────────────────────────────────
// === SCAN BIZ CARD: Scanned Contact Preview Modal ===
// ────────────────────────────────────────────────
const ScanBizCardModal = ({
  visible,
  onClose,
  capturedImage,
  onCapture,
  onChooseGallery,
  onRetake,
  onSubmit,
  loading,
  scannedContact,
  onSaveContact,
  savingContact,
  onSaveToGallery,
  savingToGallery,
}) => {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      style={{margin: 0, justifyContent: 'center', alignItems: 'center'}}>
      <View style={scanStyles.container}>
        <View style={scanStyles.header}>
          <Text style={scanStyles.headerTitle} Bold>
            Scan Biz Card
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle-outline" size={26} color={GlobalColor.Danger} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={scanStyles.loaderWrap}>
            <ActivityIndicator size="large" color={ThemeColor.Teal} />
            <Text style={scanStyles.loaderText}>Reading card details…</Text>
          </View>
        ) : scannedContact ? (
          // ── Result preview ──
          <ScrollView contentContainerStyle={scanStyles.resultScroll}>
            <Text style={scanStyles.resultName} Bold>
              {scannedContact.name_english || scannedContact.name || 'N/A'}
            </Text>
            {!!(scannedContact.title_english || scannedContact.title) && (
              <Text style={scanStyles.resultRow}>
                {scannedContact.title_english || scannedContact.title}
              </Text>
            )}
            {!!(scannedContact.company_english || scannedContact.company) && (
              <Text style={scanStyles.resultRow}>
                {scannedContact.company_english || scannedContact.company}
              </Text>
            )}
            {!!scannedContact.phone && (
              <Text style={scanStyles.resultRow}>📞 {scannedContact.phone}</Text>
            )}
            {!!scannedContact.email && (
              <Text style={scanStyles.resultRow}>✉️ {scannedContact.email}</Text>
            )}
            {!!(scannedContact.address_english || scannedContact.address) && (
              <Text style={scanStyles.resultRow}>
                📍 {scannedContact.address_english || scannedContact.address}
              </Text>
            )}
            {!!scannedContact.website && (
              <Text style={scanStyles.resultRow}>🌐 {scannedContact.website}</Text>
            )}
            {!!(scannedContact.additional_info_english || scannedContact.additional_info) && (
              <Text style={scanStyles.resultRow}>
                ℹ️ {scannedContact.additional_info_english || scannedContact.additional_info}
              </Text>
            )}

            <TouchableOpacity
              style={[scanStyles.primaryBtn, savingContact && {opacity: 0.7}]}
              onPress={onSaveContact}
              disabled={savingContact}>
              {savingContact ? (
                <ActivityIndicator size="small" color={ThemeColor.OnAmber} />
              ) : (
                <Ionicons name="person-add-outline" size={18} color={ThemeColor.OnAmber} />
              )}
              <Text style={scanStyles.primaryBtnText}>
                {savingContact ? 'Opening…' : 'Save to Contacts'}
              </Text>
            </TouchableOpacity>

            {/* === SCAN BIZ CARD: manual save-to-gallery, available after a successful scan too === */}
            {!!capturedImage && (
              <TouchableOpacity
                style={[scanStyles.galleryBtn, savingToGallery && {opacity: 0.7}]}
                onPress={onSaveToGallery}
                disabled={savingToGallery}>
                {savingToGallery ? (
                  <ActivityIndicator size="small" color={ThemeColor.Teal} />
                ) : (
                  <Ionicons name="images-outline" size={18} color={ThemeColor.Teal} />
                )}
                <Text style={scanStyles.galleryBtnText}>
                  {savingToGallery ? 'Saving…' : 'Save Image to Gallery'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={scanStyles.secondaryBtn} onPress={onRetake}>
              <Text style={scanStyles.secondaryBtnText}>Scan Another Card</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : capturedImage ? (
          // ── Preview captured/selected image, allow save / submit / retake ──
          <View style={scanStyles.previewWrap}>
            <Image source={{uri: capturedImage}} style={scanStyles.previewImage} />

            {/* === SCAN BIZ CARD: manual save-to-gallery button, user-triggered only === */}
            <TouchableOpacity
              style={[scanStyles.galleryBtn, savingToGallery && {opacity: 0.7}, {width: '100%'}]}
              onPress={onSaveToGallery}
              disabled={savingToGallery}>
              {savingToGallery ? (
                <ActivityIndicator size="small" color={ThemeColor.Teal} />
              ) : (
                <Ionicons name="images-outline" size={18} color={ThemeColor.Teal} />
              )}
              <Text style={scanStyles.galleryBtnText}>
                {savingToGallery ? 'Saving…' : 'Save Image to Gallery'}
              </Text>
            </TouchableOpacity>

            <View style={scanStyles.previewBtnRow}>
              <TouchableOpacity style={scanStyles.secondaryBtn} onPress={onRetake}>
                <Text style={scanStyles.secondaryBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={scanStyles.primaryBtn} onPress={onSubmit}>
                <Ionicons name="cloud-upload-outline" size={18} color={ThemeColor.OnAmber} />
                <Text style={scanStyles.primaryBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // ── Empty state, open camera or pick from gallery ──
          <View style={scanStyles.emptyWrap}>
            <Ionicons name="camera-outline" size={64} color={ThemeColor.Teal} />
            <Text style={scanStyles.emptyText}>
              Capture a clear photo of the business card, or choose one from
              your gallery
            </Text>
            <View style={scanStyles.emptyBtnRow}>
              <TouchableOpacity style={scanStyles.primaryBtn} onPress={onCapture}>
                <Ionicons name="camera" size={18} color={ThemeColor.OnAmber} />
                <Text style={scanStyles.primaryBtnText}>Open Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={scanStyles.secondaryBtn} onPress={onChooseGallery}>
                <Ionicons name="images" size={18} color={ThemeColor.Teal} />
                <Text style={scanStyles.secondaryBtnText}>  Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};


// ════════════════════════════════════════════════════════════════
// Hook: state + handlers + modals (body moved from the Home component)
// ════════════════════════════════════════════════════════════════
const useBusinessCardTools = () => {
  const {authContext, AppUserData} = useContext(AuthContext);
  let usrAccess = AppUserData?.data?.userFlag;

  // ── Business Card modal state ──
  const [BusinessCardModal, setBusinessCardModal] = useState(false);
  const [isShare, setIsShare] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [addressEligibility, setAddressEligibility] = useState('');
  const [bcName, setBcName] = useState('');
  const [bcDesignation, setBcDesignation] = useState('');
  const [bcBusinessUnit, setBcBusinessUnit] = useState('');
  const [bcOffice, setBcOffice] = useState('');
  const [bcMobile, setBcMobile] = useState('');
  const [bcEmail, setBcEmail] = useState('');
  const [bcSocialMedia, setBcSocialMedia] = useState({
    linkedin: '',
    instagram: '',
    facebook: '',
    twitter: '',
  });
  const [bcPhotoUrl, setBcPhotoUrl] = useState(null);
  const [bcCompanyName, setBcCompanyName] = useState('');
  const [bcAddress, setBcAddress] = useState('Address not available');
  const [bcWebsite] = useState('https://www.marutisuzuki.com');
  const [bcLoading, setBcLoading] = useState(false);
  // Measured Y position (inside the card's scroll content) where the bottom
  // image starts. Used to size the card + image so the whole card, including
  // the full image, fits on screen without scrolling on every device.
  const [bcImageTopY, setBcImageTopY] = useState(0);
  // height / width of businesscardbelow.jpg — from the bundled asset, and
  // confirmed from the real decoded image on load (covers any device where the
  // asset metadata isn't available).
  const [bcImageRatio, setBcImageRatio] = useState(BC_BOTTOM_IMAGE_RATIO);

  // === SCAN BIZ CARD: access + modal state ===
  const [showScanBizCard, setShowScanBizCard] = useState(false);
  const [isCheckingScanAccess, setIsCheckingScanAccess] = useState(true);
  const [scanBizCardModal, setScanBizCardModal] = useState(false);
  const [scanCapturedImage, setScanCapturedImage] = useState(null); // local uri for preview
  const [scanCapturedBase64, setScanCapturedBase64] = useState(null); // base64 to submit
  const [scanLoading, setScanLoading] = useState(false);
  const [scannedContact, setScannedContact] = useState(null);
  const [savingContact, setSavingContact] = useState(false); // === SCAN BIZ CARD: Add-Contact in progress ===
  const [savingToGallery, setSavingToGallery] = useState(false); // === SCAN BIZ CARD: manual gallery-save in progress ===

  const ref = useRef();
  let base64Logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAA..';

  // ────────────────────────────────────────────────
  // AsyncStorage helpers — all scoped to username
  // ────────────────────────────────────────────────
  const readBcCache = async username => {
    try {
      const raw = await AsyncStorage.getItem(getBcCacheKey(username));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const writeBcCache = async (username, cacheObj) => {
    try {
      await AsyncStorage.setItem(
        getBcCacheKey(username),
        JSON.stringify(cacheObj),
      );
    } catch {
      // silently ignore write errors
    }
  };

  const clearBcCache = async username => {
    try {
      await AsyncStorage.removeItem(getBcCacheKey(username));
    } catch {
      // silently ignore
    }
  };

  const applyBcCache = cache => {
    setBcName(cache.name);
    setBcDesignation(cache.designation);
    setBcOffice(cache.office);
    setBcBusinessUnit(cache.businessUnit);
    setBcMobile(cache.mobile);
    setBcEmail(cache.email);
    setBcSocialMedia(cache.socialMedia);
    setBcPhotoUrl(cache.photoUrl);
    setBcCompanyName(cache.companyName);
    setBcAddress(cache.address);
  };

  // ────────────────────────────────────────────────
  // Send Analytics
  // ────────────────────────────────────────────────
  const SendAnalytics = (PageName) => {
    if (!AppUserData?.data?.userId) {
      return;
    }

    let apiData = {
      StaffNo: AppUserData?.data?.userId,
      DeviceName: DeviceInfo.getBrand(),
      DeviceID: DeviceInfo.getDeviceId(),
      DeviceType: Platform.OS,
      PageName: PageName,
    };

    ApiService.PostMethode('/SubmitAnly', apiData, AppUserData.token, authContext)
      .then(result => {})
      .catch(error => {});
  };

  // ────────────────────────────────────────────────
  // fetchBusinessCard
  // ────────────────────────────────────────────────
  const fetchBusinessCard = useCallback(
    async (forceRefresh = false) => {
      const username = AppUserData?.data?.username;
      if (!username) return;

      if (!forceRefresh) {
        const cached = await readBcCache(username);
        if (cached) {
          applyBcCache(cached);
          return;
        }
      }

      const token = AppUserData.token;
      setBcLoading(true);

      ApiService.PostMethode(
        '/GetBusinessCard',
        {UserName: username},
        token,
        authContext,
      )
        .then(async result => {
          if (!result?.Value) {
            setBcLoading(false);
            return;
          }

          const decryptedData = Decrypt(result.Value);
          const data = JSON.parse(decryptedData);
          if (!data) {
            setBcLoading(false);
            return;
          }

          setCardData(data);

          const empData = data?.EmpEmployment?.EmpEmployment;
          const personalInfo =
            empData?.personNav?.PerPerson?.personalInfoNav?.PerPersonal;
          const phoneInfo = empData?.personNav?.PerPerson?.phoneNav?.PerPhone;
          const emailInfo = empData?.personNav?.PerPerson?.emailNav?.PerEmail;
          const socialInfo =
            empData?.personNav?.PerPerson?.socialAccountNav?.PerSocialAccount;
          const jobInfo = empData?.jobInfoNav?.EmpJob;
          const locationInfo =
            jobInfo?.locationNav?.FOLocation?.addressNavDEFLT
              ?.FOCorporateAddressDEFLT;
          const photoArray = empData?.photoNav?.Photo;

          const salutation = (
            personalInfo?.salutationNav?.PicklistOption?.localeLabel || ''
          ).toUpperCase();
          const firstName = (personalInfo?.firstName || '').toUpperCase();
          const lastName = (personalInfo?.lastName || '').toUpperCase();
          const middleName = (personalInfo?.middleName || '').toUpperCase();

          // Commented out salutation from name display
          const name =
            [/*salutation,*/ firstName, middleName, lastName]
              .filter(Boolean)
              .join(' ') || 'EMPLOYEE NAME';

          const designation = (
            jobInfo?.customString21 || 'DESIGNATION'
          ).toUpperCase();
          const officeValue = (data?.Office || '').toUpperCase();

          const businessUnitFromAPI = (
            jobInfo?.businessUnitNav?.FOBusinessUnit?.description ||
            jobInfo?.businessUnitNav?.FOBusinessUnit?.name ||
            ''
          ).toUpperCase();

          const isMatch =
            officeValue &&
            businessUnitFromAPI &&
            officeValue.toLowerCase() === businessUnitFromAPI.toLowerCase();

          const resolvedBusinessUnit = isMatch ? '' : businessUnitFromAPI;

          const mobile = getPhoneNumber(phoneInfo);
          const email = getEmail(emailInfo);
          const socialMedia = getSocialMedia(socialInfo);

          const photoData = Array.isArray(photoArray)
            ? photoArray.find(p => p.photoType === '1')
            : photoArray?.photoType === '1'
            ? photoArray
            : null;
          const photoUrl = photoData?.photo
            ? `data:image/jpeg;base64,${photoData.photo.replace(/\s+/g, '')}`
            : null;

          const companyName = toTitleCase(
            jobInfo?.companyNav?.FOCompany?.name || 'Maruti Suzuki India Ltd.',
          );

          setBcName(name);
          setBcDesignation(designation);
          setBcOffice(officeValue);
          setBcBusinessUnit(resolvedBusinessUnit);
          setBcMobile(mobile);
          setBcEmail(email);
          setBcSocialMedia(socialMedia);
          setBcPhotoUrl(photoUrl);
          setBcCompanyName(companyName);

          const userId = empData?.userId || '';
          const consentId = '778';

          ApiService.PostMethode(
            '/BusinessCardElig',
            {ConsentID: consentId, EmplID: userId},
            token,
            authContext,
          )
            .then(async eligResult => {
              const eligibility = eligResult?.Value || '';
              setAddressEligibility(eligibility);

              let resolvedAddress = 'Address not available';

              if (eligibility === '' || eligibility === null) {
                const homeAddresses =
                  empData?.personNav?.PerPerson?.homeAddressNavDEFLT
                    ?.PerAddressDEFLT;
                const homeAddr = Array.isArray(homeAddresses)
                  ? homeAddresses.find(a => a.addressType === 'IN_O')
                  : homeAddresses?.addressType === 'IN_O'
                  ? homeAddresses
                  : null;

                if (homeAddr) {
                  const address1 = homeAddr.address1 || '';
                  const restParts = [
                    homeAddr.address2 || '',
                    homeAddr.address3 || '',
                    [
                      homeAddr.city || '',
                      homeAddr.stateNav?.PicklistOption?.localeLabel || '',
                      homeAddr.zipCode,
                    ]
                      .filter(Boolean)
                      .join(', '),
                  ].filter(Boolean).join(' ');

                  const allParts = [address1, restParts].filter(Boolean);
                  resolvedAddress = allParts.join('\n');
                }
              } else if (
                eligibility.includes('not elgibile') ||
                eligibility.includes('not eligible')
              ) {
                const line1 = companyName;
                const line2 = [
                  locationInfo?.address1 || '',
                  locationInfo?.address2 || '',
                  locationInfo?.address3 || '',
                  [
                    locationInfo?.city || '',
                    locationInfo?.stateNav?.PicklistOption?.localeLabel || '',
                    locationInfo?.zipCode,
                  ]
                    .filter(Boolean)
                    .join(', '),
                ].filter(Boolean).join(' ');

                const allParts = [line1, line2].filter(Boolean);
                resolvedAddress = allParts.join('\n');
              }

              setBcAddress(resolvedAddress);

              const cacheObj = {
                name,
                designation,
                office: officeValue,
                businessUnit: resolvedBusinessUnit,
                mobile,
                email,
                socialMedia,
                photoUrl,
                companyName,
                address: resolvedAddress,
              };
              await writeBcCache(username, cacheObj);

              setBcLoading(false);
            })
            .catch(error => {
              setBcLoading(false);
              ApiService.showErrorMessage(error, authContext);
            });
        })
        .catch(error => {
          setBcLoading(false);
          ApiService.showErrorMessage(error, authContext);
        });
    },
    [AppUserData],
  );

  const buildShareUrl = () => {
    const userId = AppUserData?.data?.userId || '';
    const now = new Date();
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const sysdate = `${String(now.getDate()).padStart(2, '0')}-${
      months[now.getMonth()]
    }-${now.getFullYear()}`;
    const encryptedId = encrypyDecrypt(`${userId}#${sysdate}`);
    const urlSafe = encryptedId
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return {url: `${BUSINESSCARD_URL}${urlSafe}`, sysdate};
  };

  // ────────────────────────────────────────────────
  // handleShareBusinessCard
  // ────────────────────────────────────────────────
  const handleShareBusinessCard = () => {
    try {
      const userId = AppUserData?.data?.userId || '';
      const now = new Date();
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      const pad = (n) => String(n).padStart(2, '0');

      const sysdate = `${pad(now.getDate())}-${months[now.getMonth()]}-${now.getFullYear()}`;
      const sysTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const generatedOn = `${sysdate} ${sysTime}`;
      const expiryOn = `${sysdate} 23:59:00`;

      const combined = `${userId}#${sysdate}`;
      const encryptedId = encrypyDecrypt(combined);
      const urlSafe = encryptedId
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const shareUrl = `${BUSINESSCARD_URL}${urlSafe}`;

      Alert.alert(
        'Share Business Card',
        `This link was generated on ${generatedOn} and will be valid till ${expiryOn}.\n\nDo you want to continue?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Share',
            onPress: () => {
              Share.open({
                message: `Hi, I'm ${bcName}\nHere is my Business Card Link: ${shareUrl}\n\n The link is valid till: ${expiryOn}.`,
                title: 'My Business Card',
              }).catch(() => {});
            },
          },
        ],
      );
    } catch (error) {}
  };

  const showBusinessCardModal = async () => {
    SendAnalytics("Business Card");
    setBusinessCardModal(true);
    const username = AppUserData?.data?.username;
    const cached = await readBcCache(username);
    if (cached) {
      applyBcCache(cached);
    } else {
      fetchBusinessCard();
    }
  };

  const handleRefreshBusinessCard = async () => {
    const username = AppUserData?.data?.username;
    await clearBcCache(username);
    fetchBusinessCard(true);
  };

  // === SCAN BIZ CARD: access control check (mirrors checkAIAccess in Tabs.js) ===
  // Reads any cached result first and applies it immediately (no loading flash on
  // repeat visits), then silently refreshes from the API in the background. This
  // is what stops the Scan Biz Card / What's New row from flickering every time
  // this screen regains focus.
  const checkScanBizCardAccess = useCallback(async () => {
    let userId = AppUserData?.data?.userId;
    let token = AppUserData?.token;
    let username = AppUserData?.data?.username;

    let apiData = {
      EmplID: userId,
      ConsentID: '779', // TODO: replace with a dedicated ConsentID for Scan Biz Card once backend provisions one
    };

    let hadCache = false;
    try {
      const cached = await AsyncStorage.getItem(getScanAccessCacheKey(username));
      if (cached !== null) {
        hadCache = true;
        setShowScanBizCard(cached === '1');
        setIsCheckingScanAccess(false);
      }
    } catch {
      // ignore cache read errors, fall through to API check below
    }

    // Only show the "checking access" state on the very first, uncached check
    // for this user — subsequent focuses reuse the cached value silently.
    if (!hadCache) {
      setIsCheckingScanAccess(true);
    }

    ApiService.PostMethode('/CheckAIAccess', apiData, token, authContext)
      .then(async result => {
        const hasAccess = !result?.Value || result?.Value === '';
        setShowScanBizCard(hasAccess);
        setIsCheckingScanAccess(false);
        try {
          await AsyncStorage.setItem(
            getScanAccessCacheKey(username),
            hasAccess ? '1' : '0',
          );
        } catch {
          // ignore cache write errors
        }
      })
      .catch(error => {
        setIsCheckingScanAccess(false);
        // If we already had a cached value applied above, keep it as-is instead
        // of forcing it back to false — avoids an extra visible flicker.
        if (!hadCache) {
          setShowScanBizCard(false);
        }
        ApiService.showErrorMessage(error, authContext);
      });
  }, [AppUserData]);


// === SCAN BIZ CARD: open camera and capture image ===
const handleOpenScanCamera = () => {
  launchCamera(
    {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false, // we'll resize first, then base64 the resized file
      saveToPhotos: false,
      cameraType: 'back',
    },
    async response => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert(
          'Camera Error',
          response.errorMessage || 'Could not capture image. Please try again.',
        );
        return;
      }

      const asset = response.assets && response.assets[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'No image was captured. Please try again.');
        return;
      }

      try {
        // Resize/compress before encoding — a business card only needs to be
        // legible, not full camera resolution. This keeps the base64 payload
        // well under the size where the ssl-pinning bridge call has been
        // observed to corrupt/truncate large JSON string bodies.
        const resized = await ImageResizer.createResizedImage(
          asset.uri,
          1280,   // max width
          1280,   // max height
          'JPEG',
          70,     // quality
          0,      // rotation
        );

        setScanCapturedImage(resized.uri);

        const base64Data = await RNFS.readFile(resized.uri, 'base64');

        if (!base64Data) {
          setScanCapturedImage(null);
          setScanCapturedBase64(null);
          Alert.alert('Error', 'Failed to process the captured image. Please retake the photo.');
          return;
        }

        setScanCapturedBase64(base64Data);

        // === SCAN BIZ CARD: validate immediately on "Use Photo", instead of
        // waiting for a separate Submit tap ===
        processScanBizCardImage(base64Data);
      } catch (e) {
        setScanCapturedImage(null);
        setScanCapturedBase64(null);
        Alert.alert('Error', 'Failed to process the captured image. Please retake the photo.');
      }
    },
  );
};
// === SCAN BIZ CARD: minimum bar for a "usable" OCR result — at least a name
// AND one contact detail (phone or email). A near-empty result almost always
// means the card was cut off / not fully inside the frame, rather than a
// genuinely unusual or blank card.
const isScannedDataUsable = data => {
  if (!data) return false;
  const hasName = !!(data.name_english || data.name);
  const hasContact = !!(data.phone || data.email);
  return hasName && hasContact;
};

// === SCAN BIZ CARD: prompt the user to retake when the card wasn't captured
// properly (cut off / not fully inside the frame) ===
const promptRetakeNotFramed = () => {
  Alert.alert(
    'Image Not Captured Properly',
    "We couldn't read the business card clearly. Please make sure the full card is visible inside the frame and retake the photo.",
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Retake', onPress: handleRetakeScan},
    ],
  );
};


// === SCAN BIZ CARD: send the given base64 image to ScanBusinessCard and
// validate the result. Called automatically right after capture/selection
// (on "Use Photo" / gallery pick), not gated behind a manual Submit tap.
const processScanBizCardImage = base64Data => {
  if (!base64Data || base64Data.length < 100) {
    Alert.alert('Error', 'No valid image captured. Please retake the photo.');
    return;
  }

  // Base64 length should always be a multiple of 4 — a quick structural
  // check that catches truncated/corrupted strings before hitting the API.
  if (base64Data.length % 4 !== 0) {
    Alert.alert(
      'Error',
      'The captured image appears corrupted. Please retake the photo.',
    );
    return;
  }

  const username = AppUserData?.data?.username;
  const token = AppUserData?.token;

  const payload = {
    UserName: username,
    ImageFormat: 'jpeg',
    Image: base64Data,
  };

  setScanLoading(true);

  ApiService.PostMethode('/ScanBusinessCard', payload, token, authContext)
    .then(result => {
      if (!result?.Value) {
        setScanLoading(false);
        promptRetakeNotFramed();
        return;
      }

      try {
        // Outer AES decryption -> {"Value": "{...inner json string...}"}
        const decryptedOuter = Decrypt(result.Value);
        const outerJson = JSON.parse(decryptedOuter);

        // Inner JSON string -> {"success": true, "data": {...}}
        const innerJson = JSON.parse(outerJson.Value);

        setScanLoading(false);

        // === SCAN BIZ CARD: treat a low-confidence / near-empty extraction
        // as "card not framed properly" rather than a generic error, since
        // that's the most common real cause (card off-frame, cut off, too
        // far from camera, or occupying only a small part of the shot) ===
        if (innerJson?.success && isScannedDataUsable(innerJson.data)) {
          setScannedContact(innerJson.data);
        } else {
          promptRetakeNotFramed();
        }
      } catch (e) {
        setScanLoading(false);
        promptRetakeNotFramed();
      }
    })
    .catch(error => {
      setScanLoading(false);
      ApiService.showErrorMessage(error, authContext);
    });
};

// === SCAN BIZ CARD: kept as a fallback trigger for the manual Submit button
// in the preview screen (e.g. if auto-processing was skipped for any reason) ===
const handleSubmitScanBizCard = () => {
  processScanBizCardImage(scanCapturedBase64);
};

// === SCAN BIZ CARD: pick an existing image from the device gallery/photos,
// as an alternative to capturing a new one through the camera ===
const handleChooseFromGallery = () => {
  launchImageLibrary(
    {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false, // same as camera flow — resize first, then base64
      selectionLimit: 1,
    },
    async response => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert(
          'Gallery Error',
          response.errorMessage || 'Could not select image. Please try again.',
        );
        return;
      }

      const asset = response.assets && response.assets[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'No image was selected. Please try again.');
        return;
      }

      try {
        const resized = await ImageResizer.createResizedImage(
          asset.uri,
          1280,
          1280,
          'JPEG',
          70,
          0,
        );

        setScanCapturedImage(resized.uri);

        const base64Data = await RNFS.readFile(resized.uri, 'base64');

        if (!base64Data) {
          setScanCapturedImage(null);
          setScanCapturedBase64(null);
          Alert.alert('Error', 'Failed to process the selected image. Please try again.');
          return;
        }

        setScanCapturedBase64(base64Data);

        // === SCAN BIZ CARD: validate immediately on selection, instead of
        // waiting for a separate Submit tap ===
        processScanBizCardImage(base64Data);
      } catch (e) {
        setScanCapturedImage(null);
        setScanCapturedBase64(null);
        Alert.alert('Error', 'Failed to process the selected image. Please try again.');
      }
    },
  );
};

  const handleRetakeScan = () => {
    setScanCapturedImage(null);
    setScanCapturedBase64(null);
    setScannedContact(null);
    handleOpenScanCamera();
  };

  const handleOpenScanModal = () => {
    SendAnalytics("Scan Biz Card");
    setScanCapturedImage(null);
    setScanCapturedBase64(null);
    setScannedContact(null);
    setScanBizCardModal(true);
  };

  const handleCloseScanModal = () => {
    setScanBizCardModal(false);
    setScanCapturedImage(null);
    setScanCapturedBase64(null);
    setScannedContact(null);
    setScanLoading(false);
  };

  // === SCAN BIZ CARD: manually save the currently captured/selected image to the
  // device's gallery, on user request. Nothing is saved automatically — this is
  // only invoked when the user taps "Save Image to Gallery". Enables users to
  // retrieve, review and reuse these images later (record-keeping / audit trail). ===
  const handleSaveImageToGallery = async () => {
    if (!scanCapturedImage) {
      Alert.alert('Error', 'No image available to save.');
      return;
    }

    setSavingToGallery(true);
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        setSavingToGallery(false);
        Alert.alert(
          'Permission Required',
          'Storage permission is needed to save this image to your gallery.',
        );
        return;
      }

      await CameraRoll.save(scanCapturedImage, {
        type: 'photo',
        album: 'HR Assist Business Cards',
      });

      setSavingToGallery(false);
      Alert.alert('Saved', 'The business card image has been saved to your gallery.');
    } catch (e) {
      setSavingToGallery(false);
      Alert.alert('Error', 'Failed to save the image to your gallery. Please try again.');
    }
  };

  // === SCAN BIZ CARD: open the native "Add Contact" screen, pre-filled with scanned data ===
  const handleSaveScannedContact = async () => {
    if (!scannedContact) {
      Alert.alert('Error', 'No contact data to save.');
      return;
    }

    setSavingContact(true);

    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        setSavingContact(false);
        Alert.alert(
          'Permission Required',
          'Contacts permission is needed to save this card. You can still save it as a file instead.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Save as File', onPress: handleSaveScannedContactFallback},
          ],
        );
        return;
      }

      const record = buildContactRecordFromScan(scannedContact);
      if (!record) {
        setSavingContact(false);
        Alert.alert('Error', 'No contact data to save.');
        return;
      }

      // openContactForm shows the native "Create Contact" screen, pre-filled,
      // and lets the user review/edit and tap Save themselves — same UX as
      // saving a contact normally from the Phone/Contacts app.
      await Contacts.openContactForm({
        ...record,
        isNew: true,
      });

      setSavingContact(false);
    } catch (error) {
      setSavingContact(false);
      // Fallback to vCard share if the native form isn't available on this device/build
      Alert.alert(
        'Could not open Contacts',
        'Would you like to save this card as a file instead?',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Save as File', onPress: handleSaveScannedContactFallback},
        ],
      );
    }
  };

  // === SCAN BIZ CARD: vCard share fallback (used only if native contact form fails) ===
  const handleSaveScannedContactFallback = () => {
    try {
      const vcard = buildVCardFromScan(scannedContact);
      if (!vcard) {
        Alert.alert('Error', 'No contact data to save.');
        return;
      }

      const base64Vcard = utf8ToBase64(vcard);

      Share.open({
        url: `data:text/vcard;base64,${base64Vcard}`,
        filename: 'contact',
        type: 'text/vcard',
        title: 'Save Contact',
      }).catch(() => {});
    } catch (e) {
      Alert.alert('Error', 'Unable to save contact.');
    }
  };

  // ── Card dimensions ──
  const WIN_H = Dimensions.get('window').height;
  const WIN_W = Dimensions.get('window').width;
  // Card occupies 97% of screen width (slightly larger than before), full width (no brand panel)
  const CARD_W = WIN_W * 0.97;
  // Card height = dynamic based on social profiles and screen size
  const hasSocialProfiles = bcSocialMedia.linkedin || bcSocialMedia.instagram || bcSocialMedia.facebook || bcSocialMedia.twitter;
  // Increase height for very large screens (iPhone Pro Max, 17 Pro, etc.)
  const isVeryLargeScreen = WIN_H > 900;
  const BASE_CARD_H = hasSocialProfiles
    ? (isVeryLargeScreen ? WIN_H * 0.85 : WIN_H * 0.78)
    : (isVeryLargeScreen ? WIN_H * 0.77 : WIN_H * 0.7);

  // ── Bottom image sizing ──
  // The image box is sized to EXACTLY the picture's own aspect ratio, so there
  // is no empty band above it (which used to overlap the divider line) and no
  // empty band below it (the white gap on big screens). The card then wraps
  // its content exactly, so it never leaves extra white space either.
  //
  // Width the image is drawn at: 125% of its container (same as before)
  // (card width − 16px horizontal padding on each side − 20px marginRight).
  const BC_IMAGE_RENDER_W = (CARD_W - 32 - 20) * 1.25;
  // Upper limit on image height (same 33% of screen height as the original).
  const BC_IMAGE_MAX_H = WIN_H * 0.33;

  // Natural size of the image at that width, capped to the max height while
  // keeping the aspect ratio.
  let bcImageW = BC_IMAGE_RENDER_W;
  let bcImageH = bcImageRatio ? BC_IMAGE_RENDER_W * bcImageRatio : BC_IMAGE_MAX_H;
  if (bcImageH > BC_IMAGE_MAX_H) {
    bcImageH = BC_IMAGE_MAX_H;
    bcImageW = bcImageRatio ? bcImageH / bcImageRatio : BC_IMAGE_RENDER_W;
  }

  // Never let the card grow past the visible screen (leave room for the iOS
  // status bar / home indicator on small iPhones).
  const MAX_CARD_H = Math.min(WIN_H * 0.94, WIN_H - (Platform.OS === 'ios' ? 48 : 24));

  let CARD_H = BASE_CARD_H;
  if (bcImageTopY > 0) {
    // Card height = padding + everything above the image (measured)
    // + image + space below. Wrapping the content exactly removes the
    // leftover white space at the bottom on big screens.
    const requiredCardH =
      BC_CARD_V_PADDING + bcImageTopY + bcImageH + BC_SPACE_BELOW_IMAGE;
    CARD_H = Math.min(requiredCardH, MAX_CARD_H);

    // Small screens: if it doesn't fit, scale the image down (keeping its
    // aspect ratio, so it's never cropped) to exactly the space that's left.
    if (requiredCardH > MAX_CARD_H) {
      const availableForImage = Math.max(
        BC_MIN_IMAGE_H,
        MAX_CARD_H - BC_CARD_V_PADDING - bcImageTopY - BC_SPACE_BELOW_IMAGE,
      );
      if (availableForImage < bcImageH) {
        const shrink = availableForImage / bcImageH;
        bcImageH = availableForImage;
        bcImageW = bcImageW * shrink;
      }
    }
  }

  // === Whether Scan Biz Card is currently visible on this row (access resolved + granted) ===
  const scanBizCardVisible =
    usrAccess !== 'Y' && !isCheckingScanAccess && showScanBizCard;


  const modals = (
    <>
      {/* ─────────────────────────────────────────────────────
          BUSINESS CARD MODAL - New Design
          Full width card with logo at top, QR code on right side
         ───────────────────────────────────────────────────── */}
      <Modal
        isVisible={BusinessCardModal}
        transparent={true}
        style={{margin: 0, justifyContent: 'center', alignItems: 'center'}}>
        <ViewShot
          ref={ref}
          options={{fileName: 'BusinessCard', format: 'jpg', quality: 0.9}}
          style={{alignItems: 'center', justifyContent: 'center'}}>
          <View style={[bcStyles.card, {width: CARD_W, height: CARD_H}]}>
            {/* Close button - top left inside card */}
            <TouchableOpacity
              style={bcStyles.closeButton}
              onPress={() => setBusinessCardModal(false)}>
              <Ionicons name="close-circle" size={scale(22)} color={ThemeColor.Teal} />
            </TouchableOpacity>

            {bcLoading ? (
              <View style={bcStyles.loaderWrap}>
                <ActivityIndicator size="large" color={ThemeColor.Teal} />
                <Text style={bcStyles.loaderText}>Loading card…</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={bcStyles.scrollContent}
                bounces={false}>

                {/* Logo at top right corner - now inside ScrollView */}
                <View style={bcStyles.logoTopRight}>
                  <Image
                    source={require('../../assets/Images/MarutiLogo1.png')}
                    style={bcStyles.logoImageTop}
                  />
                </View>

                {/* Profile section with QR code */}
                <View style={bcStyles.profileContainer}>
                  {/* QR Code - Absolute positioned on top right */}
                  <View style={bcStyles.qrContainerAbsolute}>
                    <View style={bcStyles.qrWrapper}>
                      <QRCode
                        value={buildShareUrl().url}
                        logo={{uri: base64Logo}}
                        logoSize={scale(6)}
                        size={scale(65)}
                        logoBackgroundColor="transparent"
                      />
                    </View>
                    {/* Action buttons below QR code */}
                    {isShare && (
                      <View style={bcStyles.qrActionButtons}>
                        <TouchableOpacity
                          style={bcStyles.qrActionBtn}
                          onPress={handleRefreshBusinessCard}>
                          <Ionicons
                            name="refresh-outline"
                            size={scale(24)}
                            color={ThemeColor.Teal}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={bcStyles.qrActionBtn}
                          onPress={handleShareBusinessCard}>
                          <Ionicons
                            name="share-social-outline"
                            size={scale(24)}
                            color={ThemeColor.Teal}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Left: Photo and details */}
                  <View style={bcStyles.profileLeft}>
                    <View style={bcStyles.avatarWrap}>
                      {bcPhotoUrl ? (
                        <Image
                          source={{uri: bcPhotoUrl}}
                          style={bcStyles.avatar}
                        />
                      ) : AppUserData?.data?.profile_photo ? (
                        <Image
                          source={{uri: AppUserData.data.profile_photo}}
                          style={bcStyles.avatar}
                        />
                      ) : (
                        <View
                          style={[bcStyles.avatar, bcStyles.avatarPlaceholder]}>
                          <Text style={bcStyles.avatarInitial}>
                            {bcName ? bcName.charAt(0) : '?'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={bcStyles.nameBlock}>
                      <Text style={bcStyles.nameText} numberOfLines={2}>
                        {bcName}
                      </Text>
                      {!!bcDesignation && (
                        <Text style={bcStyles.designationText}>
                          {bcDesignation}
                        </Text>
                      )}
                      {!!bcOffice && (
                        <Text style={bcStyles.departmentText}>{bcOffice}</Text>
                      )}
                      {!!bcBusinessUnit && (
                        <Text style={bcStyles.departmentText}>
                          {bcBusinessUnit}
                        </Text>
                      )}
                    </View>

                    {/* Contact details - moved above the line */}
                    <View style={bcStyles.contacts}>
                      {/* Phone */}
                      {!!bcMobile && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`tel:${bcMobile}`)}>
                          <View style={bcStyles.contactRow}>
                            <Ionicons name="call-outline" size={scale(14)} color="#000" />
                            <Text style={bcStyles.contactText}>{bcMobile}</Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Email */}
                      {!!bcEmail && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`mailto:${bcEmail}`)}>
                          <View style={bcStyles.contactRow}>
                            <Ionicons name="mail-outline" size={scale(14)} color="#000" />
                            <Text style={bcStyles.contactText}>
                              {(() => {
                                const [localPart, domain] = bcEmail.split('@');
                                const capitalizedLocal = localPart.split('.').map(part =>
                                  part.charAt(0).toUpperCase() + part.slice(1)
                                ).join('.');
                                return domain ? `${capitalizedLocal}@${domain}` : capitalizedLocal;
                              })()}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* LinkedIn */}
                      {!!bcSocialMedia.linkedin && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(bcSocialMedia.linkedin)}>
                          <View style={bcStyles.contactRow}>
                            <Ionicons name="logo-linkedin" size={scale(14)} color="#0077B5" />
                            <Text style={bcStyles.contactText}>LinkedIn</Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Instagram */}
                      {!!bcSocialMedia.instagram && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(bcSocialMedia.instagram)}>
                          <View style={bcStyles.contactRow}>
                            <Ionicons name="logo-instagram" size={scale(14)} color="#E4405F" />
                            <Text style={bcStyles.contactText}>Instagram</Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Facebook */}
                      {!!bcSocialMedia.facebook && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(bcSocialMedia.facebook)}>
                          <View style={bcStyles.contactRow}>
                            <Ionicons name="logo-facebook" size={scale(14)} color="#1877F2" />
                            <Text style={bcStyles.contactText}>Facebook</Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Twitter/X */}
                      {!!bcSocialMedia.twitter && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(bcSocialMedia.twitter)}>
                          <View style={bcStyles.contactRow}>
                            <Ionicons name="logo-twitter" size={scale(14)} color="#1DA1F2" />
                            <Text style={bcStyles.contactText}>Twitter</Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Address */}
                      <View style={bcStyles.contactRow}>
                        <Ionicons name="location-outline" size={scale(14)} color="#000" style={{marginTop: 2}} />
                        <Text style={bcStyles.addressText}>{bcAddress}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Divider */}
                <View style={bcStyles.divider} />

                {/* Bottom image — box is exactly the picture's size (no empty
                    bands), starts below the divider, and scales down on small
                    screens so it's never cut off */}
                <View
                  style={[bcStyles.bottomImageSpace, {height: bcImageH}]}
                  onLayout={e => {
                    // Y of the image block inside the scroll content — this does
                    // not depend on the image/card height, so it measures once
                    // and stays stable (no layout loop).
                    const y = Math.ceil(e.nativeEvent.layout.y);
                    if (y > 0 && Math.abs(y - bcImageTopY) > 1) {
                      setBcImageTopY(y);
                    }
                  }}>
                  <Image
                    source={BC_BOTTOM_IMAGE}
                    style={[
                      bcStyles.bottomImage,
                      {
                        width: bcImageW,
                        height: bcImageH,
                        // hide for the very first frame until we've measured,
                        // so it never flashes in a cut-off state
                        opacity: bcImageTopY > 0 ? 1 : 0,
                      },
                    ]}
                    onLoad={e => {
                      const src = e?.nativeEvent?.source;
                      if (src?.width && src?.height) {
                        const r = src.height / src.width;
                        if (!bcImageRatio || Math.abs(r - bcImageRatio) > 0.001) {
                          setBcImageRatio(r);
                        }
                      }
                    }}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </ViewShot>
      </Modal>

      {/* === SCAN BIZ CARD: Scan modal (independent of Business Card modal) === */}
      <ScanBizCardModal
        visible={scanBizCardModal}
        onClose={handleCloseScanModal}
        capturedImage={scanCapturedImage}
        onCapture={handleOpenScanCamera}
        onChooseGallery={handleChooseFromGallery}
        onRetake={handleRetakeScan}
        onSubmit={handleSubmitScanBizCard}
        loading={scanLoading}
        scannedContact={scannedContact}
        onSaveContact={handleSaveScannedContact}
        savingContact={savingContact}
        onSaveToGallery={handleSaveImageToGallery}
        savingToGallery={savingToGallery}
      />

    </>
  );

  return {
    openBusinessCard: showBusinessCardModal,
    openScanCard: handleOpenScanModal,
    checkScanAccess: checkScanBizCardAccess,
    // true once access is resolved + granted (same rule Home used)
    scanAvailable: scanBizCardVisible,
    checkingScanAccess: isCheckingScanAccess,
    modals,
  };
};

// ─────────────────────────────────────────────────────
// Business Card styles — New Design
// Full width card with logo at top, QR code on right, all info above line
// ─────────────────────────────────────────────────────
const bcStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    padding: 0,
    paddingTop: 14, // was 8 — slightly taller card
    paddingHorizontal: 16,
    paddingBottom: 24, // was 16 — slightly taller card
    overflow: 'visible',
  },

  scrollContent: {
    paddingBottom: 0, // card paddingBottom already provides the bottom margin
    paddingTop: 50,
  },

  logoTopRight: {
    position: 'absolute',
    top: -10,
    right: -3,
    zIndex: 20,
    pointerEvents: 'none',
  },

  logoImageTop: {
    width: scale(200),
    height: scale(48),
    resizeMode: 'contain',
  },

  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },

  loaderText: {
    marginTop: 12,
    fontSize: scale(12),
    color: '#555555',
    fontWeight: '500',
  },

  // Profile container with photo on left and QR on right
  profileContainer: {
    flexDirection: 'column',
    marginBottom: 6,
    position: 'relative',
    pointerEvents: 'box-none',
  },

  profileLeft: {
    flex: 1,
    width: '100%',
    pointerEvents: 'box-none',
  },

  qrContainerAbsolute: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },

  avatarWrap: {
    width: scale(80),
    height: scale(80),
    marginTop: scale(-35),
    marginBottom: scale(16),
    borderRadius: scale(40),
    borderWidth: 2,
    borderColor: '#666666',
    overflow: 'hidden',
  },

  avatar: {
    width: '100%',
    height: '100%',
  },

  avatarPlaceholder: {
    backgroundColor: ThemeColor.Teal,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },

  avatarInitial: {
    color: '#ffffff',
    fontSize: scale(28),
    fontWeight: '700',
  },

  nameBlock: {
    marginTop: 0,
    marginBottom: 4,
  },

  nameText: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#000000',
    lineHeight: scale(18),
    textTransform: 'uppercase',
    marginBottom: 3,
  },

  designationText: {
    fontSize: scale(11),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scale(15),
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  departmentText: {
    fontSize: scale(10),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scale(14),
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  qrContainer: {
    flexDirection: 'row',
    marginLeft: 0,
    marginTop: -10,
    alignItems: 'center',
  },

  qrWrapper: {
    marginRight: 4,
  },

  qrActionButtons: {
    flexDirection: 'column',
    gap: 0,
    alignItems: 'center',
    marginTop: -4,
    pointerEvents: 'box-none',
  },

  qrActionBtn: {
    padding: 16,
    minWidth: 50,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -8,
    pointerEvents: 'auto',
  },

  divider: {
    height: 1,
    backgroundColor: '#CCCCCC',
    marginTop: 14,
    marginBottom: 0, // was -12: let the image start below the line, never over it
    position: 'relative',
    zIndex: 10,
  },

  contacts: {
    paddingLeft: 8,
    marginTop: 4,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  contactText: {
    fontSize: scale(10),
    fontWeight: '400',
    color: '#000000',
    marginLeft: 8,
    flex: 1,
  },

  addressText: {
    fontSize: scale(10),
    fontWeight: '400',
    color: '#000000',
    lineHeight: scale(14),
    marginLeft: 8,
    flex: 1,
  },

  bottomImageSpace: {
    // height is set inline to exactly the image height (no empty bands)
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 4,
    marginTop: 6, // was -10: small gap below the divider instead of overlapping it
    marginBottom: 0,
    marginRight: 20,
  },

  bottomImage: {
    width: '125%',
    height: Dimensions.get('window').height * 0.33,
    resizeMode: 'contain',
  },

  closeButton: {
    position: 'absolute',
    top: 2,
    left: 2,
    zIndex: 1000,
    padding: 4,
  },
});

// ─────────────────────────────────────────────────────
// === SCAN BIZ CARD: modal styles ===
// ─────────────────────────────────────────────────────
const scanStyles = StyleSheet.create({
  container: {
    width: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    color: ThemeColor.TealDeep,
  },
  loaderWrap: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#555555',
  },
  emptyWrap: {
    minHeight: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // === SCAN BIZ CARD: row holding Open Camera + Choose from Gallery ===
  emptyBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  previewWrap: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 16,
  },
  previewBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  resultScroll: {
    paddingBottom: 8,
  },
  resultName: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 8,
  },
  resultRow: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    lineHeight: 20,
    
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: ThemeColor.Amber,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
    shadowColor: ThemeColor.AmberDark,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: ThemeColor.OnAmber,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: ThemeColor.Teal,
    gap: 8,
  },
  secondaryBtnText: {
    color: ThemeColor.Teal,
    fontWeight: '600',
    fontSize: 14,
  },
  // === SCAN BIZ CARD: manual "Save Image to Gallery" button ===
  galleryBtn: {
    flexDirection: 'row',
    backgroundColor: ThemeColor.TealLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: ThemeColor.TealSoft,
    gap: 8,
  },
  galleryBtnText: {
    color: ThemeColor.TealDark,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default useBusinessCardTools;
