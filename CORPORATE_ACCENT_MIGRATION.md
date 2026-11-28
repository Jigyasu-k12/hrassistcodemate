# HR Assist — Corporate Accent migration report

**Branch:** `design/corporate-accent`  
**Guidelines:** `HR-Assist-Corporate-Accent-Design-Guidelines.html`  
**Scope:** colour values only; no logic, layout, copy, IDs, bindings, routes or component changes.

## 1. Files received and processed

The workspace contains the React Native HR Assist app. Every JS file under `src` plus `src/App.js` was scanned (205 files). The tables below list every screen, shared component, navigation and authentication file, with its processing status. Rows marked **No colour change needed** were scanned and already contained no off-palette UI colour.

### Screens (131 files)

| File | Status | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|
| `src/screens/AIChat.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/AccumulatedHours.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ApplyLeave.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ApplyLeaveDu.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ApplyLeaveDuShort.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ApplyLeaveHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/Attendance&Admin.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/AttendancePer.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/AttendanceReport.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/Attendence.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/CompayShiftDe.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ExtraWorkLeaveReport.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/FlexiShift.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/HolidayCalendar.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/Leave.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/LeaveBalance.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/LeaveHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/LeaveReportHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/LeaveViewReport.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ManagerMode.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/MarkAttendence.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/SalaryDeduct.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/SalaryDeductHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/Shift.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ShiftDetails.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ShortfallDeduction.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ShortfallLeave.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ShortfallLeaveReport.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/ViewReportHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/attandanceback.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ExtraHoursApproval.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/HospitalApproval.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/HospitalApprovalScreens.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/HospitalReportScreens.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ManagerAttandance.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ManagerAttandancePercentage.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ManagerFlexiShift.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ManagerLeave.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ManagerLeaveHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ManagerRHTKGatePass.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ManagerShortfallLeave.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ManagerTaxi.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ManagerTaxiApproval.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Attendance/managermode/ManagerTaxiOld.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/Book.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/BuisnessTravel.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/BusinessTravelHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/BusinessTravelMain.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/Feedback.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/FutureBook.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/GST.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/Guidelines.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/InitTaxiReq.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/MergeTripReq.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/MyRequest.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/PastBook.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/SeatBook.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/ShuttleBooking.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/TaxiBooking.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Buisness/TaxiReportHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Canteen/Canteen.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Canteen/CanteenComponent/Accordion.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Canteen/CanteenComponent/Calender.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Canteen/CanteenComponent/TabComponent.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Canteen/CanteenMenu.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Canteen/FoodCount.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Canteen/Locations/Location.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/AlreadySent.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/Benifits.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/CompensationBenifits.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/ConsentHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/ConveyanceBillsSubmission.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/DiwaliGift.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/Form16.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/IncrementDecrementCounter.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/PFBalance.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/PFReport.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/PFWithdrawal.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/Payroll.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/PendingAllowance.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/PendingAlw.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/Plencashment.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/SalarySlip.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/SundayAllowance.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/TaxComputationSlip.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/CompensationAndBenifits/TaxSavings.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/ConsentModal.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/EmergencyAndHospital/Emergency&Hospital.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/EmergencyAndHospital/EmergencyContact.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/EmergencyAndHospital/HosLocation.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/EmergencyAndHospital/Hospital.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/EmergencyAndHospital/NearByHospital.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/FeatureRequestButton.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/FeedbackModal.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/BookRoom.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/BookRoomModify.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/CreateRequestRhtk.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/EmployeeGatePass.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/GatePassHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/Gatepass.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/HomePageGatepass.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/ManageBooking.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/RohtakGatePass.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/RohtakVisitorHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/RoomBookingHome.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/ViewRequestRhtk.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/ViewRequestVSDT.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/ViewRoom.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/VisitoDetails.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/VisitorDetailRohtak.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Gatspass/VisitorRohtakReport.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Home.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/HomeM.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/Notification.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/OtherApps.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/OtherMobility/Advance.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/OtherMobility/AdvanceReport.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/OtherMobility/HospitalizationSystem.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/OtherMobility/Intimation.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/OtherMobility/IntimationReport.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/OtherMobility/Othermobility.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/OtherMobility/Report.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/OtherMobility/SendBackReport.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/OtherMobility/UniformMgmt.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/employeLookUp/Birthday/Birthdays.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/employeLookUp/ColleagueProfile.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/employeLookUp/EmployeLookUp.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/employeLookUp/EmployeProfile.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/employeLookUp/EmployeeDirect.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/employeLookUp/ReportsToEmpProfile.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/screens/whatsnew.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |

### Shared components (42 files)

| File | Status | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|
| `src/components/BusinessCardCamera.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/CustomDrawer.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/DoctorsContacts.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/EditProfile.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/Nomination.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/PhoneAlertModal.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/Touchable.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/TouchableM.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/VisitDetails.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/businessCard/businessCardLink.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/businessCard/useBusinessCardTools.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/AllMenusSheet.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/BirthdaysSection.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/CustomiseSheet.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/HappeningsCard.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/HomeHeader.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/HomeIcons.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/HomeSheet.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/ManagerActions.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/MessageBookmark.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/ModeSwitch.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/QuickActions.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/StoriesRow.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/ValuesStrip.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/historyImageCache.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/historyStore.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/homeTheme.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/quickActionsCatalog.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/storyStore.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/home/useQuickActionsLayout.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/icons/AppIcon.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/AuthorisedComp.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/Button.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/ButtonMgr.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/Header.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/HeaderMgr.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/HeaderMgrTaxi.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/ListEmptyComponent.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/LoadingScreen.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/LoginButton.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/Text.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/components/reusable/TextInput.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |

