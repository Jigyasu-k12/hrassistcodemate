// Colleague profile opened from "Reports to" (route.params.reportsID = plain staff no.)
// Same design as EmployeProfile; each "Reports to" tap opens a new profile on
// top, so Back walks back down the reporting chain.
import React from 'react';
import ColleagueProfile from './ColleagueProfile';

const ReportsToEmpProfile = ({navigation, route}) => (
  <ColleagueProfile navigation={navigation} staffNo={route.params.reportsID} />
);

export default ReportsToEmpProfile;
