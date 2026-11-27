// Business-card share link — identical to buildShareUrl / handleShareBusinessCard
// in useBusinessCardTools (same date format, encryption and URL-safe encoding),
// so the sidebar QR opens exactly the same card as My Profile.
import {Alert} from 'react-native';
import Share from 'react-native-share';
import {encrypyDecrypt} from '../../Service/Helper';
import {BUSINESSCARD_URL} from '../../API/Api';

const MONTHS = [
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
const pad = n => String(n).padStart(2, '0');

// Link is valid for the day it was generated (till 23:59).
export const buildBusinessCardLink = userId => {
  const now = new Date();
  const sysdate = `${pad(now.getDate())}-${
    MONTHS[now.getMonth()]
  }-${now.getFullYear()}`;
  const encryptedId = encrypyDecrypt(`${userId || ''}#${sysdate}`);
  const urlSafe = encryptedId
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/[=]/g, '');
  return {url: `${BUSINESSCARD_URL}${urlSafe}`, sysdate};
};

// Same confirmation + message as the profile's Share button.
export const shareBusinessCardLink = (userId, name) => {
  try {
    const now = new Date();
    const {url, sysdate} = buildBusinessCardLink(userId);
    const sysTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
      now.getSeconds(),
    )}`;
    const generatedOn = `${sysdate} ${sysTime}`;
    const expiryOn = `${sysdate} 23:59:00`;
    Alert.alert(
      'Share Business Card',
      `This link was generated on ${generatedOn} and will be valid till ${expiryOn}.\n\nDo you want to continue?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Share',
          onPress: () => {
            Share.open({
              message: `Hi, I'm ${name}\nHere is my Business Card Link: ${url}\n\n The link is valid till: ${expiryOn}.`,
              title: 'My Business Card',
            }).catch(() => {});
          },
        },
      ],
    );
  } catch (error) {}
};