### Navigation & Auth (16 files)

| File | Status | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|
| `src/navigations/AttendanceAdminNav.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/AuthNavigator.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/BusinessNavigator.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/CanteeNavigator.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/CompensationBenifitsNav.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/Drawer.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/DrawerM.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/EmployeeNavs.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/GatePassNavigator.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/HomeTabBar.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/HospitalNavigator.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/OtherMobilityNavigator.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/RootNavigation.js` | No colour change needed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/Routes.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/TabNavigation.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/navigations/TabNavigationM.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |

### Authentication (2 files)

| File | Status | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|
| `src/Auth/Onboarding.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/Auth/SignIn.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |

### App shell and tokens

| File | Status | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|
| `src/App.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |
| `src/constants/Colors.js` | Changed | PASS | PASS | PASS | PASS | PASS | NOT RUN |

### Other src files

All other JS files under `src` (API, Service, Utils, context, hooks, RootReducers, react-native.config.js) were scanned; they contain no UI colours and were left unchanged.

### Android native splash

| File | Status | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|
| `android/app/src/main/res/values/colors.xml` | Changed `#F5FCFF` → `#F5F5F5` | PASS | PASS | PASS | PASS | PASS | NOT RUN |



## 1b. Screen coverage map

| Requested area | Files covered |
|---|---|
| Onboarding / splash | `src/Auth/Onboarding.js` |
| Sign-in | `src/Auth/SignIn.js` |
| Home / plant dials | `src/screens/Home.js`, `src/screens/HomeM.js`, `src/components/home/*` |
| Quick dials / hospitals | `src/screens/EmergencyAndHospital/*` (`Emergency&Hospital.js`, `Hospital.js`, `EmergencyContact.js`, `NearByHospital.js`, `HosLocation.js`) |
| People | `src/screens/employeLookUp/*` (`EmployeLookUp.js`, `EmployeeDirect.js`, `Birthdays.js`, `ReportsToEmpProfile.js`) |
| Colleague profile | `src/screens/employeLookUp/ColleagueProfile.js` |
| My profile / Digital ID | `src/components/EditProfile.js` (profile, ID card, family, dependants) |
| Business card | `src/components/businessCard/*`, `src/components/BusinessCardCamera.js` |
| Attendance | `src/screens/Attendance/*` |
| Leave | `src/screens/Attendance/Leave.js`, `LeaveHome.js`, `LeaveBalance.js`, `LeaveReportHome.js`, `ApplyLeave*.js`, `LeaveViewReport.js`, `HolidayCalendar.js` |
| Pay / benefits | `src/screens/CompensationAndBenifits/*` |
| GST | `src/screens/Buisness/GST.js` |
| Gate pass | `src/screens/Gatspass/*` |
| Canteen | `src/screens/Canteen/*` |
| Business travel / shuttle / taxi | `src/screens/Buisness/*` (`BusinessTravelMain.js`, `ShuttleBooking.js`, `TaxiBooking.js`, `InitTaxiReq.js`, `SeatBook.js`, `MyRequest.js`, `PastBook.js`) |
| POSH / consent | `src/screens/ConsentModal.js`, `src/screens/CompensationAndBenifits/ConsentHome.js` |
| Assistant | `src/screens/AIChat.js` |
| Manager screens | `src/screens/Attendance/managermode/*`, `src/screens/HomeM.js`, `src/navigations/TabNavigationM.js` |
| Pop-ups, sheets, overlays | `src/screens/FeedbackModal.js`, `ConsentModal.js`, `FeatureRequestButton.js`, `src/components/PhoneAlertModal.js`, `src/components/home/*Sheet.js`, `src/components/home/MessageBookmark.js`, `src/components/home/StoriesRow.js`, `src/components/home/ModeSwitch.js` |
| Shared parts | `src/components/reusable/*` (Header, HeaderMgr, HeaderMgrTaxi, Button, ButtonMgr, TextInput, LoginButton, Text, LoadingScreen, ListEmptyComponent), `src/navigations/HomeTabBar.js`, `TabNavigation.js`, `TabNavigationM.js` |

