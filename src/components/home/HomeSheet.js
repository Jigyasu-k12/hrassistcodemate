// Bottom sheet used by Home (story, values …). Swipe down or tap the scrim to close.
import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {P, HText, TYPE, RADIUS} from './homeTheme';
import HomeIcon from './HomeIcons';

const HomeSheet = ({
  visible,
  onClose,
  eyebrow,
  title,
  children,
  background = '#F5F5F5',
  header = null, // pinned under the title (e.g. a search field)
  footer = null, // pinned at the bottom (e.g. Save / Reset)
  onHidden, // fires after the close animation — safe point to navigate
  avoidKeyboard = false,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      propagateSwipe
      backdropColor={P.deeper}
      backdropOpacity={0.55}
      useNativeDriverForBackdrop
      onModalHide={onHidden}
      avoidKeyboard={avoidKeyboard}
      style={styles.modal}>
      <View
        style={[
          styles.sheet,
          {backgroundColor: background, paddingBottom: 20 + insets.bottom},
        ]}>
        <View style={styles.handle} />
        <View style={styles.headRow}>
          <View style={{flex: 1}}>
            {!!eyebrow && <HText style={styles.eyebrow}>{eyebrow}</HText>}
            {!!title && (
              <HText style={styles.title} accessibilityRole="header">
                {title}
              </HText>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.close}>
            <HomeIcon name="close" size={18} color={'#01044B'} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        {header}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{paddingBottom: 6}}>
          {children}
        </ScrollView>
        {!!footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {margin: 0, justifyContent: 'flex-end'},
  footer: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(23,28,143,0.1)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  sheet: {
    maxHeight: Dimensions.get('window').height * 0.88,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F5F5F5',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14},
  eyebrow: {...TYPE.eyebrow, color: '#171C8F'},
  title: {...TYPE.sheetTitle, color: '#01044B', marginTop: 4},
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(23,28,143,0.1)',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

export default HomeSheet;
