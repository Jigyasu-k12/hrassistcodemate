// "Customise" — reorder, hide/add tiles and pick the grid layout. Edits a draft;
// nothing changes on Home until Save.
import React, {useEffect, useMemo, useState} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import HomeSheet from './HomeSheet';
import {P, HText} from './homeTheme';
import {AppIcon, IconBadge} from '../icons/AppIcon';
import {
  SECTIONS,
  COLUMN_OPTIONS,
  ROW_OPTIONS,
  DEFAULT_LAYOUT,
  availableCatalog,
  byId,
  normaliseLayout,
} from './quickActionsCatalog';

const Segmented = ({options, value, onChange, label}) => (
  <View
    style={styles.segment}
    accessibilityRole="radiogroup"
    accessibilityLabel={label}>
    {options.map(o => {
      const on = o.value === value;
      return (
        <TouchableOpacity
          key={String(o.value)}
          onPress={() => onChange(o.value)}
          accessibilityRole="radio"
          accessibilityState={{selected: on}}
          style={[styles.segBtn, on && styles.segBtnOn]}>
          <HText style={[styles.segText, on && styles.segTextOn]}>
            {o.label}
          </HText>
        </TouchableOpacity>
      );
    })}
  </View>
);

const IconBtn = ({icon, label, onPress, disabled, tone = 'default'}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{disabled: !!disabled}}
    hitSlop={{top: 4, bottom: 4, left: 2, right: 2}}
    style={[
      styles.iconBtn,
      tone === 'danger' && styles.iconBtnDanger,
      disabled && {opacity: 0.3},
    ]}>
    <AppIcon
      name={icon}
      size={16}
      color={tone === 'danger' ? '#C2362F' : P.deep}
      strokeWidth={2.2}
    />
  </TouchableOpacity>
);