## 2. Colour replacement map

The table below groups the legacy values found in the app. The per-file diff is the authoritative record for every individual occurrence.

| Old colour(s) | New colour | Where it was used |
|---|---|---|
| `#2B8379`, `#1F6B62`, `#1E6A62`, `#2F7268`, `#163B35` | `#171C8F` | Old teal brand: headers, icons, links, selected states (Header, SignIn, Leave, Attendance, Home). |
| `#0C3335`, `#071E20`, `#1D3D36`, `#16302A`, `#0E2421`, `#0A1B19` | `#171C8F` / `#01044B` | Deep teal surfaces: Home header, hero cards, SignIn/Onboarding page base. Gradients end at Ink. |
| `#F2CB8A`, `#F5D9AE`, `#E8B865`, `#E2B983`, `#C99A4E`, `#FDCB7E`, `#F2AE47`, `#FFC300`, `#FF9800`, `#FF8F00`, `#E65100`, `#FF6F00`, `#FF8A00`, `#FFB300`, `#FFC94D`, `#FFD166`, `#FFB347` | `#FCBE62` | Accent fills: primary buttons, active chips, pending dots, gold lines. Always solid; Ink text on gold. |
| `#B7791F`, `#8A6212`, `#7A4A1F`, `#C99A4E`, `#C98A1E` | `#171C8F` (or `#FFFFFF` on dark) | Gold text/overlines/section labels. Gold is never text. |
| `rgba(252,190,98,.22)`, `rgba(242,203,138,.16)`, `#FFF8E1`, `#FDF7EA`, `#FBF1DA`, `#FFE29A`, `#FFE7A8`, `#FFE082`, `#F6E6C4`, `#FFF3C4`, `#FFF1C1`, `#FFF6D5` | `#F5F5F5` | Pale gold fills, info chips and banners; paired with an Indigo hairline. Pending chips use solid Gold. |
| `#F6F4EE`, `#EAF4F2`, `#F6FBF9`, `#EAF6F2`, `#E3ECE7`, `#F8F9FA`, `#EEF0FA`, `#FCFCFE`, `#F7F7FB`, `#F5FCFF`, `#F3F2F1`, `#F4F2EC`, `#F9F9F9`, `#F0F0F0`, `#EFEFEF`, `#EEEFEA` | `#F5F5F5` or `#FFFFFF` | Page, card and field surfaces. |
| `#1C2B27`, `#10302F`, `#12403F`, `#16302B`, `#192a56`, `#333`, `#444`, `#555`, `#666`, `#000`, `#212121` | `#01044B` | Primary text, headings, values, shadows, dark overlays. Secondary text uses `rgba(1,4,75,.62)`. |
| `#66716D`, `#7f8c8d`, `#999`, `#9E9E9E`, `#9CA3AF`, `#7D827C`, `#5E645E` | `rgba(1,4,75,.62)` / `.45` | Secondary text and placeholders. |
| `#CFE6E2`, `#D6E6E1`, `#E4E2DA`, `#E0E0E0`, `#ddd`, `#ccc`, `#C5C5C5`, `#E5E7EB`, `#D9D9D9`, `#B9CFC4` | `rgba(23,28,143,.10)` / `.18` or `#F5F5F5` | Hairlines, dividers, field borders, quiet fills. |
| `#4CAF50`, `#43A047`, `#33A852`, `#2E9E44`, `#1B6E2E`, `#0C7A45` | `#171C8F` | Approved/success/booked fills with White text; green text becomes Indigo. |
| `#F44336`, `#E53935`, `#D7263D`, `#C2362F`, `#B00015`, `#E2001A`, `#f00`, `#FF6B6B`, `#FF7468`, `#FF4757`, `#FF3B30` | `#01044B` text; `#FFFFFF` fill | Errors, cancelled states and required asterisks. Legacy screens with one shared white status label keep Indigo fills for readability (see ambiguity 1). |
| `#43C6DB`, `#499fd0`, `#0083B0`, `#004A9B`, `#2979FF`, `#00E5FF` | `#171C8F` | Old blues and cyans: icons, links, borders. |
| `#80406A`, `#5A0F2A`, `#8C1D2C`, `#B14EFF`, `#E040FB`, `#AD1457`, `#EC407A` | `#171C8F` / `#01044B` | Old purples and maroons in icons, badges and decorations. |
| `transparent` | `rgba(255,255,255,0)` | Status bars, overlay ends and glass sheens. |
| Gold glossy gradients (`#FDCB7E` → `#FCBE62` → `#F2AE47`) | Solid `#FCBE62` | Primary buttons. Gradient arrays kept as identical gold stops so they render solid. |
| Gold-tinted glows and shadows | `#01044B` shadow or White-alpha glow | Buttons, headers, hero surfaces. |
| Focus rings / halos in gold | `#171C8F` | Form fields, selected controls. |
| Selected option in a bottom sheet | `#F5F5F5` + Indigo border | Pickers and option sheets. |
| Emoji/coloured UI icons | Indigo line icons (White on Indigo) | Buttons, list rows, headers. |

