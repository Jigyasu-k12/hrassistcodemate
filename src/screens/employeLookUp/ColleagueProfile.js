// Colleague profile — shared by EmployeProfile.js (from Employee Lookup) and
// ReportsToEmpProfile.js (from "Reports to"). Teal Glow design (Colleague.dc).
// Data from /GetEmpSearch; contact + vehicle details follow the usrAccess rule.
import React, {useState, useEffect, useContext, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import AuthContext from '../../context/AuthContext';
import * as ApiService from '../../Utils/Utils';
import {ThemeColor, HomePalette as P} from '../../constants/Colors';
import {Decrypt} from '../../Service/Helper';
import {HText} from '../../components/home/homeTheme';
import {HeaderBackdrop} from '../../components/home/HomeHeader';
import {AppIcon} from '../../components/icons/AppIcon';

// ── helpers ──
const dec = v => {
  try {
    return v ? String(Decrypt(v) || '').trim() : '';
  } catch (e) {
    return '';
  }
};
const titleCase = s =>
  String(s || '')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
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
const emailOf = raw =>
  !raw
    ? ''
    : raw.includes('@')
    ? raw.toLowerCase()
    : `${raw.toLowerCase()}@maruti.co.in`;
// "+91 98••• ••210" style mask: keep the first 2 and last 3 digits
const maskPhone = p => {
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) {
    d = d.slice(2); // drop the India country code before masking
  }
  if (d.length < 6) {
    return p;
  }
  return `${d.slice(0, 2)}${'•'.repeat(d.length - 5)}${d.slice(-3)}`;
};
// "Reports to" arrives as e.g. "NAME (123456)" — split for display
const splitReporter = raw => {
  const m = String(raw || '').match(/^(.*?)\s*[(\-–]\s*([\dA-Z]+)\s*\)?\s*$/i);
  return m
    ? {name: m[1].trim(), id: m[2]}
    : {name: String(raw || '').trim(), id: ''};
};

// ── vehicles ──
// Values may arrive encrypted (like the other fields) or plain — handle both.
// Encrypted values are base64 AES output: ≥24 chars, length a multiple of 4,
// only [A-Za-z0-9+/=]. Plain data ("HR26DW2718, HR26DW2719", "CANDOR") never is.
const looksEncrypted = s =>
  s.length >= 24 && s.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(s);
// Decrypt returns "" for an encrypted BLANK as well as for plain text, so the
// value's shape decides: encrypted → use the decrypted result (even if empty,
// which means "no data"); otherwise → it's already plain.
const val = raw => {
  const s = String(raw || '').trim();
  if (!s) {
    return '';
  }
  return looksEncrypted(s) ? dec(s) : s;
};
const EMPTY = /^(na|n\/a|null|undefined|-|0)?$/i;
const list = raw =>
  val(raw)
    .split(',')
    .map(x => x.trim())
    .map(x => (EMPTY.test(x) ? '' : x));
// "HR26DW2718, HR26DW2719" + matching lists → one object per vehicle (by position)
export const parseVehicles = row => {
  if (!row) {
    return [];
  }
  const nos = list(row.VEHICLE_NO);
  const tags = list(row.TAG_NO);
  const slots = list(row.SLOT_NO);
  const parks = list(row.PARKING_LOCATION);
  const models = list(row.VEHICLE_MODEL);
  const n = Math.max(
    nos.length,
    tags.length,
    slots.length,
    parks.length,
    models.length,
  );
  const out = [];
  for (let i = 0; i < n; i++) {
    const v = {
      no: nos[i] || '',
      tag: tags[i] || '',
      slot: slots[i] || '',
      parking: parks[i] || '',
      model: models[i] || '',
    };
    if (v.no || v.tag || v.slot || v.parking || v.model) {
      out.push(v);
    }
  }
  return out;
};
// HR26DW2718 → "HR 26 DW 2718" (Indian registration format), else as-is
export const formatPlate = no => {
  const c = String(no || '')
    .toUpperCase()
    .replace(/[\s-]/g, '');
  const m = c.match(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/);
  return m
    ? [m[1], m[2], m[3], m[4]].filter(Boolean).join(' ')
    : String(no || '').toUpperCase();
};

// ── building blocks ──
const GlassCircle = ({icon, onPress, label}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    activeOpacity={0.8}
    style={styles.glassCircle}>
    <AppIcon name={icon} size={20} color={P.deep} strokeWidth={2} />
  </TouchableOpacity>
);

