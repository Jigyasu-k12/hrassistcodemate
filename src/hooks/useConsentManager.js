import {useState, useEffect, useCallback, useRef} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ApiService from '../Utils/Utils';
import {Decrypt} from '../Service/Helper';

/**
 * Consent Manager Hook
 *
 * FEATURE FLAG FLOW:
 * 1. Calls GetLOVM API to check if consent feature is enabled (LOVM_VALUE_CODE: Y/N)
 * 2. Only proceeds with consent capture if flag is 'Y'
 * 3. Checks flag periodically (every 5 minutes) in background
 * 4. Caches flag status to AsyncStorage for offline/error scenarios
 *
 * CONSENT CAPTURE FLOW (only if feature flag is 'Y'):
 * 1. Validates user has valid phone number
 * 2. Gets application details and parent purpose IDs
 * 3. Checks if consent already exists and is up to date
 * 4. If needed, fetches consent text and shows modal
 */

const PHONE_WARNING_KEY = 'consent_phone_warning_shown';
const CONSENT_FEATURE_FLAG_KEY = 'consent_feature_flag_status';
const FEATURE_FLAG_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ERROR_LOG_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useConsentManager = (AppUserData, authContext) => {
  const [loading, setLoading] = useState(false);
  const [consentData, setConsentData] = useState(null);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [parentPurposeIds, setParentPurposeIds] = useState([]);
  const [showPhoneAlert, setShowPhoneAlert] = useState(false);
  const [isConsentFeatureEnabled, setIsConsentFeatureEnabled] = useState(false);
  const [isConsentFlowActive, setIsConsentFlowActive] = useState(false);

  // Performance: Cache API responses to avoid redundant calls
  const cachedParentIds = useRef(null);
  const cachedConsentText = useRef(null);

  // Check if consent feature is enabled via GetLOVM API
  const checkConsentFeatureFlag = useCallback(async () => {
    try {
      const token = AppUserData?.token;
      const userId = AppUserData?.data?.userId
        ? String(AppUserData.data.userId).trim()
        : '';

      if (!token || !userId) {
        console.log('ConsentManager: Missing token or userId for feature flag check');
        return false;
      }

      const payload = {
        SystemName: 'HR-ASSIST',
        ReportName: 'DPDP',
        LOVName: 'CONSENT_LIVE',
        LOVCode: '',
        UserName: userId,
      };

      console.log('ConsentManager: Checking feature flag via GetLOVM:', JSON.stringify(payload));

      const result = await ApiService.PostMethode(
        '/GetLOVM',
        payload,
        token,
        authContext,
      );

      if (result?.Value && Array.isArray(result.Value) && result.Value.length > 0) {
        const flagData = result.Value[0];
        const isEnabled = flagData.LOVM_VALUE_CODE === 'Y';

        console.log('ConsentManager: Feature flag status:', flagData.LOVM_VALUE_CODE, '- Enabled:', isEnabled);

        // Cache the result
        try {
          await AsyncStorage.setItem(
            CONSENT_FEATURE_FLAG_KEY,
            JSON.stringify({
              enabled: isEnabled,
              timestamp: Date.now(),
            }),
          );
        } catch (cacheError) {
          console.warn('ConsentManager: Failed to cache feature flag:', cacheError);
        }

        setIsConsentFeatureEnabled(isEnabled);
        return isEnabled;
      } else {
        console.warn('ConsentManager: Invalid feature flag response');
        setIsConsentFeatureEnabled(false);
        return false;
      }
    } catch (error) {
      console.error('ConsentManager: Error checking feature flag:', error);
      // On error, check cached value
      try {
        const cached = await AsyncStorage.getItem(CONSENT_FEATURE_FLAG_KEY);
        if (cached) {
          const {enabled} = JSON.parse(cached);
          console.log('ConsentManager: Using cached feature flag:', enabled);
          setIsConsentFeatureEnabled(enabled);
          return enabled;
        }
      } catch (cacheError) {
        // Ignore cache errors
      }
      setIsConsentFeatureEnabled(false);
      return false;
    }
  }, [AppUserData, authContext]);

  // Check for resolved error logs and return true if any resolved log found
  const checkResolvedErrorLogs = useCallback(async () => {
    try {
      const token = AppUserData?.token;
      const userId = AppUserData?.data?.userId
        ? String(AppUserData.data.userId).trim()
        : '';

      if (!token || !userId) {
        console.log('ConsentManager: Missing token or userId for error log check');
        return false;
      }

      const payload = {
        CreatedBy: userId,
        AppId: '1',
        AppModu: 'DPDP_CONS_FORM',
      };

      console.log('ConsentManager: Checking for resolved error logs...');

      const result = await ApiService.PostMethode(
        '/GetAppStatLog',
        payload,
        token,
        authContext,
      );

      if (result?.Value && Array.isArray(result.Value) && result.Value.length > 0) {
        // Check if any log has been resolved (LOG_RESL_FLAG: "Y")
        const resolvedLog = result.Value.find(log => log.LOG_RESL_FLAG === 'Y');

        if (resolvedLog) {
          console.log('ConsentManager: Found resolved error log');
          console.log('ConsentManager: Log created:', resolvedLog.LOG_CREATED_ON);

          // IMPORTANT: Check if user already has valid consent
          // If they do, the resolved log is outdated - ignore it
          const userPhone = await getPhoneNumber();
          if (userPhone) {
            const phoneWithCountryCode = `91${userPhone}`;

            // Quick check if consent already exists
            const checkPayload = {
              UserIdentifier: phoneWithCountryCode,
            };

            const consentResult = await ApiService.PostMethode(
              '/GetDPDPConsent',
              checkPayload,
              token,
              authContext,
            );

            if (consentResult?.Value) {
              // Safely parse JSON with error handling
              let parsedConsent;
              try {
                parsedConsent = JSON.parse(consentResult.Value);
              } catch (parseError) {
                console.error('ConsentManager: GetDPDPConsent returned invalid JSON in resolved log check');
                console.error('ConsentManager: Parse error:', parseError.message);
                console.error('ConsentManager: Raw response:', consentResult.Value);
                // If parse fails, treat as no consent exists (continue with retrigger)
                parsedConsent = null;
              }

              if (parsedConsent?.error === false && parsedConsent?.data) {
                console.log('ConsentManager: User already has valid consent');
                console.log('ConsentManager: Consent created:', parsedConsent.data.createdAt);
                console.log('ConsentManager: Ignoring resolved log (consent already exists)');
                console.log('ConsentManager: ⚠️  Admin should mark this log as handled in backend');
                return false; // Don't retrigger - user already consented
              }
            }
          }

          // No existing consent found - this resolved log is valid
          console.log('ConsentManager: No existing consent, resolved log is valid');
          console.log('ConsentManager: Will retrigger consent flow');
          return true; // Signal that consent should be retriggered
        } else {
          console.log('ConsentManager: Error logs exist but none are resolved yet');
        }
      } else {
        console.log('ConsentManager: No error logs found for this user');
      }

      return false;
    } catch (error) {
      console.error('ConsentManager: Error checking resolved logs:', error);
      return false;
    }
  }, [AppUserData, authContext, getPhoneNumber]);

  // Validate phone number format (must be 10 digits)
  const isValidPhoneNumber = (phone) => {
    if (!phone) return false;
    // Remove any spaces, dashes, or other non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    return digitsOnly.length === 10 && /^\d{10}$/.test(digitsOnly);
  };

  // Get raw phone number (even if invalid) for tracking purposes
  const getRawPhoneNumber = useCallback(() => {
    const data = AppUserData?.data;
    if (!data) return null;

    let phone = null;
    if (data.officialPhone) {
      phone = String(data.officialPhone).trim();
    } else if (data.personalPhone) {
      phone = String(data.personalPhone).trim();
    } else if (data.emplpresentphone) {
      phone = String(data.emplpresentphone).trim();
    }

    return phone || null;
  }, [AppUserData]);

  // Get phone number with fallback priority (validated)
  const getPhoneNumber = useCallback(async () => {
    const data = AppUserData?.data;
    if (!data) return null;

    let phone = null;
    if (data.officialPhone) {
      phone = String(data.officialPhone).trim();
    } else if (data.personalPhone) {
      phone = String(data.personalPhone).trim();
    } else if (data.emplpresentphone) {
      phone = String(data.emplpresentphone).trim();
    }

    // If no phone found in context, try fetching from backend
    if (!phone) {
      console.log('ConsentManager: ⚠️  No phone number found in context, attempting to fetch from GetEmployeeProfile...');

      try {
        const token = AppUserData?.token;
        const username = AppUserData?.data?.username;

        if (token && username) {
          const result = await ApiService.PostMethode(
            '/GetEmployeeProfile',
            {UserName: username},
            token,
            authContext,
          );

          if (result?.Value?.Table1 && result.Value.Table1.length > 0) {
            const profileData = result.Value.Table1[0];

            // Try to get phone from any available field
            if (profileData.EXTN) {
              phone = String(Decrypt(profileData.EXTN)).trim();
              console.log('ConsentManager: Fetched officialPhone (EXTN):', phone);
            } else if (profileData.PERSONAL_PHONE) {
              phone = String(Decrypt(profileData.PERSONAL_PHONE)).trim();
              console.log('ConsentManager: Fetched personalPhone:', phone);
            } else if (profileData.PRESENT_PHONE) {
              phone = String(Decrypt(profileData.PRESENT_PHONE)).trim();
              console.log('ConsentManager: Fetched emplpresentphone:', phone);
            }
          }
        }
      } catch (error) {
        console.error('ConsentManager: Error fetching phone from GetEmployeeProfile:', error);
      }
    }

    // Return null if phone doesn't exist or isn't valid format
    if (!phone) {
      console.log('ConsentManager: No phone number found in user data or backend');
      return null;
    }

    // Remove non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    if (!isValidPhoneNumber(phone)) {
      console.log('ConsentManager: ⚠️  Phone number found but INVALID format');
      console.log('ConsentManager: Raw phone:', phone);
      console.log('ConsentManager: Digits only:', digitsOnly);
      console.log('ConsentManager: Digit count:', digitsOnly.length, '(expected: 10)');
      return null;
    }

    console.log('ConsentManager: ✅ Valid phone number found:', digitsOnly);
    return digitsOnly;
  }, [AppUserData, authContext]);

  // Check if phone warning was already shown for the current phone state
  const checkPhoneWarningShown = async (currentPhoneData) => {
    try {
      const stored = await AsyncStorage.getItem(PHONE_WARNING_KEY);

      console.log('ConsentManager: Checking phone warning for:', currentPhoneData);
      console.log('ConsentManager: Stored value:', stored);

      if (!stored) {
        console.log('ConsentManager: No stored warning, will show');
        return false; // Never shown before
      }

      // Parse stored data
      const parsedData = JSON.parse(stored);

      // Handle migration from old format (was just 'true' string)
      // If parsedData is not an object with phone/timestamp, it's old format
      if (typeof parsedData !== 'object' || !parsedData.phone) {
        console.log('ConsentManager: Old storage format detected, migrating...');
        // Old format - clear it and show warning
        await AsyncStorage.removeItem(PHONE_WARNING_KEY);
        return false; // Show warning
      }

      const {phone, timestamp} = parsedData;

      console.log('ConsentManager: Stored phone:', phone);
      console.log('ConsentManager: Current phone:', currentPhoneData);

      // Check if phone data has changed since last warning
      const phoneChanged = phone !== currentPhoneData;

      // Also check if warning is older than 7 days (allow re-showing after a week)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const isExpired = timestamp < sevenDaysAgo;

      console.log('ConsentManager: Phone changed?', phoneChanged);
      console.log('ConsentManager: Warning expired?', isExpired);

      if (phoneChanged || isExpired) {
        console.log('ConsentManager: ✅ Will show warning (phone changed or expired)');
        return false; // Show warning again
      }

      console.log('ConsentManager: ❌ Warning already shown for this phone');
      return true; // Already shown for this exact phone
    } catch (error) {
      console.error('ConsentManager: Error checking phone warning status:', error);
      console.log('ConsentManager: ✅ Will show warning due to error');
      return false; // Show warning if error reading
    }
  };

  // Mark phone warning as shown for the current phone state
  const markPhoneWarningShown = async (currentPhoneData) => {
    try {
      const data = {
        phone: currentPhoneData,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(PHONE_WARNING_KEY, JSON.stringify(data));
      console.log('ConsentManager: Phone warning marked as shown for:', currentPhoneData);
    } catch (error) {
      console.error('Error marking phone warning as shown:', error);
    }
  };

  // Show phone number missing alert (checks if already shown for this phone)
  const showPhoneNumberAlert = async () => {
    console.log('ConsentManager: === showPhoneNumberAlert called ===');

    const rawPhone = getRawPhoneNumber();
    const phoneIdentifier = rawPhone || 'MISSING'; // Use 'MISSING' if no phone at all

    console.log('ConsentManager: Raw phone from data:', rawPhone);
    console.log('ConsentManager: Phone identifier:', phoneIdentifier);

    const alreadyShown = await checkPhoneWarningShown(phoneIdentifier);
    if (alreadyShown) {
      console.log('ConsentManager: ❌ Phone warning already shown, skipping');
      return;
    }

    console.log('ConsentManager: ✅ Showing phone warning modal');
    setShowPhoneAlert(true);
  };

  // Handle phone alert close
  const handlePhoneAlertClose = async () => {
    const rawPhone = getRawPhoneNumber();
    const phoneIdentifier = rawPhone || 'MISSING';

    await markPhoneWarningShown(phoneIdentifier);
    setShowPhoneAlert(false);
  };

  // Step 1: Get parent purpose IDs from GetDPDPAppDet with retry logic
  const getApplicationDetails = async (retryCount = 0) => {
    // Performance: Return cached result if available
    if (cachedParentIds.current && retryCount === 0) {
      console.log('ConsentManager: ⚡ Using cached parent purpose IDs (skipping API call)');
      return cachedParentIds.current;
    }

    const maxRetries = 2;

    try {
      const token = AppUserData?.token;
      const userId = AppUserData?.data?.userId
        ? String(AppUserData.data.userId).trim()
        : '';

      console.log('ConsentManager: Fetching application details, attempt:', retryCount + 1);

      const result = await ApiService.PostMethode(
        '/GetDPDPAppDet',
        {UserIdentifier: userId},
        token,
        authContext,
      );

      if (result?.Value) {
        // Safely parse JSON with error handling
        let parsedData;
        try {
          parsedData = JSON.parse(result.Value);
        } catch (parseError) {
          console.error('❌ CRITICAL: GetDPDPAppDet returned non-JSON response');
          console.error('Parse error:', parseError.message);
          console.error('Raw response (first 500 chars):', String(result.Value).substring(0, 500));

          // This is likely a server error - throw to trigger retry
          const error = new Error(`GetDPDPAppDet returned invalid JSON: ${parseError.message}`);
          error.status = 500; // Treat as server error to trigger retry
          error.rawResponse = result.Value;
          throw error;
        }

        if (parsedData?.error === false && parsedData?.data) {
          const appData = parsedData.data;
          const purposeDetails = appData.purposeDetails || [];

          console.log('================== GetDPDPAppDet Response ==================');
          console.log('Total purposeDetails received:', purposeDetails.length);

          // Log all purposes with their parent relationship
          purposeDetails.forEach((purpose, index) => {
            console.log(`Purpose ${index + 1}:`, {
              uuid: purpose.uuid,
              name: purpose.name,
              parentPurposeId: purpose.parentPurposeId,
              isParent: purpose.parentPurposeId === null,
              childrenCount: purpose.children?.length || 0
            });
          });

          const parentIds = purposeDetails
            .filter(purpose => purpose.parentPurposeId === null)
            .map(purpose => purpose.uuid);

          console.log('========================================================');
          console.log('📌 EXTRACTED PARENT PURPOSE IDs:', parentIds);
          console.log('📌 Total parent purposes found:', parentIds.length);
          console.log('========================================================');

          // Cache for future calls
          cachedParentIds.current = parentIds;
          return parentIds;
        } else {
          console.warn('ConsentManager: Invalid response structure:', parsedData);
          return [];
        }
      } else {
        console.warn('ConsentManager: Empty response from GetDPDPAppDet');
        return [];
      }
    } catch (error) {
      console.error('ConsentManager: Error fetching application details:', error);

      // If 401 (token expired), throw it up to be handled by checkConsentStatus
      if (error?.status === 401 || error?.headers?.authstatus === 'NotAuthorized') {
        console.log('ConsentManager: 401 Unauthorized in GetDPDPAppDet - token expired');
        throw error; // Re-throw to be caught by main flow
      }

      // Retry logic for server errors (500) or network issues (not auth errors)
      if (retryCount < maxRetries && (error?.status === 500 || !error?.status)) {
        console.log(`ConsentManager: Retrying... (${retryCount + 1}/${maxRetries})`);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getApplicationDetails(retryCount + 1);
      }

      console.error('ConsentManager: Failed after retries, returning empty array');
      return [];
    }
  };

  // Step 2: Check if consent already exists with retry logic
  const checkExistingConsent = async (userPhone, parentIds, retryCount = 0) => {
    const maxRetries = 2;

    try {
      const token = AppUserData?.token;
      const userId = AppUserData?.data?.userId
        ? String(AppUserData.data.userId).trim()
        : '';

      // Add country code (91) to match submission format
      const phoneWithCountryCode = `91${userPhone}`;

      const payload = {
        UserIdentifier: phoneWithCountryCode,  // API expects phone with country code
      };

      console.log('ConsentManager: Checking existing consent, attempt:', retryCount + 1);
      console.log('ConsentManager: GetDPDPConsent payload:', payload);

      const result = await ApiService.PostMethode(
        '/GetDPDPConsent',
        payload,
        token,
        authContext,
      );

      console.log('ConsentManager: GetDPDPConsent API call completed');
      console.log('ConsentManager: result?.Value exists:', !!result?.Value);

      if (result?.Value) {
        console.log('ConsentManager: Parsing GetDPDPConsent response...');
        console.log('ConsentManager: Raw response (first 200 chars):',
          String(result.Value).substring(0, 200));

        // Check if response is valid JSON
        let parsedData;
        try {
          parsedData = JSON.parse(result.Value);
        } catch (parseError) {
          console.error('❌ CRITICAL: API returned non-JSON response');
          console.error('Parse error:', parseError.message);
          console.error('Raw response:', result.Value);

          // This is likely a server error - throw to trigger retry
          const error = new Error(`GetDPDPConsent returned invalid JSON: ${parseError.message}`);
          error.status = 500; // Treat as server error to trigger retry
          error.rawResponse = result.Value;
          throw error;
        }

        console.log('ConsentManager: Parsed response structure:', {
          error: parsedData?.error,
          hasData: !!parsedData?.data,
          dataKeys: parsedData?.data ? Object.keys(parsedData.data) : []
        });

        if (parsedData?.error === false && parsedData?.data) {
          const existingPurposeIds = parsedData.data.purposeIds || [];

          console.log('');
          console.log('================== GetDPDPConsent Response ==================');
          console.log('Existing consent data:', {
            consentArtifactId: parsedData.data.consentArtifactId,
            phone: parsedData.data.identifiers?.[0]?.value,
            version: parsedData.data.version,
            createdAt: parsedData.data.createdAt,
            updatedAt: parsedData.data.updatedAt
          });
          console.log('📌 EXISTING CONSENT PURPOSE IDs:', existingPurposeIds);
          console.log('📌 Total existing purposes:', existingPurposeIds.length);
          console.log('========================================================');

          console.log('');
          console.log('==================== COMPARISON ====================');
          console.log('🔍 Required parent purposes (from GetDPDPAppDet):');
          parentIds.forEach((id, index) => {
            console.log(`   ${index + 1}. ${id}`);
          });

          console.log('');
          console.log('🔍 Existing consent purposes (from GetDPDPConsent):');
          existingPurposeIds.forEach((id, index) => {
            console.log(`   ${index + 1}. ${id}`);
          });

          console.log('');
          console.log('🔍 Checking each required parent purpose:');
          parentIds.forEach((parentId, index) => {
            const exists = existingPurposeIds.includes(parentId);
            console.log(`   ${index + 1}. ${parentId}`);
            console.log(`      → ${exists ? '✅ FOUND' : '❌ MISSING'} in existing consent`);
          });

          // Check if all required parent purposes are in existing consent
          const allParentsConsented = parentIds.every(parentId =>
            existingPurposeIds.includes(parentId),
          );

          console.log('');
          console.log('📊 RESULT:');
          if (allParentsConsented) {
            console.log('   ✅ All required parent purposes found');
            console.log('   ✅ Consent is VALID');
            console.log('   ✅ Modal will NOT show');
            console.log('====================================================');
            return true;
          } else {
            const missingIds = parentIds.filter(id => !existingPurposeIds.includes(id));
            console.log('   ❌ Missing required parent purposes:');
            missingIds.forEach((id, index) => {
              console.log(`      ${index + 1}. ${id}`);
            });
            console.log('   ❌ Consent is INVALID or INCOMPLETE');
            console.log('   ✅ Modal WILL show to collect consent');
            console.log('====================================================');
            return false;
          }
        } else {
          console.log('');
          console.log('⚠️  GetDPDPConsent response structure unexpected');
          console.log('parsedData.error:', parsedData?.error);
          console.log('parsedData.data exists:', !!parsedData?.data);
          console.log('Full parsedData:', JSON.stringify(parsedData, null, 2));
          console.log('❌ Assuming consent does not exist or is invalid');
          console.log('✅ Modal will show to collect consent');
        }
      } else {
        console.log('');
        console.log('⚠️  GetDPDPConsent returned empty or null response');
        console.log('result:', result);
        console.log('result.Value:', result?.Value);
        console.log('❌ No existing consent found');
        console.log('✅ Modal will show to collect consent');
      }

      return false;
    } catch (error) {
      console.log('');
      console.log('❌ ERROR in GetDPDPConsent API call');
      console.error('ConsentManager: Error details:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        response: error?.response
      });
      console.error('Full error:', error);

      // If 401 (token expired), throw it up to be handled by checkConsentStatus
      if (error?.status === 401 || error?.headers?.authstatus === 'NotAuthorized') {
        console.log('ConsentManager: 401 Unauthorized in GetDPDPConsent - token expired');
        throw error; // Re-throw to be caught by main flow
      }

      // Retry logic for server errors (not auth errors)
      if (retryCount < maxRetries && (error?.status === 500 || !error?.status)) {
        console.log(`⚠️  Retrying GetDPDPConsent (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return checkExistingConsent(userPhone, parentIds, retryCount + 1);
      }

      console.log('');
      console.warn('⚠️  Failed to check consent after all retries');
      console.warn('Assuming consent needs to be collected');
      console.log('✅ Modal will show to collect consent');
      return false;
    }
  };

  // Step 3: Get consent text from GetConsMaster with retry logic
  const getConsentText = async (retryCount = 0) => {
    // Performance: Return cached result if available
    if (cachedConsentText.current && retryCount === 0) {
      console.log('ConsentManager: ⚡ Using cached consent text (skipping API call)');
      return cachedConsentText.current;
    }

    const maxRetries = 2;

    try {
      const token = AppUserData?.token;
      const userId = AppUserData?.data?.userId
        ? String(AppUserData.data.userId).trim()
        : '';

      const payload = {
        UserIdentifier: userId,
      };

      console.log('ConsentManager: GetConsMaster payload:', JSON.stringify(payload), 'attempt:', retryCount + 1);

      const result = await ApiService.PostMethode(
        '/GetConsMaster',
        payload,
        token,
        authContext,
      );

      if (result?.Value && Array.isArray(result.Value) && result.Value.length > 0) {
        // Extract both Hindi and English consent text
        const englishConsent = result.Value.find(item =>
          item.CONS_HEADING && item.CONS_HEADING.toLowerCase().includes('english')
        );
        const hindiConsent = result.Value.find(item =>
          item.CONS_HEADING && item.CONS_HEADING.toLowerCase().includes('hindi')
        );

        const consentTexts = {
          english: englishConsent?.CONS_TEXT || '<p>No English consent information available.</p>',
          hindi: hindiConsent?.CONS_TEXT || '<p>हिंदी सहमति जानकारी उपलब्ध नहीं है।</p>',
        };

        console.log('ConsentManager: Consent text loaded successfully');
        console.log('ConsentManager: English consent found:', !!englishConsent);
        console.log('ConsentManager: Hindi consent found:', !!hindiConsent);

        // Cache for future calls
        cachedConsentText.current = consentTexts;
        return consentTexts;
      } else {
        console.warn('ConsentManager: Empty consent text response');
        return {
          english: '<p>No consent information available.</p>',
          hindi: '<p>कोई सहमति जानकारी उपलब्ध नहीं है।</p>',
        };
      }
    } catch (error) {
      console.error('ConsentManager: Error fetching consent text:', error);

      // If 401 (token expired), throw it up to be handled by checkConsentStatus
      if (error?.status === 401 || error?.headers?.authstatus === 'NotAuthorized') {
        console.log('ConsentManager: 401 Unauthorized in GetConsMaster - token expired');
        throw error; // Re-throw to be caught by main flow
      }

      // Retry logic for server errors (not auth errors)
      if (retryCount < maxRetries && (error?.status === 500 || !error?.status)) {
        console.log(`ConsentManager: Retrying consent text fetch... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getConsentText(retryCount + 1);
      }

      console.error('ConsentManager: Failed to load consent text after retries');
      return {
        english: '<p>Unable to load consent information. Please try again later.</p>',
        hindi: '<p>सहमति जानकारी लोड करने में असमर्थ। कृपया बाद में पुनः प्रयास करें।</p>',
      };
    }
  };

  // Fetch emplisdpm flag from GetEmployeeProfile API
  const fetchEmplIsdpmFlag = useCallback(async () => {
    try {
      const token = AppUserData?.token;
      const username = AppUserData?.data?.username;

      if (!token || !username) {
        console.log('ConsentManager: Missing token or username for GetEmployeeProfile');
        return null;
      }

      const payload = {
        UserName: username,
      };

      console.log('ConsentManager: Fetching emplisdpm from GetEmployeeProfile...');

      const result = await ApiService.PostMethode(
        '/GetEmployeeProfile',
        payload,
        token,
        authContext,
      );

      if (result?.Value?.Table1 && result.Value.Table1.length > 0) {
        const emplIsdpmEncrypted = result.Value.Table1[0].EMPL_IS_DPM;

        if (emplIsdpmEncrypted) {
          const emplIsdpm = Decrypt(emplIsdpmEncrypted);

          console.log('ConsentManager: Fetched emplisdpm value:', emplIsdpm);
          return emplIsdpm ? String(emplIsdpm).trim().toUpperCase() : '';
        } else {
          console.warn('ConsentManager: EMPL_IS_DPM field is empty in response');
          return '';
        }
      } else {
        console.warn('ConsentManager: Invalid GetEmployeeProfile response structure');
        return '';
      }
    } catch (error) {
      console.error('ConsentManager: Error fetching emplisdpm from GetEmployeeProfile:', error);
      return '';
    }
  }, [AppUserData, authContext]);

  // Check BDPM_CONSENT_LIVE flag
  const checkBdpmConsentLiveFlag = useCallback(async () => {
    try {
      const token = AppUserData?.token;
      const userId = AppUserData?.data?.userId
        ? String(AppUserData.data.userId).trim()
        : '';

      if (!token || !userId) {
        console.log('ConsentManager: Missing token or userId for BDPM_CONSENT_LIVE check');
        return false;
      }

      const payload = {
        SystemName: 'HR-ASSIST',
        ReportName: 'DPDP',
        LOVName: 'BDPM_CONSENT_LIVE',
        LOVCode: '',
        UserName: userId,
      };

      console.log('ConsentManager: Checking BDPM_CONSENT_LIVE flag:', JSON.stringify(payload));

      const result = await ApiService.PostMethode(
        '/GetLOVM',
        payload,
        token,
        authContext,
      );

      if (result?.Value && Array.isArray(result.Value) && result.Value.length > 0) {
        const flagData = result.Value[0];
        const isEnabled = flagData.LOVM_VALUE_CODE === 'Y';

        console.log('ConsentManager: BDPM_CONSENT_LIVE flag status:', flagData.LOVM_VALUE_CODE, '- Enabled:', isEnabled);
        return isEnabled;
      } else {
        console.warn('ConsentManager: Invalid BDPM_CONSENT_LIVE response');
        return false;
      }
    } catch (error) {
      console.error('ConsentManager: Error checking BDPM_CONSENT_LIVE flag:', error);
      return false;
    }
  }, [AppUserData, authContext]);

  // Check MA_CONSENT_LIVE flag
  const checkMaConsentLiveFlag = useCallback(async () => {
    try {
      const token = AppUserData?.token;
      const userId = AppUserData?.data?.userId
        ? String(AppUserData.data.userId).trim()
        : '';

      if (!token || !userId) {
        console.log('ConsentManager: Missing token or userId for MA_CONSENT_LIVE check');
        return false;
      }

      const payload = {
        SystemName: 'HR-ASSIST',
        ReportName: 'DPDP',
        LOVName: 'MA_CONSENT_LIVE',
        LOVCode: '',
        UserName: userId,
      };

      console.log('ConsentManager: Checking MA_CONSENT_LIVE flag:', JSON.stringify(payload));

      const result = await ApiService.PostMethode(
        '/GetLOVM',
        payload,
        token,
        authContext,
      );

      if (result?.Value && Array.isArray(result.Value) && result.Value.length > 0) {
        const flagData = result.Value[0];
        const isEnabled = flagData.LOVM_VALUE_CODE === 'Y';

        console.log('ConsentManager: MA_CONSENT_LIVE flag status:', flagData.LOVM_VALUE_CODE, '- Enabled:', isEnabled);
        return isEnabled;
      } else {
        console.warn('ConsentManager: Invalid MA_CONSENT_LIVE response');
        return false;
      }
    } catch (error) {
      console.error('ConsentManager: Error checking MA_CONSENT_LIVE flag:', error);
      return false;
    }
  }, [AppUserData, authContext]);

  // Main function to check and prepare consent
  const checkConsentStatus = useCallback(async () => {
    if (!AppUserData?.token) {
      console.log('ConsentManager: No token available');
      return;
    }

    // Prevent duplicate/concurrent consent checks
    if (isConsentFlowActive) {
      console.log('ConsentManager: Consent flow already active, skipping duplicate check');
      return;
    }

    // Guard: Don't trigger if modal is already showing or queued
    if (shouldShowModal || showPhoneAlert) {
      console.log('ConsentManager: Modal already showing/queued, skipping duplicate check');
      return;
    }

    setIsConsentFlowActive(true);
    setLoading(true);

    try {
      // STEP 1: Check if consent feature is enabled via CONSENT_LIVE flag
      console.log('ConsentManager: STEP 1 - Checking CONSENT_LIVE feature flag...');
      const isFeatureEnabled = await checkConsentFeatureFlag();

      if (!isFeatureEnabled) {
        console.log('ConsentManager: ❌ EXIT - CONSENT_LIVE is disabled (flag is N)');
        setLoading(false);
        setIsConsentFlowActive(false);
        return;
      }

      console.log('ConsentManager: ✅ CONSENT_LIVE is enabled (flag is Y)');

      // STEP 2: Check emplisdpm flag
      console.log('ConsentManager: STEP 2 - Checking emplisdpm flag...');
      let emplisdpm = AppUserData?.data?.emplisdpm
        ? String(AppUserData.data.emplisdpm).trim().toUpperCase()
        : '';

      // If emplisdpm is not in context, fetch it from backend
      if (!emplisdpm) {
        console.log('ConsentManager: ⚠️  emplisdpm not found in context, fetching from GetEmployeeProfile...');
        emplisdpm = await fetchEmplIsdpmFlag();

        if (!emplisdpm) {
          console.log('ConsentManager: ⚠️  Failed to fetch emplisdpm, defaulting to empty string');
          emplisdpm = '';
        }
      }

      console.log('ConsentManager: emplisdpm value:', emplisdpm);

      if (emplisdpm === 'Y') {
        console.log('ConsentManager: ✅ emplisdpm is Y - Skipping BDPM and usrAccess checks, proceeding to normal flow');
        // Skip both BDPM and usrAccess checks, go directly to phone validation
      } else {
        // emplisdpm is N or empty
        console.log('ConsentManager: emplisdpm is N - Checking BDPM_CONSENT_LIVE flag...');

        const isBdpmEnabled = await checkBdpmConsentLiveFlag();

        if (!isBdpmEnabled) {
          console.log('ConsentManager: ❌ EXIT - BDPM_CONSENT_LIVE is disabled (flag is N)');
          setLoading(false);
          setIsConsentFlowActive(false);
          return;
        }

        console.log('ConsentManager: ✅ BDPM_CONSENT_LIVE is enabled (flag is Y)');

        // STEP 3: Check usrAccess flag (only reached if BDPM is Y)
        console.log('ConsentManager: STEP 3 - Checking usrAccess flag...');
        const usrAccess = AppUserData?.data?.userFlag
          ? String(AppUserData.data.userFlag).trim().toUpperCase()
          : '';

        console.log('ConsentManager: usrAccess value:', usrAccess);

        if (usrAccess === 'Y') {
          console.log('ConsentManager: usrAccess is Y - Checking MA_CONSENT_LIVE flag...');

          const isMaEnabled = await checkMaConsentLiveFlag();

          if (!isMaEnabled) {
            console.log('ConsentManager: ❌ EXIT - MA_CONSENT_LIVE is disabled (flag is N)');
            setLoading(false);
            setIsConsentFlowActive(false);
            return;
          }

          console.log('ConsentManager: ✅ MA_CONSENT_LIVE is enabled (flag is Y)');
        } else {
          console.log('ConsentManager: ✅ usrAccess is N - Skipping MA_CONSENT_LIVE check');
        }
      }

      console.log('ConsentManager: ✅ All flag checks passed, proceeding with normal consent flow');
      console.log('ConsentManager: STEP 4 - Starting normal consent flow...');

      // Check phone number first
      const userPhone = await getPhoneNumber();

      if (!userPhone) {
        console.log('ConsentManager: No valid phone number available (missing or invalid format)');
        setLoading(false);
        setIsConsentFlowActive(false);
        await showPhoneNumberAlert();
        return;
      }

      console.log('ConsentManager: Phone number found:', userPhone);

      console.log('');
      console.log('⚡ Starting parallel API calls for faster performance...');

      // OPTIMIZATION: Run GetDPDPAppDet and GetConsMaster in PARALLEL
      // GetConsMaster doesn't depend on parent IDs, so we can fetch both simultaneously
      const [parentIds, consentTexts] = await Promise.all([
        getApplicationDetails(),
        getConsentText()
      ]);

      console.log('⚡ Parallel API calls completed');

      if (parentIds.length === 0) {
        console.log('ConsentManager: No parent purpose IDs found');
        setLoading(false);
        setIsConsentFlowActive(false);
        return;
      }

      setParentPurposeIds(parentIds);

      console.log('');
      console.log('🔄 Starting consent validation...');
      console.log('Will now check if user has already given consent for these parent purposes');

      // Check existing consent (sequential - needs parentIds from above)
      const consentUpToDate = await checkExistingConsent(userPhone, parentIds);

      if (consentUpToDate) {
        console.log('ConsentManager: Consent is valid, no action needed');
        setLoading(false);
        setIsConsentFlowActive(false);
        return;
      }

      // Consent text already fetched in parallel above!

      // Set data and show modal
      setConsentData({
        htmlEnglish: consentTexts.english,
        htmlHindi: consentTexts.hindi,
        phone: userPhone,
        parentPurposeIds: parentIds,
      });

      setShouldShowModal(true);
      setLoading(false);
      setIsConsentFlowActive(false);
    } catch (error) {
      console.error('ConsentManager: Error in consent check flow:', error);

      // Handle 401 Unauthorized (expired token) gracefully
      if (error?.status === 401 || error?.headers?.authstatus === 'NotAuthorized') {
        console.log('ConsentManager: ⚠️  Authentication token expired or invalid');
        console.log('ConsentManager: Silently skipping consent check - user can continue using app');
        console.log('ConsentManager: Token will be refreshed through normal auth flow');
        // Don't show error to user - just exit silently
        setLoading(false);
        setIsConsentFlowActive(false);
        return;
      }

      // For other errors, log but don't block the user
      console.error('ConsentManager: Failed to complete consent check, allowing user to continue');
      setLoading(false);
      setIsConsentFlowActive(false);
    }
  }, [AppUserData, authContext, getPhoneNumber, checkConsentFeatureFlag, fetchEmplIsdpmFlag, checkBdpmConsentLiveFlag, checkMaConsentLiveFlag, isConsentFlowActive, shouldShowModal, showPhoneAlert]);

  // Reset consent manager
  const resetConsent = useCallback(() => {
    setConsentData(null);
    setShouldShowModal(false);
    setParentPurposeIds([]);
    setIsConsentFlowActive(false); // Allow future checks after modal is closed
    console.log('ConsentManager: Reset complete, flow can be triggered again');
  }, []);

  // Clear AsyncStorage data for testing purposes
  const clearConsentStorage = async () => {
    try {
      await AsyncStorage.removeItem(PHONE_WARNING_KEY);
      console.log('ConsentManager: AsyncStorage cleared for testing');
      return true;
    } catch (error) {
      console.error('ConsentManager: Error clearing AsyncStorage:', error);
      return false;
    }
  };

  // Periodic background check for feature flag (every 5 minutes)
  useEffect(() => {
    let intervalId = null;

    // Initial check on mount
    if (AppUserData?.token) {
      checkConsentFeatureFlag();

      // Set up periodic checking
      intervalId = setInterval(() => {
        console.log('ConsentManager: Running periodic feature flag check...');
        checkConsentFeatureFlag();
      }, FEATURE_FLAG_CHECK_INTERVAL);
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [AppUserData?.token, checkConsentFeatureFlag]);

  // Periodic background check for resolved error logs (every 5 minutes)
  useEffect(() => {
    let intervalId = null;

    // Only check if feature is enabled and user has token
    if (AppUserData?.token && isConsentFeatureEnabled) {
      // Initial check on mount
      const checkAndRetrigger = async () => {
        // Prevent triggering if flow is already active or modal showing
        if (isConsentFlowActive) {
          console.log('ConsentManager: Flow already active, skipping resolved log check');
          return;
        }

        if (shouldShowModal || showPhoneAlert) {
          console.log('ConsentManager: Modal already showing, skipping resolved log check');
          return;
        }

        const hasResolvedLog = await checkResolvedErrorLogs();
        if (hasResolvedLog) {
          console.log('ConsentManager: Retriggering consent flow due to resolved error log');
          await checkConsentStatus();
        }
      };

      checkAndRetrigger();

      // Set up periodic checking
      intervalId = setInterval(async () => {
        console.log('ConsentManager: Running periodic error log check...');

        // Prevent triggering if flow is already active or modal showing
        if (isConsentFlowActive) {
          console.log('ConsentManager: Flow already active, skipping resolved log check');
          return;
        }

        if (shouldShowModal || showPhoneAlert) {
          console.log('ConsentManager: Modal already showing, skipping resolved log check');
          return;
        }

        const hasResolvedLog = await checkResolvedErrorLogs();
        if (hasResolvedLog) {
          console.log('ConsentManager: Retriggering consent flow due to resolved error log');
          await checkConsentStatus();
        }
      }, ERROR_LOG_CHECK_INTERVAL);
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [AppUserData?.token, isConsentFeatureEnabled, checkResolvedErrorLogs, checkConsentStatus, isConsentFlowActive, shouldShowModal, showPhoneAlert]);

  return {
    loading,
    consentData,
    shouldShowModal,
    parentPurposeIds,
    checkConsentStatus,
    resetConsent,
    setShouldShowModal,
    clearConsentStorage,
    showPhoneAlert,
    handlePhoneAlertClose,
    isConsentFeatureEnabled,
    checkConsentFeatureFlag,
  };
};
