// "Manager actions" — the manager Home grid. Same data rules as TouchableM:
//  • /GetEmplShift   → shift 'ZZ' uses the alternate tile order
//  • /GetTaxiCutoff  → 'N' routes Taxi Approval to ManagerTaxiOld
import React, {useCallback, useContext, useRef, useState} from 'react';
import {View, Pressable, StyleSheet, Dimensions} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import moment from 'moment';
import AuthContext from '../../context/AuthContext';
import * as ApiService from '../../Utils/Utils';
import {P, HText, TYPE, RADIUS} from './homeTheme';
import {AppIcon} from '../icons/AppIcon';
import Icon3D from './Icon3D';
import useQuickActionsLayout from './useQuickActionsLayout';

const GAP = 10;
const PAD = 16;

// Tile order exactly as TouchableM (Data / Data1)
const ORDER_DEFAULT = [
  'leave',
  'extra',
  'taxi',
  'attendance',
  'rohtak',
  'hospital',
];
const ORDER_ZZ = ['leave', 'taxi', 'attendance', 'rohtak', 'extra', 'hospital'];

const tileDefs = taxiMenu => ({
  leave: {
    label: 'Leave Approval',
    short: 'Leave',
    icon: 'teamLeave',
    route: 'ManagerLeave',
  },
  extra: {
    label: 'Extra Hours Approval',
    short: 'Extra hours',
    icon: 'extraHours',
    route: 'ExtraHoursApproval',
  },
  taxi: {label: 'Taxi Approval', short: 'Taxi', icon: 'taxi', route: taxiMenu},
  attendance: {
    label: 'Team Attendance',
    short: 'Attendance',
    icon: 'teamAtt',
    route: 'ManagerAttandance',
  },
  rohtak: {
    label: 'Rohtak Gatepass Approval',
    short: 'Rohtak gate',
    icon: 'gatepass',
    route: 'ManagerRHTKGatePass',
  },
  hospital: {
    label: 'Hospital Approval',
    short: 'Hospital',
    icon: 'hospital',
    route: 'HospitalApproval',
  },
});

const ManagerActions = ({navigation}) => {
  const {authContext, AppUserData} = useContext(AuthContext);
  const {layout} = useQuickActionsLayout();
  const columns = layout.columns || 3;
  const compact = columns >= 4;
  const [shiftData, setShiftData] = useState('');
  const [taxiMenu, setTaxiMenu] = useState('ManagerTaxi');
  const [loading, setLoading] = useState(true);
  const pending = useRef(0);
  const done = () => {
    pending.current -= 1;
    if (pending.current <= 0) {
      setLoading(false);
    }
  };

  // same request as TouchableM.GetEmplShift
  const GetEmplShift = () => {
    const today = moment(new Date()).format('DD-MMM-YYYY');
    return ApiService.PostMethode(
      '/GetEmplShift',
      {FromDate: today, ToDate: today, EmplID: AppUserData?.data?.userId},
      AppUserData.token,
      authContext,
    )
      .then(result => setShiftData(result?.Value?.[0]?.SHIFT || ''))
      .catch(error => ApiService.showErrorMessage(error, authContext))
      .finally(done);
  };

  // same request as TouchableM.showTaxiRental
  const showTaxiRental = () =>
    ApiService.PostMethode(
      '/GetTaxiCutoff',
      {UserName: AppUserData?.data?.userNT},
      AppUserData.token,
      authContext,
    )
      .then(result =>
        setTaxiMenu(result.Result == 'N' ? 'ManagerTaxiOld' : 'ManagerTaxi'),
      )
      .catch(error => ApiService.showErrorMessage(error, authContext))
      .finally(done);

  useFocusEffect(
    useCallback(() => {
      pending.current = 2;
      GetEmplShift();
      showTaxiRental();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const tileW = Math.floor(
    (Dimensions.get('window').width - PAD * 2 - GAP * (columns - 1)) / columns,
  );
  const defs = tileDefs(taxiMenu);
  const order = shiftData === 'ZZ' ? ORDER_ZZ : ORDER_DEFAULT;

  return (
    <View>
      <View style={styles.head}>
        <HText style={styles.title} accessibilityRole="header">
          Manager actions
        </HText>
        <View style={styles.subChip}>
          <AppIcon
            name="approve"
            size={13}
            color={'#171C8F'}
            strokeWidth={2.2}
          />
          <HText style={styles.subChipText}>Approvals & team</HText>
        </View>
      </View>

      <View style={styles.grid}>
        {order.map((id, i) => {
          const t = defs[id];
          const style = [
            styles.tile,
            {
              width: tileW,
              minHeight: compact ? 84 : 92,
              marginRight: i % columns === columns - 1 ? 0 : GAP,
            },
          ];
          if (loading) {
            return (
              <View
                key={id}
                style={[style, styles.skeleton]}
                accessibilityLabel="Loading">
                <View
                  style={[
                    styles.skelChip,
                    {width: compact ? 36 : 40, height: compact ? 36 : 40},
                  ]}
                />
                <View style={styles.skelLine} />
                <View style={[styles.skelLine, {width: '45%'}]} />
              </View>
            );
          }
          return (
            <Pressable
              key={id}
              onPress={() => navigation.navigate(t.route)}
              accessibilityRole="button"
              accessibilityLabel={t.label}
              android_ripple={{color: 'rgba(1,4,75,0.45)'}}
              style={({pressed}) => [...style, pressed && styles.tilePressed]}>
              <Icon3D
                name={t.icon}
                size={compact ? 36 : 40}
                iconSize={compact ? 20 : 22}
                color="#171C8F"
              />
              <HText
                style={[styles.label, compact && styles.labelCompact]}
                numberOfLines={2}>
                {t.short || t.label}
              </HText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {...TYPE.title, color: '#01044B'},
  subChip: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  subChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171C8F',
    marginLeft: 5,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  tile: {
    minHeight: 96,
    marginBottom: GAP,
    borderRadius: RADIUS.card,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    overflow: 'hidden',
    shadowColor: '#01044B',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
  },
  tilePressed: {backgroundColor: '#FFFFFF', transform: [{scale: 0.97}]},
  chip: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  label: {...TYPE.label, color: '#01044B', textAlign: 'center'},
  labelCompact: {fontSize: 11, lineHeight: 14},
  skeleton: {borderColor: 'rgba(23,28,143,0.1)', elevation: 0, shadowOpacity: 0},
  skelChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 9,
  },
  skelLine: {
    width: '70%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    marginTop: 4,
  },
});

export default ManagerActions;