const CustomiseSheet = ({visible, onClose, layout, restricted, onSave}) => {
  const [draft, setDraft] = useState(layout);

  // Fresh draft each time the sheet opens
  useEffect(() => {
    if (visible) {
      setDraft(layout);
    }
  }, [visible, layout]);

  const limit = draft.rows ? draft.rows * draft.columns : Infinity;
  const pinnedItems = draft.pinned.map(byId).filter(Boolean);

  const hiddenGroups = useMemo(() => {
    const pinnedSet = new Set(draft.pinned);
    const rest = availableCatalog(restricted).filter(i => !pinnedSet.has(i.id));
    return SECTIONS.map(s => ({
      ...s,
      items: rest.filter(i => i.section === s.id),
    })).filter(g => g.items.length);
  }, [draft.pinned, restricted]);

  const setPinned = pinned => setDraft(d => ({...d, pinned}));
  const move = (from, to) => {
    const next = [...draft.pinned];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setPinned(next);
  };
  const remove = id => setPinned(draft.pinned.filter(x => x !== id));
  const add = id => setPinned([...draft.pinned, id]);

  const footer = (
    <View style={styles.footerRow}>
      <TouchableOpacity
        onPress={() => setDraft(normaliseLayout(DEFAULT_LAYOUT, restricted))}
        accessibilityRole="button"
        style={[styles.footBtn, styles.footOutline]}>
        <AppIcon name="reset" size={16} color={P.deep} strokeWidth={2.2} />
        <HText style={styles.footOutlineText}>Reset</HText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onSave(draft)}
        accessibilityRole="button"
        style={[styles.footBtn, styles.footAmber]}>
        <AppIcon name="check" size={16} color={P.onAmber} strokeWidth={2.6} />
        <HText style={styles.footAmberText}>Save</HText>
      </TouchableOpacity>
    </View>
  );

  return (
    <HomeSheet
      visible={visible}
      onClose={onClose}
      eyebrow="Quick actions"
      title="Customise your Home"
      footer={footer}>
      {/* ── Layout ── */}
      <HText style={styles.sectionTitle}>Layout</HText>
      <View style={styles.card}>
        <View style={styles.optRow}>
          <HText style={styles.optLabel}>Tiles per row</HText>
          <Segmented
            label="Tiles per row"
            value={draft.columns}
            onChange={columns => setDraft(d => ({...d, columns}))}
            options={COLUMN_OPTIONS.map(c => ({value: c, label: String(c)}))}
          />
        </View>
        <View style={[styles.optRow, styles.optRowLast]}>
          <HText style={styles.optLabel}>Show on Home</HText>
          <Segmented
            label="Rows shown on Home"
            value={draft.rows}
            onChange={rows => setDraft(d => ({...d, rows}))}
            options={ROW_OPTIONS}
          />
        </View>
      </View>

      {/* ── On your Home (ordered) ── */}
      <View style={styles.titleRow}>
        <HText style={styles.sectionTitle}>On your Home</HText>
        <HText style={styles.count}>{pinnedItems.length}</HText>
      </View>
      <HText style={styles.hint}>
        Top of the list appears first. Tiles beyond the rows you show stay
        reachable from All menus.
      </HText>
      <View style={styles.card}>
        {!pinnedItems.length && (
          <HText style={styles.emptyText}>
            Nothing pinned yet — add menus from the list below.
          </HText>
        )}
        {pinnedItems.map((item, i) => {
          const overflow = i >= limit;
          return (
            <View
              key={item.id}
              style={[
                styles.row,
                i === pinnedItems.length - 1 && styles.rowLast,
              ]}>
              <HText style={styles.rank}>{i + 1}</HText>
              <IconBadge name={item.icon} size={34} iconSize={18} />
              <View style={styles.rowText}>
                <HText style={styles.rowLabel} numberOfLines={1}>
                  {item.label}
                </HText>
                {overflow && (
                  <HText style={styles.overflow}>In All menus</HText>
                )}
              </View>
              <IconBtn
                icon="toTop"
                label={`Move ${item.label} to top`}
                disabled={i === 0}
                onPress={() => move(i, 0)}
              />
              <IconBtn
                icon="arrowUp"
                label={`Move ${item.label} up`}
                disabled={i === 0}
                onPress={() => move(i, i - 1)}
              />
              <IconBtn
                icon="arrowDown"
                label={`Move ${item.label} down`}
                disabled={i === pinnedItems.length - 1}
                onPress={() => move(i, i + 1)}
              />
              <IconBtn
                icon="eyeOff"
                tone="danger"
                label={`Hide ${item.label} from Home`}
                onPress={() => remove(item.id)}
              />
            </View>
          );
        })}
      </View>

      {/* ── Hidden / available ── */}
      {!!hiddenGroups.length && (
        <>
          <HText style={[styles.sectionTitle, {marginTop: 18}]}>
            Hidden from Home
          </HText>
          {hiddenGroups.map(g => (
            <View key={g.id} style={{marginBottom: 10}}>
              <HText style={styles.groupTitle}>{g.title}</HText>
              <View style={styles.card}>
                {g.items.map((item, i) => (
                  <View
                    key={item.id}
                    style={[
                      styles.row,
                      i === g.items.length - 1 && styles.rowLast,
                    ]}>
                    <IconBadge name={item.icon} size={34} iconSize={18} />
                    <HText
                      style={[styles.rowLabel, styles.rowText]}
                      numberOfLines={1}>
                      {item.label}
                    </HText>
                    <TouchableOpacity
                      onPress={() => add(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.label} to Home`}
                      style={styles.addBtn}>
                      <AppIcon
                        name="plus"
                        size={14}
                        color={P.tealInk}
                        strokeWidth={2.6}
                      />
                      <HText style={styles.addText}>Add</HText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </HomeSheet>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.deep,
    marginBottom: 8,
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', marginTop: 18},
  count: {
    marginLeft: 8,
    marginBottom: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '700',
    color: P.tealInk,
    backgroundColor: P.mint,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: P.sub,
    marginTop: -4,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: P.sub,
    marginBottom: 6,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.line,
  },
  optRowLast: {borderBottomWidth: 0},
  optLabel: {fontSize: 14, fontWeight: '600', color: P.deep},
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: P.mint,
  },
  segBtn: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: P.deep,
    shadowOpacity: 0.14,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  segText: {fontSize: 12.5, fontWeight: '600', color: P.sub},
  segTextOn: {color: P.deep, fontWeight: '700'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.line,
  },
  rowLast: {borderBottomWidth: 0},
  rank: {width: 20, fontSize: 12, fontWeight: '700', color: P.sub},
  rowText: {flex: 1, marginLeft: 10, marginRight: 4},
  rowLabel: {fontSize: 14, fontWeight: '600', color: P.deep},
  overflow: {fontSize: 11, fontWeight: '600', color: P.amberInk, marginTop: 1},
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: {borderColor: '#F0C9C6', backgroundColor: '#FFF6F5'},
  emptyText: {
    fontSize: 13,
    color: P.sub,
    textAlign: 'center',
    paddingVertical: 18,
  },
  addBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.lineStrong,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addText: {fontSize: 12, fontWeight: '700', color: P.tealInk, marginLeft: 4},
  footerRow: {flexDirection: 'row'},
  footBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footOutline: {borderWidth: 1, borderColor: P.lineStrong, marginRight: 10},
  footOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.deep,
    marginLeft: 6,
  },
  footAmber: {
    backgroundColor: P.amber,
    shadowColor: P.amberStrong,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  },
  footAmberText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.onAmber,
    marginLeft: 6,
  },
});

export default CustomiseSheet;
