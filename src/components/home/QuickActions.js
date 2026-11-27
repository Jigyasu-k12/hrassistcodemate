// "Quick actions" — the user's own grid of shortcuts, plus All menus and Customise.
import React, {useRef, useState} from 'react';
import {
  View,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {P, HText, TYPE, RADIUS} from './homeTheme';
import {AppIcon} from '../icons/AppIcon';
import {byId} from './quickActionsCatalog';
import useQuickActionsLayout from './useQuickActionsLayout';
import AllMenusSheet from './AllMenusSheet';
import CustomiseSheet from './CustomiseSheet';

const GAP = 10;
const PAD = 16;

const Tile = ({width, columns, icon, label, onPress, accent = false, a11y}) => {
  const compact = columns >= 4;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y || label}
      android_ripple={{color: P.mint, borderless: false}}
      style={({pressed}) => [
        styles.tile,
        {width, minHeight: compact ? 84 : 92},
        accent && styles.tileAccent,
        pressed && styles.tilePressed,
      ]}>
      <View
        style={[
          styles.chip,
          compact && styles.chipCompact,
          accent && {backgroundColor: P.amberCream},
        ]}>
        <AppIcon
          name={icon}
          size={compact ? 20 : 22}
          color={accent ? P.amberInk : P.tealInk}
        />
      </View>
      <HText
        style={[styles.label, compact && styles.labelCompact]}
        numberOfLines={2}>
        {label}
      </HText>
    </Pressable>
  );
};

const HeaderButton = ({icon, label, onPress, primary = false}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    activeOpacity={0.8}
    style={[
      styles.headBtn,
      primary ? styles.headBtnPrimary : styles.headBtnSoft,
    ]}>
    <AppIcon
      name={icon}
      size={15}
      color={primary ? P.onAmber : P.tealInk}
      strokeWidth={2.2}
    />
    <HText
      style={[styles.headBtnText, {color: primary ? P.onAmber : P.tealInk}]}>
      {label}
    </HText>
  </TouchableOpacity>
);

const QuickActions = ({navigation, restricted = false}) => {
  const {layout, ready, save, togglePin} = useQuickActionsLayout(restricted);
  const [menusOpen, setMenusOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  // Work to run once a sheet has fully closed (navigate / open another sheet).
  // iOS can't present a second modal while one is still animating out.
  const afterHide = useRef(null);
  const runAfterHide = () => {
    const job = afterHide.current;
    afterHide.current = null;
    job && job();
  };

  const open = item => navigation.navigate(item.route, item.params);

  const columns = layout.columns;
  const tileW = Math.floor(
    (Dimensions.get('window').width - PAD * 2 - GAP * (columns - 1)) / columns,
  );
  const items = layout.pinned.map(byId).filter(Boolean);
  const limit = layout.rows ? layout.rows * columns : Infinity;
  const overflow = items.length > limit;
  // Keep the last slot for "+N more" when the pinned tiles don't all fit
  const shown = overflow ? items.slice(0, limit - 1) : items;
  const moreCount = items.length - shown.length;
  const cells = [
    ...shown.map(item => ({key: item.id, item})),
    ...(overflow ? [{key: '__more'}] : []),
  ];

  return (
    <View>
      <View style={styles.head}>
        <HText style={styles.title} accessibilityRole="header">
          Quick actions
        </HText>
        <View style={styles.headBtns}>
          <HeaderButton
            icon="grid"
            label="All menus"
            onPress={() => setMenusOpen(true)}
          />
          <HeaderButton
            icon="sliders"
            label="Customise"
            primary
            onPress={() => setCustomOpen(true)}
          />
        </View>
      </View>

      {ready && !items.length ? (
        <View style={styles.emptyCard}>
          <AppIcon name="pinTile" size={26} color={P.tealInk} />
          <HText style={styles.emptyTitle}>Your Quick actions are empty</HText>
          <HText style={styles.emptySub}>
            Pin the menus you use most so they're one tap away.
          </HText>
          <TouchableOpacity
            onPress={() => setCustomOpen(true)}
            accessibilityRole="button"
            style={styles.emptyBtn}>
            <HText style={styles.emptyBtnText}>Customise</HText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.grid}>
          {cells.map((cell, i) => (
            <View
              key={cell.key}
              style={{marginRight: i % columns === columns - 1 ? 0 : GAP}}>
              {cell.item ? (
                <Tile
                  width={tileW}
                  columns={columns}
                  icon={cell.item.icon}
                  label={cell.item.label}
                  onPress={() => open(cell.item)}
                />
              ) : (
                <Tile
                  width={tileW}
                  columns={columns}
                  icon="grid"
                  label={`+${moreCount} more`}
                  a11y={`Show ${moreCount} more menus`}
                  accent
                  onPress={() => setMenusOpen(true)}
                />
              )}
            </View>
          ))}
        </View>
      )}

      <AllMenusSheet
        visible={menusOpen}
        onClose={() => setMenusOpen(false)}
        onHidden={runAfterHide}
        restricted={restricted}
        pinned={layout.pinned}
        onTogglePin={togglePin}
        onOpen={item => {
          afterHide.current = () => open(item);
          setMenusOpen(false);
        }}
        onCustomise={() => {
          afterHide.current = () => setCustomOpen(true);
          setMenusOpen(false);
        }}
      />

      <CustomiseSheet
        visible={customOpen}
        onClose={() => setCustomOpen(false)}
        layout={layout}
        restricted={restricted}
        onSave={draft => {
          save(draft);
          setCustomOpen(false);
        }}
      />
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
  title: {...TYPE.title, color: P.deep, flexShrink: 1, marginRight: 8},
  headBtns: {flexDirection: 'row', alignItems: 'center'},
  headBtn: {
    height: 32,
    paddingHorizontal: 11,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headBtnSoft: {backgroundColor: P.mint},
  headBtnPrimary: {
    backgroundColor: P.amber,
    shadowColor: P.amberStrong,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  headBtnText: {fontSize: 12.5, fontWeight: '700', marginLeft: 5},
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  tile: {
    marginBottom: GAP,
    borderRadius: RADIUS.card,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: P.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    overflow: 'hidden',
    shadowColor: P.deep,
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  tileAccent: {borderColor: P.amberSoft, backgroundColor: '#FFFDF8'},
  tilePressed: {
    backgroundColor: P.canvas,
    borderColor: P.lineStrong,
    transform: [{scale: 0.97}],
  },
  chip: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: P.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  chipCompact: {width: 36, height: 36, borderRadius: 11, marginBottom: 6},
  label: {...TYPE.label, color: P.deep, textAlign: 'center'},
  labelCompact: {fontSize: 11, lineHeight: 14},
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: P.lineStrong,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyTitle: {fontSize: 15, fontWeight: '700', color: P.deep, marginTop: 8},
  emptySub: {fontSize: 13, color: P.sub, textAlign: 'center', marginTop: 4},
  emptyBtn: {
    marginTop: 12,
    height: 40,
    paddingHorizontal: 22,
    borderRadius: 20,
    backgroundColor: P.amber,
    justifyContent: 'center',
  },
  emptyBtnText: {fontSize: 14, fontWeight: '700', color: P.onAmber},
});

export default QuickActions;
