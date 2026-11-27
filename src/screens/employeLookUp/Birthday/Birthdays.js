// Birthdays — Teal Glow tiles + local search (Birthdays.dc ref).
// Same APIs as before: /GetEmplBirthday (split into Today / Tomorrow) and
// /GetEmpSearch (photo for the detail card). The search bar only filters the
// birthday data already fetched — it makes no API call.
import React, {useState, useContext, useRef, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  AppState,
} from 'react-native';
import Modal from 'react-native-modal';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import * as ApiService from '../../../Utils/Utils';
import AuthContext from '../../../context/AuthContext';
import {HomePalette as P} from '../../../constants/Colors';
import {Decrypt} from '../../../Service/Helper';
import {HText} from '../../../components/home/homeTheme';
import {AppIcon} from '../../../components/icons/AppIcon';

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
const HUES = ['#F6E6C4', '#E3ECE7', '#EAF4F2', '#CFE6E2'];
const hueFor = key => {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return HUES[h % HUES.length];
};
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
const dayLabel = offset => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
const dayKey = () => {
  const d = new Date();
  return `bday_wished_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const WISH_TEXT = 'Wish you a very Happy Birthday!';
const openWish = mobile =>
  Linking.openURL(
    `sms:${mobile}${Platform.OS === 'ios' ? '&' : '?'}body=${WISH_TEXT}`,
  );
const openCall = mobile => Linking.openURL(`tel:${mobile}`);

const toPerson = (item, i) => {
  const id = dec(item['Staff No']);
  return {
    key: `${id}-${i}`,
    raw: item,
    id,
    name: titleCase(dec(item.Name)),
    role: dec(item.Desg),
    dept: dec(item.Dept),
    dirc: dec(item.DIRC_CODE),
    email: dec(item.Email).toLowerCase(),
    mobile: dec(item.MOB_NO),
  };
};

const matches = (p, q) =>
  !q ||
  [p.name, p.role, p.dept, p.dirc, p.id].join(' ').toLowerCase().includes(q);

// ── tile ──
const BirthdayTile = ({person, isToday, wished, onPress, onWish, onCall}) => {
  const press = useRef(new Animated.Value(1)).current;
  const to = v =>
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      speed: 40,
      bounciness: v === 1 ? 6 : 0,
    }).start();
  const sub = [person.role, person.dept].filter(Boolean).join(' · ');
  const when = isToday ? `Today · ${dayLabel(0)}` : `Tomorrow · ${dayLabel(1)}`;
  const Body = isToday ? LinearGradient : View;
  const bodyProps = isToday
    ? {colors: ['#FFFFFF', '#FDF7EA'], start: {x: 0, y: 0}, end: {x: 0.4, y: 1}}
    : {};
  return (
    <Animated.View style={{transform: [{scale: press}]}}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        onPressIn={() => to(0.98)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityLabel={`${person.name}${
          sub ? `, ${sub}` : ''
        }, birthday ${when}. Open details`}>
        <Body
          {...bodyProps}
          style={[styles.tile, isToday ? styles.tileToday : styles.tileSoon]}>
          <View
            style={[
              styles.avatar,
              {backgroundColor: hueFor(person.id || person.name)},
            ]}>
            <HText style={styles.avatarText}>{initialsOf(person.name)}</HText>
            {isToday && (
              <View style={styles.cakeDot}>
                <AppIcon
                  name="cake"
                  size={11}
                  color={P.amberInk}
                  strokeWidth={2}
                />
              </View>
            )}
          </View>

          <View style={styles.tileText}>
            <HText style={styles.name} numberOfLines={1}>
              {person.name || 'Employee'}
            </HText>
            {!!sub && (
              <HText style={styles.sub} numberOfLines={1}>
                {sub}
              </HText>
            )}
          </View>

          {!!person.mobile && (
            <TouchableOpacity
              onPress={onCall}
              accessibilityRole="button"
              accessibilityLabel={`Call ${person.name}`}
              style={styles.callBtn}>
              <AppIcon
                name="phone"
                size={18}
                color={P.tealInk}
                strokeWidth={2}
              />
            </TouchableOpacity>
          )}

          {isToday && !!person.mobile && (
            <TouchableOpacity
              onPress={onWish}
              accessibilityRole="button"
              accessibilityLabel={
                wished
                  ? `Wished ${person.name}. Wish again`
                  : `Wish ${person.name}`
              }
              style={styles.wishWrap}>
              {wished ? (
                <View style={[styles.wishBtn, styles.wishDone]}>
                  <AppIcon
                    name="check"
                    size={14}
                    color={P.tealInk}
                    strokeWidth={2.4}
                  />
                  <HText style={styles.wishDoneText}>Wished</HText>
                </View>
              ) : (
                <LinearGradient
                  colors={[P.teal, P.tealInk]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.wishBtn}>
                  <HText style={styles.wishText}>Wish</HText>
                </LinearGradient>
              )}
            </TouchableOpacity>
          )}
        </Body>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SkeletonTile = () => (
  <View style={[styles.tile, styles.tileSoon, styles.skeleton]}>
    <View style={[styles.avatar, {backgroundColor: P.mint}]} />
    <View style={styles.tileText}>
      <View style={[styles.skelLine, {width: '60%', height: 12}]} />
      <View style={[styles.skelLine, {width: '44%'}]} />
      <View style={[styles.skelLine, {width: '32%'}]} />
    </View>
  </View>
);

const EmptyState = ({title, sub}) => (
  <View style={styles.empty}>
    <View style={styles.emptyArt}>
      <AppIcon name="cake" size={34} color={P.tealInk} strokeWidth={1.7} />
    </View>
    <HText style={styles.emptyTitle}>{title}</HText>
    {!!sub && <HText style={styles.emptySub}>{sub}</HText>}
  </View>
);

// ── screen ──
const Birthdays = () => {
  const {authContext, AppUserData} = useContext(AuthContext);
  const [isModalVisible, setModalVisible] = useState(false);
  const [loader, setLoader] = useState(false);
  const [todayBirthday, setTodayBirthday] = useState([]);
  const [tomorrowBirthday, SetTomorrowBirthday] = useState([]);
  const [modalItem, setModalItem] = useState();
  const [empPhoto, setEmpPhoto] = useState();
  const [refresh, setrefresh] = useState(false);
  const [modalLoader, setmodalLoader] = useState(false);
  const [CurrentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [wished, setWished] = useState({});
  const fade = useRef(new Animated.Value(1)).current;
  const loadedDay = useRef(null); // calendar day the lists belong to
  const isFocusedRef = useRef(false);

  // who was already wished today (per device); older days are cleared
  const loadWished = () => {
    const key = dayKey();
    setWished({});
    AsyncStorage.getItem(key)
      .then(v => v && setWished(JSON.parse(v) || {}))
      .catch(() => {});
    AsyncStorage.getAllKeys()
      .then(keys => {
        const old = keys.filter(k => k.startsWith('bday_wished_') && k !== key);
        return old.length ? AsyncStorage.multiRemove(old) : null;
      })
      .catch(() => {});
  };
  const markWished = id => {
    if (!id) {
      return;
    }
    setWished(prev => {
      const next = {...prev, [id]: true};
      AsyncStorage.setItem(dayKey(), JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const stopLoader = () => {
    setLoader(false);
    setrefresh(false);
    setmodalLoader(false);
  };

  // same request as before
  const PostBirthdayData = (isPull = false) => {
    let apiData = {PFlag: AppUserData?.data?.userId};
    const day = dayKey();
    if (loadedDay.current !== day) {
      // first open, or the date changed since the last load: never show
      // yesterday's names under today's date — clear and show skeletons
      setTodayBirthday([]);
      SetTomorrowBirthday([]);
      loadWished();
      setLoader(true);
    } else if (isPull) {
      setrefresh(true);
    }
    ApiService.PostMethode(
      '/GetEmplBirthday',
      apiData,
      AppUserData.token,
      authContext,
    )
      .then(result => {
        stopLoader();
        loadedDay.current = day;
        const todayData = [];
        const tommorowData = [];
        (Array.isArray(result?.Value) ? result.Value : []).forEach(Element => {
          const when = dec(Element.BIRTHDATE).toUpperCase();
          if (when.includes('TODAY')) {
            todayData.push(Element);
          } else if (when.includes('TOMORROW')) {
            tommorowData.push(Element);
          }
        });
        setTodayBirthday(todayData);
        SetTomorrowBirthday(tommorowData);
      })
      .catch(error => {
        stopLoader();
        ApiService.showErrorMessage(error, authContext);
      });
  };

  // emp Profile Data (photo for the detail card)
  const GetUserDetails = item => {
    setModalItem(item);
    setEmpPhoto('');
    setmodalLoader(true);
    setModalVisible(true);
    ApiService.PostMethode(
      '/GetEmpSearch',
      {StaffNo: Decrypt(item['Staff No'])},
      AppUserData.token,
      authContext,
    )
      .then(result => {
        const response = result?.Value;
        if (response && response.Table) {
          setEmpPhoto(response.Table[0] ? response.Table[0].profile_photo : '');
          setmodalLoader(false);
        } else {
          setmodalLoader(false);
          setModalVisible(false);
          Toast.show('User not found');
        }
      })
      .catch(error => {
        setmodalLoader(false);
        setModalVisible(false);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  // reload every time the screen is opened / returned to
  useFocusEffect(
    React.useCallback(() => {
      isFocusedRef.current = true;
      PostBirthdayData();
      return () => {
        isFocusedRef.current = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // ...and when the app comes back to the foreground on this screen
  // (e.g. left open overnight and resumed the next morning)
  const reloadRef = useRef(PostBirthdayData);
  reloadRef.current = PostBirthdayData;
  useEffect(() => {
    let last = AppState.currentState;
    const sub = AppState.addEventListener('change', next => {
      if (/inactive|background/.test(last) && next === 'active') {
        if (isFocusedRef.current) {
          reloadRef.current();
        }
      }
      last = next;
    });
    return () => (sub && sub.remove ? sub.remove() : null);
  }, []);

  const switchTab = index => {
    if (index === CurrentPage) {
      return;
    }
    setCurrentPage(index);
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  // local search over the fetched lists only
  const q = search.trim().toLowerCase();
  const today = useMemo(() => todayBirthday.map(toPerson), [todayBirthday]);
  const tomorrow = useMemo(
    () => tomorrowBirthday.map(toPerson),
    [tomorrowBirthday],
  );
  const todayShown = today.filter(p => matches(p, q));
  const tomorrowShown = tomorrow.filter(p => matches(p, q));
  const isToday = CurrentPage === 0;
  const shown = isToday ? todayShown : tomorrowShown;
  const otherCount = isToday ? tomorrowShown.length : todayShown.length;

  const wish = p => {
    if (!p.mobile) {
      Toast.show('Mobile number not available');
      return;
    }
    openWish(p.mobile);
    markWished(p.id);
  };
  const call = p => {
    if (!p.mobile) {
      Toast.show('Mobile number not available');
      return;
    }
    openCall(p.mobile);
  };

  const modalPerson = modalItem ? toPerson(modalItem, 0) : null;
  const modalIsToday =
    !!modalItem && dec(modalItem.BIRTHDATE).toUpperCase().includes('TODAY');

  const Tab = ({index, label, count}) => {
    const active = CurrentPage === index;
    return (
      <TouchableOpacity
        onPress={() => switchTab(index)}
        accessibilityRole="tab"
        accessibilityState={{selected: active}}
        accessibilityLabel={`${label}, ${count} birthdays`}
        style={[styles.tab, active && styles.tabActive]}>
        <HText style={[styles.tabText, active && styles.tabTextActive]}>
          {label}
        </HText>
        <View style={[styles.tabCount, active && styles.tabCountActive]}>
          <HText
            style={[styles.tabCountText, active && styles.tabCountTextActive]}>
            {count}
          </HText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={[P.canvas, P.mint]} style={styles.container}>
      {/* search (local filter) */}
      <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
        <AppIcon name="search" size={18} color="#1C2B27" strokeWidth={2} />
        <TextInput
          style={styles.input}
          placeholder="Search name or department"
          placeholderTextColor="#66716D"
          value={search}
          onChangeText={setSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search birthdays by name or department"
        />
        {search !== '' && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            style={styles.clearBtn}>
            <AppIcon name="close" size={14} color="#66716D" strokeWidth={2.4} />
          </TouchableOpacity>
        )}
      </View>

      {/* Today / Tomorrow (unchanged behaviour) */}
      <View style={styles.tabs} accessibilityRole="tablist">
        <Tab index={0} label="Today" count={todayShown.length} />
        <Tab index={1} label="Tomorrow" count={tomorrowShown.length} />
      </View>

      {loader ? (
        <View style={styles.list}>
          <View style={styles.groupRow} />
          {[0, 1, 2, 3].map(k => (
            <View key={k} style={{marginBottom: 10}}>
              <SkeletonTile />
            </View>
          ))}
        </View>
      ) : (
        <Animated.View style={{flex: 1, opacity: fade}}>
          <FlatList
            data={shown}
            keyExtractor={p => p.key}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refresh}
                onRefresh={() => PostBirthdayData(true)}
                tintColor={P.teal}
                colors={[P.teal]}
              />
            }
            contentContainerStyle={[
              styles.list,
              !shown.length && {flexGrow: 1},
            ]}
            ListHeaderComponent={
              shown.length ? (
                <View style={styles.groupRow}>
                  <HText
                    style={[
                      styles.groupLabel,
                      !isToday && styles.groupLabelSoon,
                    ]}>
                    {isToday
                      ? `Today · ${dayLabel(0)}`
                      : `Tomorrow · ${dayLabel(1)}`}
                  </HText>
                  <View style={styles.countPill}>
                    <HText style={styles.countText}>
                      {shown.length}
                      {q ? ' found' : ''}
                    </HText>
                  </View>
                </View>
              ) : null
            }
            ItemSeparatorComponent={() => <View style={{height: 10}} />}
            ListEmptyComponent={
              q ? (
                <EmptyState
                  title="No birthdays match"
                  sub={`Nothing matched “${search.trim()}” ${
                    isToday ? 'today' : 'tomorrow'
                  }.${
                    otherCount
                      ? ` ${otherCount} match${otherCount > 1 ? 'es' : ''} in ${
                          isToday ? 'Tomorrow' : 'Today'
                        }.`
                      : ''
                  }`}
                />
              ) : (
                <EmptyState
                  title={
                    isToday ? 'No birthdays today' : 'No birthdays tomorrow'
                  }
                  sub="Pull down to refresh."
                />
              )
            }
            renderItem={({item}) => (
              <BirthdayTile
                person={item}
                isToday={isToday}
                wished={!!wished[item.id]}
                onPress={() => GetUserDetails(item.raw)}
                onWish={() => wish(item)}
                onCall={() => call(item)}
              />
            )}
          />
        </Animated.View>
      )}

      {/* detail card */}
      <Modal
        backdropOpacity={0.55}
        coverScreen={true}
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
        useNativeDriverForBackdrop>
        <View style={styles.card}>
          <LinearGradient
            colors={modalIsToday ? ['#FDF7EA', '#FFFFFF'] : [P.mint, '#FFFFFF']}
            style={styles.cardTop}
          />
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            style={styles.closeBtn}>
            <AppIcon name="close" size={16} color="#3D4744" strokeWidth={2.4} />
          </TouchableOpacity>

          {modalLoader || !modalPerson ? (
            <View style={styles.cardLoading}>
              <ActivityIndicator color={P.teal} size="large" />
            </View>
          ) : (
            <View style={styles.cardBody}>
              <View
                style={[
                  styles.photoRing,
                  modalIsToday && {borderColor: P.amber},
                ]}>
                {empPhoto ? (
                  <Image source={{uri: empPhoto}} style={styles.photo} />
                ) : (
                  <View
                    style={[
                      styles.photo,
                      styles.photoFallback,
                      {
                        backgroundColor: hueFor(
                          modalPerson.id || modalPerson.name,
                        ),
                      },
                    ]}>
                    <HText style={styles.photoInitials}>
                      {initialsOf(modalPerson.name)}
                    </HText>
                  </View>
                )}
              </View>

              <View
                style={[styles.whenChip, modalIsToday && styles.whenChipToday]}>
                <AppIcon
                  name="cake"
                  size={13}
                  color={modalIsToday ? P.amberInk : P.tealInk}
                  strokeWidth={2}
                />
                <HText
                  style={[
                    styles.whenChipText,
                    modalIsToday && {color: P.amberInk},
                  ]}>
                  {modalIsToday
                    ? `Birthday today · ${dayLabel(0)}`
                    : `Birthday tomorrow · ${dayLabel(1)}`}
                </HText>
              </View>

              <HText style={styles.cardName} numberOfLines={2}>
                {modalPerson.name}
              </HText>
              {!!(modalPerson.role || modalPerson.dept) && (
                <HText style={styles.cardSub} numberOfLines={2}>
                  {[modalPerson.role, modalPerson.dept]
                    .filter(Boolean)
                    .join(' · ')}
                </HText>
              )}
              {!!modalPerson.email && (
                <HText style={styles.cardMail} numberOfLines={1}>
                  {modalPerson.email}
                </HText>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => wish(modalPerson)}
                  accessibilityRole="button"
                  accessibilityLabel={`Send birthday wish to ${modalPerson.name}`}
                  style={[styles.cardBtn, styles.cardBtnPrimary]}>
                  <AppIcon
                    name="mail"
                    size={17}
                    color={P.onAmber}
                    strokeWidth={2}
                  />
                  <HText style={styles.cardBtnPrimaryText}>
                    {wished[modalPerson.id] ? 'Wish again' : 'Send wish'}
                  </HText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => call(modalPerson)}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${modalPerson.name}`}
                  style={[styles.cardBtn, styles.cardBtnGhost]}>
                  <AppIcon
                    name="phone"
                    size={17}
                    color={P.tealInk}
                    strokeWidth={2}
                  />
                  <HText style={styles.cardBtnGhostText}>Call</HText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </LinearGradient>
  );
};