const Section = ({title, children}) => (
  <View style={styles.section}>
    <HText style={styles.sectionTitle} accessibilityRole="header">
      {title}
    </HText>
    <View style={styles.card}>{children}</View>
  </View>
);

const Row = ({label, value, sub, right, first, onPress, leading}) => {
  const body = (
    <>
      {leading}
      <View style={styles.rowText}>
        <HText style={styles.rowLabel}>{label}</HText>
        <HText style={styles.rowValue} selectable={!onPress}>
          {value || 'Not available'}
        </HText>
        {!!sub && <HText style={styles.rowSub}>{sub}</HText>}
      </View>
      {right}
    </>
  );
  const style = [styles.row, !first && styles.rowDivider];
  return onPress ? (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button">
      {body}
    </TouchableOpacity>
  ) : (
    <View style={style}>{body}</View>
  );
};

const RowButton = ({icon, label, onPress, text}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    activeOpacity={0.8}
    style={[styles.rowBtn, !!text && {paddingHorizontal: 12}]}>
    {text ? (
      <HText style={styles.rowBtnText}>{text}</HText>
    ) : (
      <AppIcon name={icon} size={18} color={P.tealInk} strokeWidth={1.9} />
    )}
  </TouchableOpacity>
);

const Plate = ({no}) => (
  <View style={styles.plate} accessibilityLabel={`Registration ${no}`}>
    <View style={styles.plateStrip}>
      <HText style={styles.plateInd}>IND</HText>
    </View>
    <HText style={styles.plateText} numberOfLines={1}>
      {formatPlate(no)}
    </HText>
  </View>
);

const Spec = ({label, value}) => (
  <View style={styles.spec}>
    <HText style={styles.specLabel}>{label}</HText>
    <HText style={styles.specValue} numberOfLines={2}>
      {value || '—'}
    </HText>
  </View>
);

const VehicleCard = ({v, index, total}) => (
  <View style={[styles.card, styles.vehicle, index > 0 && styles.vehicleGap]}>
    <View style={styles.vehicleTop}>
      <View style={styles.carBadge}>
        <AppIcon
          name="conveyance"
          size={20}
          color={P.tealInk}
          strokeWidth={1.8}
        />
      </View>
      <View style={styles.vehicleTitle}>
        <HText style={styles.vehicleModel} numberOfLines={1}>
          {v.model || 'Vehicle'}
        </HText>
        {total > 1 && (
          <HText style={styles.vehicleIdx}>
            Vehicle {index + 1} of {total}
          </HText>
        )}
      </View>
      {!!v.no && <Plate no={v.no} />}
    </View>
    <View style={styles.specs}>
      <Spec label="Tag no." value={v.tag} />
      <View style={styles.specDivider} />
      <Spec label="Slot no." value={v.slot} />
      <View style={styles.specDivider} />
      <Spec label="Parking" value={v.parking} />
    </View>
  </View>
);

