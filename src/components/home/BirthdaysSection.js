// Birthdays on Home — today + tomorrow from /GetEmplBirthday (same source as the Birthdays screen).
import React, {useContext, useEffect, useRef, useState} from 'react';
import {View, TouchableOpacity, Linking, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AuthContext from '../../context/AuthContext';
import * as ApiService from '../../Utils/Utils';
import {Decrypt} from '../../Service/Helper';
import {P, HText, TYPE} from './homeTheme';
import HomeIcon from './HomeIcons';

const MAX_TODAY = 3;
const MAX_TOMORROW = 2;
const HUES = ['#F6E6C4', '#D6E6E1', '#EAF6F2'];

const safeDecrypt = v => {
  try {
    return v ? String(Decrypt(v) || '') : '';
  } catch (e) {
    return '';
  }
};

const toPerson = (raw, i) => {
  const name = safeDecrypt(raw.Name).trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const initials =
    ((parts[0] || '')[0] || '') + ((parts[parts.length - 1] || '')[0] || '');
  return {
    key: `${safeDecrypt(raw['Staff No']) || name}-${i}`,
    name: name.replace(/\b\w/g, c => c.toUpperCase()),
    dept: [safeDecrypt(raw.Desg), safeDecrypt(raw.Dept)]
      .filter(Boolean)
      .join(' · '),
    email: safeDecrypt(raw.Email).trim(),
    initials: initials.toUpperCase() || '?',
    hue: HUES[i % HUES.length],
  };
};

const wish = p => {
  const subject = encodeURIComponent('Happy Birthday!');
  const body = encodeURIComponent(
    `Hi ${
      p.name.split(' ')[0]
    },\n\nWishing you a very happy birthday and a fantastic year ahead!\n\n`,
  );
  Linking.openURL(`mailto:${p.email}?subject=${subject}&body=${body}`).catch(
    () => {},
  );
};

const PersonRow = ({p, today}) => {
  const content = (
    <>
      <View style={[styles.avatar, {backgroundColor: p.hue}]}>
        <HText style={styles.avatarText}>{p.initials}</HText>
      </View>
      <View style={styles.personText}>
        <HText style={styles.name} numberOfLines={1}>
          {p.name}
        </HText>
        {!!p.dept && (
          <HText style={styles.dept} numberOfLines={1}>
            {p.dept}
          </HText>
        )}
      </View>
      {today && !!p.email && (
        <TouchableOpacity
          onPress={() => wish(p)}
          accessibilityRole="button"
          accessibilityLabel={`Send birthday wishes to ${p.name}`}
          style={styles.wishBtn}>
          <HomeIcon name="mail" size={16} color={P.onAmber} strokeWidth={2} />
          <HText style={styles.wishText}>Wish</HText>
        </TouchableOpacity>
      )}
    </>
  );
  return today ? (
    <LinearGradient
      colors={['#FFFFFF', '#FDF7EA']}
      start={{x: 0, y: 0}}
      end={{x: 0.6, y: 1}}
      style={[styles.row, styles.rowToday]}>
      {content}
    </LinearGradient>
  ) : (
    <View style={[styles.row, styles.rowTomorrow]}>{content}</View>
  );
};

const BirthdaysSection = ({navigation, active = true, refreshKey = 0}) => {
  const {authContext, AppUserData} = useContext(AuthContext);
  const [today, setToday] = useState([]);
  const [tomorrow, setTomorrow] = useState([]);
  const alive = useRef(true);

  useEffect(() => () => (alive.current = false), []);

  useEffect(() => {
    if (!active || !AppUserData?.token) {
      return;
    }
    ApiService.PostMethode(
      '/GetEmplBirthday',
      {PFlag: AppUserData?.data?.userId},
      AppUserData.token,
      authContext,
    )
      .then(result => {
        if (!alive.current) {
          return;
        }
        const list = Array.isArray(result?.Value) ? result.Value : [];
        const t = [];
        const n = [];
        list.forEach(item => {
          const when = safeDecrypt(item.BIRTHDATE);
          if (when.includes('TODAY')) {
            t.push(item);
          } else if (when.includes('TOMORROW')) {
            n.push(item);
          }
        });
        setToday(t.map(toPerson));
        setTomorrow(n.map(toPerson));
      })
      .catch(() => {}); // secondary widget — never block Home with an error
    // Re-fetch on focus, pull-to-refresh or a new session only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, refreshKey, AppUserData?.token]);

  if (!today.length && !tomorrow.length) {
    return null;
  }
  const total = today.length + tomorrow.length;
  const shown =
    Math.min(today.length, MAX_TODAY) + Math.min(tomorrow.length, MAX_TOMORROW);

  return (
    <View>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <HomeIcon name="cake" size={20} color={P.amberInk} />
          <HText style={styles.title} accessibilityRole="header">
            Birthdays
          </HText>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('EmployeeNavs', {
              screen: 'EmployeLookUp',
              params: {screen: 'Birthdays'},
            })
          }
          accessibilityRole="button"
          style={styles.seeAll}>
          <HText style={styles.seeAllText}>
            {total > shown ? `See all ${total}` : 'See all'}
          </HText>
          <HomeIcon
            name="chevronRight"
            size={14}
            color={P.tealInk}
            strokeWidth={2.4}
          />
        </TouchableOpacity>
      </View>

      {!!today.length && (
        <View style={styles.group}>
          <HText style={[styles.groupLabel, {color: P.amberInk}]}>
            Today · {today.length}
          </HText>
          {today.slice(0, MAX_TODAY).map(p => (
            <PersonRow key={p.key} p={p} today />
          ))}
        </View>
      )}
      {!!tomorrow.length && (
        <View style={styles.group}>
          <HText style={[styles.groupLabel, {color: P.sub}]}>
            Tomorrow · {tomorrow.length}
          </HText>
          {tomorrow.slice(0, MAX_TOMORROW).map(p => (
            <PersonRow key={p.key} p={p} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {flexDirection: 'row', alignItems: 'center'},
  title: {...TYPE.title, color: P.deep, marginLeft: 8},
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingLeft: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.tealInk,
    marginRight: 2,
  },
  group: {marginBottom: 6},
  groupLabel: {fontSize: 12, fontWeight: '700', marginBottom: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rowToday: {borderColor: P.amberSoft},
  rowTomorrow: {borderColor: P.line, backgroundColor: '#FFFFFF'},
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: P.deep,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
  },
  avatarText: {fontSize: 14, fontWeight: '700', color: P.deep},
  personText: {flex: 1, minWidth: 0, marginHorizontal: 10},
  name: {fontSize: 14, fontWeight: '700', color: P.deep},
  dept: {...TYPE.caption, color: P.sub, marginTop: 1},
  wishBtn: {
    height: 44,
    minWidth: 88,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: P.amber,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.amberStrong,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },
  wishText: {fontSize: 13, fontWeight: '700', color: P.onAmber, marginLeft: 6},
});

export default BirthdaysSection;