const GLASS = {
  backgroundColor: 'rgba(255,255,255,0.66)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.9)',
};
const SHADOW = {
  shadowColor: '#1D3D36',
  shadowOpacity: 0.1,
  shadowRadius: 14,
  shadowOffset: {width: 0, height: 8},
  elevation: 2,
};

const styles = StyleSheet.create({
  container: {flex: 1, width: '100%'},

  searchBar: {
    ...GLASS,
    ...SHADOW,
    shadowOpacity: 0.14,
    elevation: 3,
    height: 48,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchBarFocused: {
    borderColor: P.teal,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  input: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    fontSize: 15,
    color: '#1C2B27',
    paddingVertical: 0,
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(28,43,39,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(43,131,121,0.08)',
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1D3D36',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  tabText: {fontSize: 13.5, fontWeight: '600', color: P.sub},
  tabTextActive: {color: P.tealInk, fontWeight: '700'},
  tabCount: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginLeft: 6,
    backgroundColor: 'rgba(28,43,39,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountActive: {backgroundColor: P.amber},
  tabCountText: {fontSize: 11, fontWeight: '700', color: '#66716D'},
  tabCountTextActive: {color: P.onAmber},

  list: {paddingHorizontal: 16, paddingTop: 4, paddingBottom: 140},
  groupRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: P.amberDeep || '#C99A55',
  },
  groupLabelSoon: {color: P.tealInk},
  countPill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EAF4F2',
    justifyContent: 'center',
  },
  countText: {fontSize: 11, fontWeight: '700', color: '#66716D'},

  tile: {
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOW,
  },
  tileToday: {borderColor: '#F5D9AE', backgroundColor: '#FFFFFF'},
  tileSoon: {...GLASS},
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D3D36',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    elevation: 1,
  },
  avatarText: {fontSize: 16, fontWeight: '700', color: '#1C2B27'},
  cakeDot: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: P.amberCream || '#FDF1DC',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {flex: 1, minWidth: 0, marginHorizontal: 12},
  name: {fontSize: 15, fontWeight: '700', lineHeight: 20, color: '#1C2B27'},
  sub: {fontSize: 12, color: '#66716D', marginTop: 1},
  when: {fontSize: 12, fontWeight: '600', color: '#66716D', marginTop: 3},
  whenToday: {color: P.amberDeep || '#C99A55'},

  callBtn: {
    ...GLASS,
    width: 44,
    height: 44,
    borderRadius: 12,
    borderColor: '#E3ECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishWrap: {marginLeft: 8},
  wishBtn: {
    height: 44,
    minWidth: 76,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishText: {fontSize: 14, fontWeight: '700', color: '#FFFFFF'},
  wishDone: {backgroundColor: '#E3ECE7'},
  wishDoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F6B62',
    marginLeft: 4,
  },

  skeleton: {elevation: 0, shadowOpacity: 0},
  skelLine: {
    height: 9,
    borderRadius: 5,
    backgroundColor: P.mint,
    marginVertical: 3,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyArt: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3ECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {fontSize: 16, fontWeight: '700', color: '#1C2B27'},
  emptySub: {
    fontSize: 13,
    lineHeight: 19,
    color: '#66716D',
    textAlign: 'center',
    marginTop: 6,
  },

  // detail card
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    minHeight: 360,
  },
  cardTop: {position: 'absolute', top: 0, left: 0, right: 0, height: 120},
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(28,43,39,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLoading: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 36,
    paddingBottom: 22,
  },
  photoRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 3,
    borderColor: P.teal,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  photo: {width: 104, height: 104, borderRadius: 52},
  photoFallback: {alignItems: 'center', justifyContent: 'center'},
  photoInitials: {fontSize: 32, fontWeight: '700', color: '#1C2B27'},
  whenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: P.mint,
  },
  whenChipToday: {backgroundColor: P.amberCream || '#FDF1DC'},
  whenChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.tealInk,
    marginLeft: 6,
  },
  cardName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1C2B27',
    textAlign: 'center',
    marginTop: 10,
  },
  cardSub: {fontSize: 13, color: '#3D4744', textAlign: 'center', marginTop: 4},
  cardMail: {fontSize: 12.5, color: '#66716D', marginTop: 4},
  cardActions: {flexDirection: 'row', marginTop: 20, alignSelf: 'stretch'},
  cardBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBtnPrimary: {backgroundColor: P.amber, marginRight: 10},
  cardBtnPrimaryText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.onAmber,
    marginLeft: 8,
  },
  cardBtnGhost: {
    backgroundColor: P.mint,
    borderWidth: 1,
    borderColor: P.line || '#E3ECE7',
  },
  cardBtnGhostText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.tealInk,
    marginLeft: 8,
  },
});

export default Birthdays;
