// Colleague profile opened from Employee Lookup (route.params.data = encrypted staff no.)
import React from 'react';
import ColleagueProfile from './ColleagueProfile';
import {Decrypt} from '../../Service/Helper';

const EmployProfile = ({navigation, route}) => (
  <ColleagueProfile
    navigation={navigation}
    staffNo={Decrypt(route.params.data)}
  />
);

export default EmployProfile;