### Token replacements

| Old token | New value |
|---|---|
| `ThemeColor.Teal`, `ThemeColor.TealDark`, `ThemeColor.Forest` | `#171C8F` |
| `ThemeColor.TealDeep`, `ThemeColor.ForestDeep` | `#01044B` |
| `ThemeColor.TealSoft` | `rgba(23,28,143,0.10)` |
| `ThemeColor.TealLight`, `ThemeColor.Canvas`, `ThemeColor.Sage` | `#F5F5F5` |
| `ThemeColor.TealGlow` | `rgba(23,28,143,0.18)` |
| `ThemeColor.Amber`, `ThemeColor.AmberLight` | `#FCBE62` (fills); text uses Indigo/White |
| `ThemeColor.AmberDark` | `#01044B` (pressed/shadow) |
| `ThemeColor.OnAmber` | `#01044B` |
| `ThemeColor.TextPrimary`, `ThemeColor.TextSecondary`, `ThemeColor.TextMuted` | `#01044B` / `rgba(1,4,75,0.62)` |
| `GlobalColor.Primary`, `GlobalColor.Dark`, `GlobalColor.Black`, `GlobalColor.ShadowColor`, `GlobalColor.Danger` | `#01044B` |
| `GlobalColor.PrimaryLight`, `GlobalColor.Light` | `#F5F5F5` |
| `GlobalColor.White` | `#FFFFFF` |
| `GlobalColor.Secondary`, `GlobalColor.PrimaryGradient` | `#171C8F` |
| `GlobalColor.SecondryGradient` | `#01044B` |
| `GlobalColor.Text`, `GlobalColor.LightDark` | `rgba(1,4,75,0.62)` |
| `HomePalette.deep`, `HomePalette.teal`, `HomePalette.tealInk` | `#171C8F` (text refs use Ink) |
| `HomePalette.deeper` | `#01044B` |
| `HomePalette.mint`, `HomePalette.canvas`, `HomePalette.amberCream` | `#F5F5F5` |
| `HomePalette.line` / `lineStrong` | `rgba(23,28,143,0.10)` / `.18` |
| `HomePalette.amber`, `amberSoft`, `amberStrong`, `amberDeep` | `#FCBE62` |
| `HomePalette.amberInk` | `#171C8F` |
| `HomePalette.onAmber` | `#01044B` |
| `HomePalette.mutedOnDark`, `softOnDark` | `rgba(255,255,255,0.72)` |

