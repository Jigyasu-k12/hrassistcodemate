# English/Hindi Language Toggle Implementation

## Overview
Implemented a language toggle feature for the consent modal that allows users to switch between English and Hindi consent text.

## Backend Integration
The backend API (`GetConsMaster`) now returns **two rows** instead of one:
- One row with `CONS_HEADING` containing "english" for English consent text
- One row with `CONS_HEADING` containing "hindi" for Hindi consent text

## Frontend Changes

### 1. **useConsentManager.js** (Lines 626-700)
Modified the `getConsentText()` function to:
- Parse both English and Hindi rows from API response
- Use `CONS_HEADING` field to identify which language each row represents (uses `.includes()` for flexible matching)
- Return an object: `{ english: "...", hindi: "..." }` instead of a single HTML string
- Cache both language versions for performance
- Provide fallback messages in both languages if API fails

**Key Logic:**
```javascript
result.Value.forEach(item => {
  const heading = item.CONS_HEADING?.toLowerCase().trim();
  const text = item.CONS_TEXT;
  
  // Check if heading CONTAINS "english" or "hindi" (not exact match)
  if (heading.includes('english')) {
    englishConsent = text;
  } else if (heading.includes('hindi')) {
    hindiConsent = text;
  }
});

return { english: englishConsent, hindi: hindiConsent };
```

### 2. **ConsentModal.js** (Complete Implementation)

#### Added State:
- `selectedLanguage` state to track current language ('english' or 'hindi')
- Defaults to 'english' when modal opens
- Resets to 'english' every time modal reopens

#### UI Components Added:

**Language Toggle - Sliding Segmented Control** (After header, before progress bar):
- iOS-style sliding segmented control with animated background
- Two buttons: "English" and "हिंदी" (no icons)
- Active button has gradient background that slides smoothly
- Inactive button shows primary text color
- Smooth spring animations on toggle
- translateX interpolation from 0 to 110px for sliding effect

**Toggle Behavior:**
- Clicking a language button switches the displayed consent text
- Resets scroll progress when switching languages (user must scroll to bottom again)
- Content slides and fades smoothly during language switch
- Logs language switch to console for debugging

#### Content Display:
Modified HTML rendering to display the correct language:
```javascript
<ConsentHtmlContent
  html={consentData.html[selectedLanguage]}
  contentWidth={windowWidth * 0.94 - 80}
/>
```

#### Animations:
- **Sliding Background**: Uses `Animated.spring` with translateX interpolation
- **Content Transition**: Uses `Animated.sequence` for slide-out/slide-in effect with opacity fade
- Timing: 150ms slide out, 200ms slide in
- Direction: Slides right for Hindi, left for English

### 3. **Styles Added** (Lines 936-994)

**languageToggleContainer:**
- Centered flex row layout
- Matches header background color (#E8F5F7)
- Border bottom for visual separation
- 12px vertical padding

**segmentedControl:**
- Rounded pill container (#D0E8ED background)
- Relative positioning for sliding background
- 3px padding around buttons
- No gap between buttons

**slidingBackground:**
- Absolute positioned
- 100px width, 34px height
- Gradient colors: #43C6DB to #0083B0
- Shadow and elevation for depth
- Animates translateX from 0 to 110px

**languageButton:**
- Centered text layout
- 100px min width, 34px height
- 9px vertical padding
- z-index: 1 to appear above sliding background

**languageButtonText / languageButtonTextActive:**
- 14px font size, letterSpacing: 0
- Primary color for inactive, White for active
- lineHeight: 18, includeFontPadding: false
- Special Hindi text alignment handling

## User Experience Flow

1. **Modal Opens:**
   - Shows English consent by default
   - Both language buttons visible at top
   - English button is highlighted (active state)

2. **User Switches to Hindi:**
   - Clicks "हिंदी" button
   - Background slides smoothly to Hindi button
   - Content slides out and new content slides in with fade
   - Hindi button becomes active
   - Scroll progress resets (must scroll to bottom again to enable "I Agree")

3. **User Switches Back to English:**
   - Clicks "English" button
   - Background slides back to English button
   - Content transitions smoothly
   - Scroll progress resets again

4. **Submit Consent:**
   - Language selection is cosmetic only
   - Same API call regardless of language selected
   - Only functionality: displaying text in chosen language
   - API logging includes selected language for debugging

## No Functional Changes
✅ All existing consent functionality remains unchanged:
- Scroll tracking still works
- "I Agree" button still requires scrolling to bottom
- API submission logic unchanged
- Success animation unchanged
- Error handling unchanged
- Phone number validation unchanged

## API Logging Enhancement

### Utils.js Changes
Added debug logging for GetConsMaster API responses:
```javascript
if (url.includes('GetConsMaster')) {
    console.log('===== RAW API RESPONSE (GetConsMaster) =====');
    console.log('Response status:', res.status);
    console.log('Response bodyString length:', res.bodyString?.length);
    console.log('Response bodyString preview (first 500):', res.bodyString?.substring(0, 500));
}
```

### Consent Submission Logging
Detailed logging added for consent submission:
- Selected language at submission time
- Full request payload
- Full response data
- Error details with codes

## Files Modified
1. `/src/hooks/useConsentManager.js` - Backend integration with language parsing
2. `/src/screens/ConsentModal.js` - UI with sliding language toggle
3. `/src/Utils/Utils.js` - API response logging
4. `/src/screens/Home.js` - Already has imports and integration (no changes needed)

## Design Notes
- Toggle uses Maruti theme colors (Primary: #0083B0, Secondary: #43C6DB)
- iOS-style sliding segmented control design
- Smooth transitions and animations
- Clean, modern aesthetic matching existing modal
- Accessible with clear visual states
- Responsive layout that works on all screen sizes
- Special handling for Hindi text alignment (letterSpacing: 0)

## Testing Checklist
- [x] iOS build successful
- [x] No TypeScript/JavaScript errors
- [x] Modal appearance with language toggle
- [x] Switching between English and Hindi
- [x] Scroll progress resets on language change
- [x] API returns both language rows
- [x] Correct CONS_HEADING parsing with .includes()
- [x] Consent submission after switching languages
- [x] Fallback messages if API fails
- [x] API logging for debugging
- [x] Hindi text alignment fixes
- [x] Sliding animations smooth
- [x] Button cutoff issues resolved