// ── Screen ──
const ColleagueProfile = ({navigation, staffNo}) => {
  const {authContext, AppUserData} = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const usrAccess = AppUserData?.data?.userFlag;
  const canSeeContact = usrAccess != 'Y'; // same rule as before

  const [loader, setLoader] = useState(true);
  const [failed, setFailed] = useState(false);
  const [emp, setEmp] = useState(null);
  const [photo, setPhoto] = useState('');
  const [reporterID, setReporterId] = useState('');
  const [showMobile, setShowMobile] = useState(false);
  const [hero, setHero] = useState({width: 0, height: 0});

  // same request as before
  const employeProfile = useCallback(() => {
    setLoader(true);
    setFailed(false);
    ApiService.PostMethode(
      '/GetEmpSearch',
      {StaffNO: staffNo},
      AppUserData.token,
      authContext,
    )
      .then(result => {
        setLoader(false);
        const rows = result?.Value?.Table;
        if (rows && rows.length > 0) {
          setEmp(rows[0]);
          setPhoto(rows[0].profile_photo);
          setReporterId(dec(rows[0].EMPL_REPORT_EMPL_ID).replace(/\D/g, ''));
        } else {
          setFailed(true);
          Toast.show('No Data Found');
        }
      })
      .catch(error => {
        setLoader(false);
        setFailed(true);
        ApiService.showErrorMessage(error, authContext);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffNo]);

  useEffect(() => {
    employeProfile();
  }, [employeProfile]);

  // light page → dark status bar while focused
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(P.canvas);
      }
      return () => {
        StatusBar.setBarStyle('light-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor(ThemeColor.Teal);
        }
      };
    }, []),
  );

  // ── derived ──
  const name = titleCase(dec(emp?.EMPL_NAME)) || 'Employee';
  const staffId = dec(emp?.EMPL_ID);
  const designation = dec(emp?.EMPL_DESG_CODE);
  const department = dec(emp?.EMPL_DEPT_CODE);
  const division = dec(emp?.EMPL_DIVN_CODE);
  const location = dec(emp?.LOCN_DESC);
  const email = emailOf(dec(emp?.EMPL_EMAIL_ID));
  const mobile = dec(emp?.PHNE_PERS);
  const extension = dec(emp?.PHNE_EXTN);
  const reporterRaw = dec(emp?.EMPL_REPORT_EMPL_ID);
  const reporter = splitReporter(reporterRaw);
  // Top of the reporting line (e.g. MD & CEO) arrives as "(0)" / "0" / blank:
  // only a real staff no. (> 0) can open a profile.
  const reporterName = /^(na|n\/a|null|undefined|none|-|0)?$/i.test(
    reporter.name,
  )
    ? ''
    : reporter.name;
  const canOpenManager = /^\d+$/.test(reporterID) && Number(reporterID) > 0;
  const openManager = () => {
    if (canOpenManager) {
      navigation.push('ReportsToEmpProfile', {reportsID: reporterID});
    }
  };
  // Hero line under the name: Designation · Department · Division
  const subtitle = [designation, department, division]
    .filter(Boolean)
    .join(' · ');
  const vehicles = parseVehicles(emp);
  const firstName =
    name.split(' ').find(w => !/^(Mr|Mrs|Ms|Miss|Dr|Shri|Smt)\.?$/i.test(w)) ||
    name;

  const call = n => n && Linking.openURL(`tel:${n}`).catch(() => {});
  const mail = () =>
    email && Linking.openURL(`mailto:${email}`).catch(() => {});
  const primaryCall = canSeeContact ? mobile || extension : '';

  return (
    <LinearGradient colors={[P.canvas, P.mint]} style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120,
        }}>
        {/* top bar */}
        <View style={styles.topBar}>
          <GlassCircle
            icon="chevronLeft"
            label="Back"
            onPress={() => navigation.goBack()}
          />
        </View>

        {/* hero */}
        <View
          style={styles.hero}
          onLayout={e => {
            const {width, height} = e.nativeEvent.layout;
            if (width !== hero.width || height !== hero.height) {
              setHero({width, height});
            }
          }}>
          <HeaderBackdrop
            width={hero.width}
            height={hero.height}
            idPrefix="colleague"
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
            start={{x: 0, y: 0}}
            end={{x: 0.6, y: 0.6}}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.heroCenter}>
            <View style={styles.avatarRing}>
              {photo ? (
                <Image
                  source={{uri: `${photo}`}}
                  style={styles.avatar}
                  accessibilityLabel={`Photo of ${name}`}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <HText style={styles.avatarInitials}>
                    {emp ? initialsOf(name) : ''}
                  </HText>
                </View>
              )}
            </View>

            {loader && !emp ? (
              <ActivityIndicator
                color={P.amber}
                style={{marginTop: 18, marginBottom: 8}}
              />
            ) : (
              <>
                <HText style={styles.heroName} accessibilityRole="header">
                  {name}
                </HText>
                {!!subtitle && <HText style={styles.heroSub}>{subtitle}</HText>}
                <View style={styles.chips}>
                  {!!staffId && (
                    <View style={styles.chip}>
                      <AppIcon
                        name="employeePass"
                        size={13}
                        color="rgba(255,255,255,0.75)"
                        strokeWidth={2}
                      />
                      <HText style={styles.chipText}>{staffId}</HText>
                    </View>
                  )}
                  {!!location && (
                    <View style={styles.chip}>
                      <AppIcon
                        name="pin"
                        size={13}
                        color="rgba(255,255,255,0.75)"
                        strokeWidth={2}
                      />
                      <HText style={styles.chipText} numberOfLines={1}>
                        {location}
                      </HText>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          {!!emp && canSeeContact && (
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => call(primaryCall)}
                disabled={!primaryCall}
                accessibilityRole="button"
                accessibilityLabel={`Call ${name}`}
                style={[
                  styles.action,
                  styles.actionAmber,
                  !primaryCall && {opacity: 0.5},
                ]}>
                <AppIcon
                  name="phone"
                  size={18}
                  color={P.onAmber}
                  strokeWidth={1.9}
                />
                <HText style={styles.actionAmberText}>Call</HText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={mail}
                disabled={!email}
                accessibilityRole="button"
                accessibilityLabel={`Email ${name}`}
                style={[
                  styles.action,
                  styles.actionGlass,
                  !email && {opacity: 0.5},
                ]}>
                <AppIcon
                  name="mail"
                  size={18}
                  color="#FFFFFF"
                  strokeWidth={1.9}
                />
                <HText style={styles.actionGlassText}>Email</HText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* body */}
        {failed && !emp ? (
          <View style={[styles.card, styles.retryCard]}>
            <HText style={styles.retryText}>
              We couldn't load this profile.
            </HText>
            <TouchableOpacity
              onPress={employeProfile}
              accessibilityRole="button"
              style={styles.retryBtn}>
              <AppIcon
                name="reset"
                size={16}
                color={P.onAmber}
                strokeWidth={2.2}
              />
              <HText style={styles.retryBtnText}>Try again</HText>
            </TouchableOpacity>
          </View>
        ) : emp ? (
          <View style={styles.body}>
            {canSeeContact && (
              <Section title="Contact">
                <Row
                  first
                  label="Work email"
                  value={email}
                  right={
                    !!email && (
                      <RowButton icon="mail" label="Email" onPress={mail} />
                    )
                  }
                />
                <Row
                  label="Official phone"
                  value={extension}
                  right={
                    !!extension && (
                      <RowButton
                        icon="phone"
                        label="Call official phone"
                        onPress={() => call(extension)}
                      />
                    )
                  }
                />
                <Row
                  label="Mobile"
                  value={
                    mobile ? (showMobile ? mobile : maskPhone(mobile)) : ''
                  }
                  onPress={
                    showMobile && mobile ? () => call(mobile) : undefined
                  }
                  right={
                    !!mobile && (
                      <RowButton
                        text={showMobile ? 'Hide' : 'Show'}
                        label={
                          showMobile
                            ? 'Hide mobile number'
                            : 'Show mobile number'
                        }
                        onPress={() => setShowMobile(v => !v)}
                      />
                    )
                  }
                />
                {!!mobile && (
                  <View style={styles.note}>
                    <AppIcon
                      name="vigilance"
                      size={14}
                      color={P.sub}
                      strokeWidth={2}
                    />
                    <HText style={styles.noteText}>
                      {showMobile
                        ? `Tap the number to call ${firstName}.`
                        : `${firstName}'s mobile is hidden until you tap Show.`}
                    </HText>
                  </View>
                )}
              </Section>
            )}

            {canSeeContact && vehicles.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <HText
                    style={styles.sectionTitleInline}
                    accessibilityRole="header">
                    Vehicles
                  </HText>
                  <View style={styles.countChip}>
                    <HText style={styles.countText}>{vehicles.length}</HText>
                  </View>
                </View>
                {vehicles.map((v, i) => (
                  <VehicleCard
                    key={`${v.no}-${i}`}
                    v={v}
                    index={i}
                    total={vehicles.length}
                  />
                ))}
              </View>
            )}

            {!!reporterRaw && (
              <Section title="Manager">
                {canOpenManager || reporterName ? (
                  <Row
                    first
                    label="Reports to"
                    value={
                      reporterName
                        ? titleCase(reporterName)
                        : `Staff no. ${reporterID}`
                    }
                    sub={
                      reporterName && canOpenManager
                        ? `Staff no. ${reporterID}`
                        : ''
                    }
                    leading={
                      <View style={styles.mgrAvatar}>
                        <HText style={styles.mgrInitials}>
                          {reporterName ? initialsOf(reporterName) : '#'}
                        </HText>
                      </View>
                    }
                    right={
                      canOpenManager ? (
                        <AppIcon
                          name="chevronRight"
                          size={18}
                          color={P.sub}
                          strokeWidth={2}
                        />
                      ) : null
                    }
                    onPress={canOpenManager ? openManager : undefined}
                  />
                ) : (
                  // No manager on record — informative, not tappable
                  <Row
                    first
                    label="Reports to"
                    value="No reporting manager on record"
                    leading={
                      <View style={[styles.mgrAvatar, styles.mgrAvatarNone]}>
                        <AppIcon
                          name="people"
                          size={18}
                          color={P.sub}
                          strokeWidth={1.8}
                        />
                      </View>
                    }
                  />
                )}
              </Section>
            )}
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
};

const GLASS = {
  backgroundColor: 'rgba(255,255,255,0.62)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.9)',
};

const styles = StyleSheet.create({
  root: {flex: 1},
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  glassCircle: {
    ...GLASS,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.deep,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 2,
  },

  hero: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    backgroundColor: P.deep,
    borderWidth: 1,
    borderColor: 'rgba(234,244,242,0.10)',
    shadowColor: '#16302A',
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 16},
    elevation: 8,
  },
  heroCenter: {alignItems: 'center'},
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  avatar: {width: '100%', height: '100%'},
  avatarFallback: {
    backgroundColor: '#F6E6C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.6,
    color: P.deep,
  },
  heroName: {
    marginTop: 12,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSub: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 19,
    color: '#E3ECE7',
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
  },
  chip: {
    height: 28,
    maxWidth: 220,
    paddingHorizontal: 12,
    borderRadius: 14,
    margin: 4,
    backgroundColor: 'rgba(234,244,242,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(234,244,242,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.78)',
    marginLeft: 6,
    flexShrink: 1,
  },
  actions: {flexDirection: 'row', marginTop: 20},
  action: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionAmber: {
    backgroundColor: P.amber,
    marginRight: 10,
    shadowColor: P.amber,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 8},
    elevation: 3,
  },
  actionAmberText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.onAmber,
    marginLeft: 8,
  },
  actionGlass: {
    backgroundColor: 'rgba(234,244,242,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(234,244,242,0.28)',
  },
  actionGlassText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  body: {paddingHorizontal: 16, paddingTop: 22},
  section: {marginBottom: 22},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: '#66716D',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    ...GLASS,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#16302A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 1,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
  },
  rowDivider: {borderTopWidth: 1, borderTopColor: '#E4E2DA'},
  rowText: {flex: 1, minWidth: 0, marginRight: 8},
  rowLabel: {fontSize: 12.5, color: '#66716D'},
  rowValue: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    color: '#1C2B27',
    marginTop: 3,
  },
  rowSub: {fontSize: 12.5, color: '#66716D', marginTop: 2},
  rowBtn: {
    ...GLASS,
    height: 44,
    minWidth: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBtnText: {fontSize: 13, fontWeight: '600', color: P.tealInk},
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginTop: -2,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#66716D',
    marginLeft: 8,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitleInline: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: '#66716D',
  },
  countChip: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    marginLeft: 8,
    backgroundColor: P.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {fontSize: 11.5, fontWeight: '700', color: P.tealInk},
  vehicle: {padding: 14},
  vehicleGap: {marginTop: 10},
  vehicleTop: {flexDirection: 'row', alignItems: 'center'},
  carBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: P.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTitle: {flex: 1, minWidth: 0, marginHorizontal: 10},
  vehicleModel: {fontSize: 15.5, fontWeight: '700', color: '#1C2B27'},
  vehicleIdx: {fontSize: 12, color: '#66716D', marginTop: 2},
  // HSRP-style plate: blue IND strip + spaced registration
  plate: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1C2B27',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  plateStrip: {
    width: 16,
    backgroundColor: '#1F4FA3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateInd: {
    fontSize: 6.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  plateText: {
    paddingHorizontal: 8,
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#1C2B27',
  },
  specs: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E2DA',
  },
  spec: {flex: 1, minWidth: 0},
  specDivider: {width: 1, backgroundColor: '#E4E2DA', marginHorizontal: 10},
  specLabel: {fontSize: 11.5, color: '#66716D'},
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    color: '#1C2B27',
    marginTop: 3,
  },
  mgrAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6E6C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mgrAvatarNone: {backgroundColor: P.mint},
  mgrInitials: {fontSize: 13, fontWeight: '600', color: '#1C2B27'},

  retryCard: {
    marginHorizontal: 16,
    marginTop: 22,
    alignItems: 'center',
    paddingVertical: 22,
  },
  retryText: {fontSize: 14, color: P.body},
  retryBtn: {
    marginTop: 12,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: P.amber,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.onAmber,
    marginLeft: 6,
  },
});

export default ColleagueProfile;
