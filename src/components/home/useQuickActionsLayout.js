// Loads / saves the user's Quick actions layout (per username, on this device).
import {useCallback, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthContext from '../../context/AuthContext';
import {DEFAULT_LAYOUT, normaliseLayout} from './quickActionsCatalog';

const keyFor = user => `home_quick_actions_v1_${user || 'anon'}`;

const useQuickActionsLayout = restricted => {
  const {AppUserData} = useContext(AuthContext);
  const user = AppUserData?.data?.username;
  const [layout, setLayout] = useState(() =>
    normaliseLayout(DEFAULT_LAYOUT, restricted),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(keyFor(user))
      .then(raw => {
        if (!alive) {
          return;
        }
        let parsed = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch (e) {
          parsed = null; // corrupt entry — fall back to defaults
        }
        setLayout(normaliseLayout(parsed || DEFAULT_LAYOUT, restricted));
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [user, restricted]);

  const save = useCallback(
    next => {
      const clean = normaliseLayout(next, restricted);
      setLayout(clean);
      AsyncStorage.setItem(keyFor(user), JSON.stringify(clean)).catch(() => {});
      return clean;
    },
    [user, restricted],
  );

  const reset = useCallback(() => save(DEFAULT_LAYOUT), [save]);

  const togglePin = useCallback(
    id => {
      const pinned = layout.pinned.includes(id)
        ? layout.pinned.filter(x => x !== id)
        : [...layout.pinned, id];
      return save({...layout, pinned});
    },
    [layout, save],
  );

  return {layout, ready, save, reset, togglePin};
};

export default useQuickActionsLayout;
