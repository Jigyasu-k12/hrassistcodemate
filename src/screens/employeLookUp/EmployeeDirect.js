// Employee Directory — Teal Glow search bar + colleague tiles (employeelookup ref).
// Same API (/GetEmplLookup, {Search, ReportManager}) and same navigation to
// EmployProfile as before; only the presentation changed.
import React, {useState, useContext, useRef} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Keyboard,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import {useNavigation} from '@react-navigation/native';
import * as ApiService from '../../Utils/Utils';
import AuthContext from '../../context/AuthContext';
import {HomePalette as P} from '../../constants/Colors';
import {Decrypt} from '../../Service/Helper';
import {HText} from '../../components/home/homeTheme';
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
// Same person → same soft tone, every time
const HUES = ['#F6E6C4', '#E3ECE7', '#EAF4F2', '#CFE6E2'];
const hueFor = key => {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return HUES[h % HUES.length];
};

// ── tile ──
const ColleagueTile = ({person, onPress}) => {
  const press = useRef(new Animated.Value(1)).current;
  const to = v =>
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      speed: 40,
      bounciness: v === 1 ? 6 : 0,
    }).start();
  const meta = [person.dept, person.id].filter(Boolean).join(' · ');
  return (
    <Animated.View style={{transform: [{scale: press}]}}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={() => to(0.98)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityLabel={`${person.name}${
          person.role ? `, ${person.role}` : ''
        }${meta ? `, ${meta}` : ''}. Open profile`}
        style={styles.tile}>
        <View
          style={[
            styles.avatar,
            {backgroundColor: hueFor(person.id || person.name)},
          ]}>
          <HText style={styles.avatarText}>{initialsOf(person.name)}</HText>
        </View>
        <View style={styles.tileText}>
          <HText style={styles.name} numberOfLines={2}>
            {person.name || 'Employee'}
          </HText>
          {!!person.role && (
            <HText style={styles.role} numberOfLines={1}>
              {person.role}
            </HText>
          )}
          {!!meta && (
            <HText style={styles.meta} numberOfLines={1}>
              {meta}
            </HText>
          )}
        </View>
        <AppIcon
          name="chevronRight"
          size={18}
          color="#66716D"
          strokeWidth={2}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── loading placeholder ──
const SkeletonTile = () => (
  <View style={[styles.tile, styles.skeleton]}>
    <View style={[styles.avatar, {backgroundColor: P.mint}]} />
    <View style={styles.tileText}>
      <View style={[styles.skelLine, {width: '62%', height: 12}]} />
      <View style={[styles.skelLine, {width: '40%'}]} />
      <View style={[styles.skelLine, {width: '52%'}]} />
    </View>
  </View>
);

const EmptyState = ({title, sub}) => (
  <View style={styles.empty}>
    <View style={styles.emptyArt}>
      <AppIcon name="lookup" size={34} color={P.tealInk} strokeWidth={1.7} />
    </View>
    <HText style={styles.emptyTitle}>{title}</HText>
    <HText style={styles.emptySub}>{sub}</HText>
  </View>
);

// ── screen ──
const EmployeeDirect = () => {
  const myNavigation = useNavigation();
  const {authContext, AppUserData} = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [loader, setLoader] = useState(false);
  const [searchedData, setSearchedData] = useState([]);
  const [searched, setSearched] = useState(''); // last query actually run
  const [focused, setFocused] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  // same request as before
  const SearchEmployee = () => {
    const q = search.trim();
    if (q === '') {
      Toast.show('Please enter a valid keyword');
      return;
    }
    Keyboard.dismiss();
    setLoader(true);
    ApiService.PostMethode(
      '/GetEmplLookup',
      {Search: q, ReportManager: ''},
      AppUserData.token,
      authContext,
    )
      .then(result => {
        setLoader(false);
        setSearched(q);
        setSearchedData(Array.isArray(result?.Value) ? result.Value : []);
        fade.setValue(0);
        Animated.timing(fade, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      })
      .catch(error => {
        setLoader(false);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  const clear = () => {
    setSearch('');
    setSearchedData([]);
    setSearched('');
  };

  const people = searchedData.map((item, i) => ({
    key: `${dec(item['Staff No'])}-${i}`,
    raw: item,
    name: titleCase(dec(item.Name)),
    role: dec(item.Desg),
    dept: dec(item.Dept),
    id: dec(item['Staff No']),
  }));

  return (
    <LinearGradient colors={[P.canvas, P.mint]} style={styles.container}>
      {/* search bar */}
      <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
        <AppIcon name="search" size={18} color="#1C2B27" strokeWidth={2} />
        <TextInput
          style={styles.input}
          placeholder="Name, department, ID, mobile or vehicle no."
          placeholderTextColor="#66716D"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={SearchEmployee}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search by name, department, ID, mobile or vehicle number"
        />
        {search !== '' && (
          <TouchableOpacity
            onPress={clear}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 4}}
            style={styles.clearBtn}>
            <AppIcon name="close" size={14} color="#66716D" strokeWidth={2.4} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={SearchEmployee}
          accessibilityRole="button"
          accessibilityLabel="Search"
          disabled={loader}
          style={[styles.goBtn, search.trim() === '' && styles.goBtnIdle]}>
          <AppIcon
            name="arrowRight"
            size={17}
            color={search.trim() === '' ? '#66716D' : P.onAmber}
            strokeWidth={2.4}
          />
        </TouchableOpacity>
      </View>

      {loader ? (
        <View style={styles.list}>
          <View style={styles.countRow} />
          {[0, 1, 2, 3].map(k => (
            <SkeletonTile key={k} />
          ))}
        </View>
      ) : (
        <Animated.View style={{flex: 1, opacity: fade}}>
          <FlatList
            data={people}
            keyExtractor={p => p.key}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.list,
              !people.length && {flexGrow: 1},
            ]}
            ListHeaderComponent={
              people.length ? (
                <View style={styles.countRow}>
                  <HText style={styles.count}>
                    {people.length}{' '}
                    {people.length === 1 ? 'colleague' : 'colleagues'}
                  </HText>
                </View>
              ) : null
            }
            ItemSeparatorComponent={() => <View style={{height: 10}} />}
            ListEmptyComponent={
              searched ? (
                <EmptyState
                  title="No colleagues found"
                  sub={`Nothing matched “${searched}”. Check the spelling, or search by employee ID.`}
                />
              ) : (
                <EmptyState
                  title="Find a colleague"
                  sub="Search by name, department, employee ID, mobile or vehicle number."
                />
              )
            }
            renderItem={({item}) => (
              <ColleagueTile
                person={item}
                onPress={() =>
                  myNavigation.navigate('EmployProfile', {
                    data: item.raw['Staff No'],
                  })
                }
              />
            )}
          />
        </Animated.View>
      )}
    </LinearGradient>
  );
};

const GLASS = {
  backgroundColor: 'rgba(255,255,255,0.66)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.9)',
};

const styles = StyleSheet.create({
  container: {flex: 1, width: '100%'},

  searchBar: {
    ...GLASS,
    height: 50,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 6,
    shadowColor: '#1D3D36',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 3,
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
    marginRight: 6,
  },
  goBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: P.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBtnIdle: {backgroundColor: 'rgba(28,43,39,0.05)'},

  list: {paddingHorizontal: 16, paddingTop: 6, paddingBottom: 140},
  countRow: {height: 34, justifyContent: 'center', paddingHorizontal: 4},
  count: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: '#66716D',
  },

  tile: {
    ...GLASS,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1D3D36',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 16, fontWeight: '700', color: '#1C2B27'},
  tileText: {flex: 1, minWidth: 0, marginHorizontal: 12},
  name: {fontSize: 15, fontWeight: '700', lineHeight: 20, color: '#1C2B27'},
  role: {fontSize: 12.5, color: '#3D4744', marginTop: 2},
  meta: {fontSize: 11.5, color: '#66716D', marginTop: 2},

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
});

export default EmployeeDirect;
