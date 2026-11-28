// Every destination the user can open from "All menus" or pin to Quick actions.
//
// Rules:
//  • Module entries always target the module's first screen, so a module never
//    re-opens on a stale sub-screen.
//  • Shortcuts use `initial: false`, which keeps the module's home screen
//    underneath — Back behaves exactly as if the user had tapped through.
//  • Nothing here may bypass an access gate. Comp. & Benefits asks for
//    biometrics on its home screen, so its sub-screens (Salary slip, Form-16 …)
//    are intentionally NOT offered as shortcuts.

const sub = (navigator, screen, params) => ({
  route: navigator,
  params: {screen, initial: false, ...(params ? {params} : {})},
});
const root = (navigator, screen, params) => ({
  route: navigator,
  params: {screen, ...(params ? {params} : {})},
});

export const SECTIONS = [
  {id: 'modules', title: 'Modules'},
  {id: 'time', title: 'Time & leave'},
  {id: 'people', title: 'People'},
  {id: 'workplace', title: 'Workplace'},
  {id: 'travel', title: 'Business travel'},
  {id: 'addon', title: 'Add-on services'},
  {id: 'me', title: 'You & the app'},
];

export const CATALOG = [
  // ── Modules (the original Home grid) ──
  {
    id: 'lookup',
    label: 'Employee Lookup',
    icon: 'lookup',
    section: 'modules',
    ...root('EmployeeNavs', 'EmployeLookUp', {screen: 'Employee Directory'}),
  },
  {
    id: 'attendance',
    label: 'Attendance & Admin',
    icon: 'attendance',
    section: 'modules',
    ...root('AttendanceAdminNav', 'AttendanceAdmin'),
  },
  {
    id: 'pay',
    label: 'Comp. & Benefits',
    icon: 'pay',
    section: 'modules',
    ...root('CompensationBenifitsNav', 'CompensationBenifits'),
  },
  {
    id: 'hospital',
    label: 'Hospital & Quick Dials',
    icon: 'hospital',
    section: 'modules',
    ...root('HospitalNavs', 'EmergencyHospital'),
  },
  {
    id: 'gate',
    label: 'Gatepass & Room Booking',
    icon: 'gate',
    section: 'modules',
    restricted: true,
    ...root('GatePassNavigator', 'HomeGate'),
  },
  {
    id: 'canteen',
    label: 'Canteen Menu',
    icon: 'canteen',
    section: 'modules',
    ...sub('CanteeNavigator', 'CanteenMenu'),
  },
  {
    id: 'apps',
    label: 'Other Mobile Apps',
    icon: 'apps',
    section: 'modules',
    route: 'OtherApps',
  },
  {
    id: 'travel',
    label: 'Business Travel',
    icon: 'travel',
    section: 'modules',
    ...root('BusinessNavigator', 'BuisnessTravel'),
  },
  {
    id: 'addon',
    label: 'Add-On Menu',
    icon: 'addon',
    section: 'modules',
    ...root('OtherMobilityNavigator', 'Othermobility'),
  },

  // ── Time & leave (tabs inside Attendance & Admin) ──
  {
    id: 'leave',
    label: 'Leave',
    icon: 'leave',
    section: 'time',
    ...root('AttendanceAdminNav', 'AttendanceAdmin', {screen: 'Leave'}),
  },
  {
    id: 'shift',
    label: 'Shift',
    icon: 'shift',
    section: 'time',
    ...root('AttendanceAdminNav', 'AttendanceAdmin', {screen: 'Shift'}),
  },
  {
    id: 'holidays',
    label: 'Holiday Calendar',
    icon: 'holiday',
    section: 'time',
    ...root('AttendanceAdminNav', 'AttendanceAdmin', {
      screen: 'Holiday Calendar',
    }),
  },

  // ── People ──
  {
    id: 'birthdays',
    label: 'Birthdays',
    icon: 'cake',
    section: 'people',
    restricted: true,
    ...root('EmployeeNavs', 'EmployeLookUp', {screen: 'Birthdays'}),
  },
  // Tabs inside "Hospital & Quick Dials" (the standalone stack screens have no header)
  {
    id: 'quickDials',
    label: 'Emergency Contacts',
    icon: 'phone',
    section: 'people',
    ...root('HospitalNavs', 'EmergencyHospital', {
      screen: 'Emergency Contacts',
    }),
  },
  {
    id: 'hospitals',
    label: 'Empanelled Hospitals',
    icon: 'hospital',
    section: 'people',
    ...root('HospitalNavs', 'EmergencyHospital', {screen: 'Hospital'}),
  },
  {
    id: 'nearbyHospital',
    label: 'Near By Hospital',
    icon: 'pin',
    section: 'people',
    ...root('HospitalNavs', 'EmergencyHospital', {screen: 'Near By Hospital'}),
  },

  // ── Workplace ──
  {
    id: 'canteenMenu',
    label: "Today's Canteen Menu",
    icon: 'canteen',
    section: 'workplace',
    ...sub('CanteeNavigator', 'CanteenMenu'),
  },
  {
    id: 'foodCourt',
    label: 'Food Court',
    icon: 'foodCourt',
    section: 'workplace',
    ...sub('CanteeNavigator', 'FoodCount'),
  },
  {
    id: 'gatepassReq',
    label: 'Gatepass Request',
    icon: 'gatepass',
    section: 'workplace',
    restricted: true,
    ...sub('GatePassNavigator', 'HomePageGatepass'),
  },
  {
    id: 'roomBooking',
    label: 'Book a Room',
    icon: 'roomBook',
    section: 'workplace',
    restricted: true,
    ...sub('GatePassNavigator', 'RoomBookingHome'),
  },
  {
    id: 'manageBooking',
    label: 'Manage Bookings',
    icon: 'roomManage',
    section: 'workplace',
    restricted: true,
    ...sub('GatePassNavigator', 'ManageBooking'),
  },

  // ── Business travel ──
  {
    id: 'taxi',
    label: 'Taxi Booking',
    icon: 'taxi',
    section: 'travel',
    ...sub('BusinessNavigator', 'BusinessTravelMain'),
  },
  {
    id: 'shuttle',
    label: 'Shuttle Booking',
    icon: 'shuttle',
    section: 'travel',
    ...sub('BusinessNavigator', 'ShuttleBooking'),
  },
  {
    id: 'gst',
    label: 'MSIL GST Details',
    icon: 'gst',
    section: 'travel',
    ...sub('BusinessNavigator', 'Gst'),
  },

  // ── Add-on services ──
  {
    id: 'uniform',
    label: 'Uniform Management',
    icon: 'uniform',
    section: 'addon',
    ...sub('OtherMobilityNavigator', 'UniformMgmt'),
  },
  {
    id: 'hospitalization',
    label: 'Hospitalization System',
    icon: 'hospital',
    section: 'addon',
    ...sub('OtherMobilityNavigator', 'HospitalizationSystem'),
  },

  // ── You & the app ──
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'bell',
    section: 'me',
    route: 'Notification',
  },
  {
    id: 'whatsNew',
    label: "What's New",
    icon: 'whatsNew',
    section: 'me',
    restricted: true,
    route: 'Whatsnew',
  },
  {
    id: 'profile',
    label: 'My Profile',
    icon: 'profile',
    section: 'me',
    route: 'EditProfile',
  },
];

