// "All menus" — every destination, grouped and searchable. Tap to open, pin to Home.
import React, {useMemo, useState} from 'react';
import {View, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import HomeSheet from './HomeSheet';
import {P, HText} from './homeTheme';
import {AppIcon, IconBadge} from '../icons/AppIcon';
import {SECTIONS, availableCatalog} from './quickActionsCatalog';

const AllMenusSheet = ({
  visible,
  onClose,
  onHidden,
  restricted,
  pinned,
  onOpen,
  onTogglePin,
  onCustomise,
}) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const items = availableCatalog(restricted).filter(
      i => !q || i.label.toLowerCase().includes(q),
    );
    return SECTIONS.map(s => ({
      ...s,
      items: items.filter(i => i.section === s.id),
    })).filter(g => g.items.length);
  }, [restricted, q]);

  const search = (
    <View style={styles.searchBox}>
      <AppIcon name="search" size={18} color={'rgba(1,4,75,0.62)'} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search menus"
        placeholderTextColor={'rgba(1,4,75,0.62)'}
        style={styles.searchInput}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
        accessibilityLabel="Search menus"
      />
    </View>
  );

  const footer = (
    <TouchableOpacity
      onPress={onCustomise}
      accessibilityRole="button"
      style={styles.customiseBtn}>
      <AppIcon name="sliders" size={18} color={'#01044B'} strokeWidth={2} />
      <HText style={styles.customiseText}>Customise Quick actions</HText>
    </TouchableOpacity>
  );

  return (
    <HomeSheet
      visible={visible}
      onClose={onClose}
      onHidden={() => {
        setQuery('');
        onHidden && onHidden();
      }}
      eyebrow="Everything in HR Assist"
      title="All menus"
      header={search}
      footer={footer}
      avoidKeyboard>
      {!groups.length && (
        <HText style={styles.empty}>No menus match “{query.trim()}”.</HText>
      )}
      {groups.map(g => (
        <View key={g.id} style={styles.group}>
          <HText style={styles.groupTitle} accessibilityRole="header">
            {g.title}
          </HText>
          {g.items.map(item => {
            const isPinned = pinned.includes(item.id);
            return (
              <View key={item.id} style={styles.row}>
                <TouchableOpacity
                  style={styles.rowMain}
                  onPress={() => onOpen(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.label}`}>
                  <IconBadge name={item.icon} size={40} iconSize={20} />
                  <HText style={styles.rowLabel} numberOfLines={2}>
                    {item.label}
                  </HText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onTogglePin(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{selected: isPinned}}
                  accessibilityLabel={
                    isPinned
                      ? `Remove ${item.label} from Home`
                      : `Add ${item.label} to Home`
                  }
                  hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
                  style={[styles.pin, isPinned && styles.pinOn]}>
                  <AppIcon
                    name={isPinned ? 'check' : 'plus'}
                    size={14}
                    color={isPinned ? '#01044B' : '#171C8F'}
                    strokeWidth={2.6}
                  />
                  <HText
                    style={[styles.pinText, isPinned && {color: '#01044B'}]}>
                    {isPinned ? 'On Home' : 'Add'}
                  </HText>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}
    </HomeSheet>
  );
};

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#01044B',
    paddingVertical: 0,
  },
  empty: {textAlign: 'center', color: 'rgba(1,4,75,0.62)', marginVertical: 24},
  group: {marginTop: 10},
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: 'rgba(1,4,75,0.62)',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(23,28,143,0.1)',
  },
  rowMain: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  rowLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#01044B',
  },
  pin: {
    height: 32,
    minWidth: 76,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pinOn: {backgroundColor: '#FCBE62', borderColor: '#FCBE62'},
  pinText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171C8F',
    marginLeft: 4,
  },
  customiseBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customiseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#01044B',
    marginLeft: 8,
  },
});

export default AllMenusSheet;