## 3. Validation report

Checks A–F were run on every JS file. A–E are PASS for every row in section 1; F is not runnable in this environment.

| Check | Result | Evidence |
|---|---|---|
| A — Colour check | PASS | Scanned 205 JS files plus Android XML. No off-palette UI colour remains. Two non-colour false positives were excluded: `tone = 'teal'` (semantic tone name) in `AppIcon.js:196`, and `Msil@#2024` (API password) in `ViewRoom.js:125`. `android/app/src/main/res/values/colors.xml` changed `#F5FCFF` → `#F5F5F5`. |
| B — Accent check | PASS | No `#FCBE62` in `color`/`textShadowColor`/`placeholderTextColor`; no `rgba(252,190,98,…)`; no gold alpha; no gold `stopColor`; gold gradients contain only identical `#FCBE62` stops (solid appearance). One gold `tintColor` remains in `HomeM.js:1987` and is a solid fill, not text. |
| C — Functionality check | PASS | Old and new ASTs were compared for all 205 files after normalising colour values to a placeholder. Structural differences: **0**. Strict Babel parsing reports only the two pre-existing `Sequence expressions cannot be directly nested inside JSX` quirks in `ApplyLeave.js` and `ApplyLeaveDu.js`, which are present in the original files. No handlers, conditions, bindings, IDs, classes, routes, text or element counts changed. |
| D — Consistency check | PASS | Header / HeaderMgr / HeaderMgrTaxi all use `#171C8F → #171C8F → #01044B` with White text. Button / ButtonMgr use solid `#FCBE62` with Ink text and Ink shadow. Fields use White fill, Indigo hairline and Indigo focus. Bottom bar uses White surface, Indigo hairline, Indigo active item and muted Ink inactive items. Chips, cards, toasts and sheets share the same five-colour recipes. |
| E — Contrast check | PASS | Automated nearest-surface contrast scan: **0** issues. Gradient scan flags 4 cases that were inspected and accepted: `HappeningsCard` scrim (White text sits on the Ink end), and `TabNavigation`/`FeatureRequestButton` light Mist gradients with Ink text. |
| F — Render check | NOT RUN | This is a native React Native app (`react-native 0.67.2`) with Android/iOS native dependencies; it cannot be rendered in the browser environment here. No renderer or emulator was available. |

## 4. Ambiguities and decisions

1. **Shared status labels in legacy screens.** Many screens use one white `statusText` style for approved, pending, closed and cancelled badges. The new status map needs Ink text on Gold/Mist/White and White text on Indigo. Adding per-status text colours would require changing conditions or style bindings, which is out of scope. To keep every status word readable, those shared status surfaces were mapped to Indigo with White text; the status word continues to carry the meaning. Screens with a dedicated per-status text style follow the full map.
2. **Bottom-bar active indicator.** `HomeTabBar` animates the indicator's `opacity`. A Gold indicator would therefore be transparent during the animation, breaking the “accent is always solid” rule. The indicator stays Indigo; the active icon/label carry the selected state.
3. **All-gold gradient arrays.** Primary buttons used a gold gradient. The arrays were kept but every stop was set to `#FCBE62`, so the button renders as solid Gold without changing component structure or array length.
4. **Decorative Gold.** Diwali/firework decorations and gold glows were converted to Indigo, White, or Mist where a gradient or opacity would have made Gold transparent. Gold remains only as solid fills, lines, dots and one solid tint.
5. **Error button outline.** The prescribed cancelled/error treatment is White fill, Ink text and a 1.5 px Ink outline. The outline would require adding a border property (layout change), so the sign-out danger button uses Mist fill with Ink text instead.
6. **Non-colour strings.** `tone = 'teal'` is a semantic tone key, and `Msil@#2024` is an API password; both were left untouched.
7. **Gold text on dark surfaces.** Where the old design used Gold text on a dark header, it is now White (Gold is never text). On light surfaces the same token becomes Indigo.