export const DEFAULT_LAYOUT = {
  version: 1,
  pinned: [
    'lookup',
    'attendance',
    'pay',
    'hospital',
    'gate',
    'canteen',
    'apps',
    'travel',
    'addon',
  ],
  columns: 3, // tiles per row: 3 | 4
  rows: 3, // rows shown on Home: 2 | 3 | 0 (= all)
  canteenLocation: 'Gurgaon',
};

export const CANTEEN_LOCATIONS = [
  {value: 'Gurgaon', label: 'Gurgaon'},
  {value: 'Manesar', label: 'Manesar'},
  {value: 'MPT', label: 'MPT'},
  {value: 'Rohtak', label: 'Rohtak'},
  {value: 'Kharkhoda', label: 'Kharkhoda'},
  {value: 'DE', label: 'DE'},
];

export const COLUMN_OPTIONS = [3, 4];
export const ROW_OPTIONS = [
  {value: 2, label: '2 rows'},
  {value: 3, label: '3 rows'},
  {value: 0, label: 'All'},
];

// Entries this user may see (restricted users don't get gatepass/birthdays/what's new).
export const availableCatalog = restricted =>
  CATALOG.filter(item => !(restricted && item.restricted));

export const byId = id => CATALOG.find(item => item.id === id);

// Sanitise a stored layout against the current catalogue and user rights.
export const normaliseLayout = (raw, restricted) => {
  const allowed = new Set(availableCatalog(restricted).map(i => i.id));
  const base =
    raw && raw.version === DEFAULT_LAYOUT.version ? raw : DEFAULT_LAYOUT;
  const seen = new Set();
  const pinned = (
    Array.isArray(base.pinned) ? base.pinned : DEFAULT_LAYOUT.pinned
  ).filter(id => allowed.has(id) && !seen.has(id) && seen.add(id));
  return {
    version: DEFAULT_LAYOUT.version,
    pinned,
    columns: COLUMN_OPTIONS.includes(base.columns)
      ? base.columns
      : DEFAULT_LAYOUT.columns,
    rows: ROW_OPTIONS.some(o => o.value === base.rows)
      ? base.rows
      : DEFAULT_LAYOUT.rows,
    canteenLocation: CANTEEN_LOCATIONS.some(
      o => o.value === base.canteenLocation,
    )
      ? base.canteenLocation
      : DEFAULT_LAYOUT.canteenLocation,
  };
};
