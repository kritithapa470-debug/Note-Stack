# Note Stack - Testing Guide

## Quick Start Testing

### 1. Open the Main Application
1. Navigate to the project folder: `/Users/kritithapa/Desktop/Note-Stack`
2. Open `notes.html` in your web browser (Chrome, Firefox, Safari, or Edge)
3. The application will load with the login screen

### 2. Test Student Flow

**A. Login as Student:**
```
1. Enter any username (e.g., "john_doe")
2. Select "Student" role
3. Click "Continue"
```

**B. Test Navigation:**
- Click each tab: Browse notes, Upload a note, My uploads, **Rewards** (NEW), Leaderboard, **Contact** (NEW)
- Verify all tabs load correctly

**C. Test File Upload:**
```
1. Click "Upload a note" tab
2. Fill in:
   - Title: "Test Note - Physics Chapter 1"
   - Subject: "Physics"
   - Description: "Summary of first chapter"
3. Click "Choose file" and select a PDF or image (max 4MB)
4. Add note content or let file auto-fill (for .txt/.md files)
5. Click "Submit for review"
6. Verify success message appears
```

**D. Check My Uploads:**
```
1. Click "My uploads" tab
2. Find your uploaded note with "pending" status
3. Verify file attachment shows
```

**E. Test Rewards (Initially):**
```
1. Click "Rewards" tab
2. Verify you see "0 points" (notes not approved yet)
3. See empty history message
```

**F. Test Contact:**
```
1. Click "Contact" tab
2. Fill in contact form:
   - Name: Your Name
   - Email: your@email.com
   - Message: Test message
3. Click "Send Message"
4. Verify green success message appears
5. Check that form cleared
6. Wait 5 seconds - success message disappears
```

### 3. Test Admin Flow

**A. Switch to Admin:**
```
1. Click "Switch user" button (top right)
2. Enter username: "admin_user"
3. Select "Admin" role
4. Click "Continue"
```

**B. Test Review Queue:**
```
1. Admin dashboard shows statistics
2. Click "Review queue" tab (should be active)
3. Find the student's pending note
4. Click "Approve (+5 pts)" button
5. Note disappears from queue
```

**C. Check Other Admin Tabs:**
```
1. Click "Manage users" - see list of registered users
2. Click "All notes" - see all notes (approved, pending, rejected)
```

### 4. Verify Reward System Works

**A. Switch back to Student:**
```
1. Click "Switch user"
2. Enter same student username from step 2
3. Select "Student"
4. Click "Continue"
```

**B. Check Points:**
```
1. Look at top right - should show "★ 5 pts"
2. Click "Rewards" tab
3. Verify "Your Total Points: ★ 5"
4. Check history - should show approved note with "+5 pts"
```

**C. Test Persistence:**
```
1. Refresh the page (Cmd+R or Ctrl+R)
2. Login again as the same student
3. Verify points still show "5 pts"
4. Check Rewards tab - history still there
```

**D. Check Browse Notes:**
```
1. Click "Browse notes" tab
2. Find your approved note in the grid
3. Click "Open file" button
   - PDF should open in new tab
   - Image should display
4. Click "Download" button
   - File should download with correct name
```

**E. Test Leaderboard:**
```
1. Click "Leaderboard" tab
2. Find your username with 5 pts
3. Should show "(you)" next to your name
```

### 5. Test Responsive Design

**A. Desktop View (Current):**
- Verify multi-column note grid
- Full navigation visible
- All elements properly spaced

**B. Tablet View (768px):**
```
1. Resize browser window to ~768px wide
OR
2. Open Chrome DevTools (F12)
3. Click device toggle (Ctrl+Shift+M)
4. Select "iPad" or "iPad Mini"
```
**Check:**
- Notes grid adjusts to 2 columns
- Forms stack vertically
- Navigation wraps properly
- Text remains readable

**C. Mobile View (375px):**
```
1. In DevTools, select "iPhone SE" or "iPhone 12"
OR
2. Resize window to ~375px
```
**Check:**
- Notes display in single column
- All tabs visible (may wrap)
- Forms are full width
- Buttons are touch-friendly
- No horizontal scrolling
- File action buttons stack vertically

**D. Small Mobile (360px):**
```
1. In DevTools, select "Galaxy S20"
2. Or set custom dimensions to 360x640
```
**Check:**
- Spiral notebook binding adjusts
- Brand logo scales down
- All content fits without scrolling horizontally

### 6. Test Error Handling

**A. File Size Limit:**
```
1. Go to "Upload a note"
2. Try to upload a file > 4MB
3. Verify error message: "File too large (max 4 MB) — not attached"
4. File should not be attached
```

**B. Missing Required Fields:**
```
1. Go to "Upload a note"
2. Leave Title empty
3. Click "Submit for review"
4. Verify error: "Title and subject are required"
```

**C. No Content:**
```
1. Fill Title and Subject only
2. Don't add content or file
3. Click submit
4. Verify error: "Add note content or attach a file"
```

### 7. Test Multiple Students

**A. Create Second Student:**
```
1. Switch user
2. Create "alice_smith" as Student
3. Upload another note
```

**B. Admin Approves:**
```
1. Switch to admin
2. Approve alice's note
3. Verify stats update
```

**C. Check Leaderboard:**
```
1. Switch to either student
2. View Leaderboard
3. Both students should appear
4. Verify correct point totals
5. Check ranking order
```

## Browser Testing Matrix

### Test Across Browsers:

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| File Upload | ✓ | ✓ | ✓ | ✓ |
| File Open | ✓ | ✓ | ✓ | ✓ |
| File Download | ✓ | ✓ | ✓ | ✓ |
| Points Persist | ✓ | ✓ | ✓ | ✓ |
| Responsive Design | ✓ | ✓ | ✓ | ✓ |
| Contact Form | ✓ | ✓ | ✓ | ✓ |

## Mobile Device Testing

### iOS Testing:
1. Open Safari on iPhone
2. Navigate to file location or use localhost
3. Test all features
4. Verify touch interactions work
5. Check file downloads work on iOS

### Android Testing:
1. Open Chrome on Android phone
2. Navigate to file location
3. Test uploads/downloads
4. Verify responsive layout
5. Check all buttons are tappable

## Performance Testing

### Load Time:
- Initial page load should be < 1 second
- Tab switching should be instant
- File upload preview should appear immediately
- No lag when typing in forms

### Storage Check:
```javascript
// Open browser console (F12)
// Check localStorage usage:
console.log('Users:', localStorage.getItem('ns-users'));
console.log('Notes:', localStorage.getItem('ns-notes'));

// Check size:
const usersSize = localStorage.getItem('ns-users')?.length || 0;
const notesSize = localStorage.getItem('ns-notes')?.length || 0;
console.log('Storage used:', (usersSize + notesSize) / 1024 + ' KB');
```

## Troubleshooting

### Issue: Notes.html won't open
**Solution:** 
- Right-click `notes.html` → Open With → Your browser
- Or double-click the file

### Issue: Points don't persist
**Solution:**
- Check if browser has localStorage enabled
- Try clearing cache and testing again
- Check browser console for errors

### Issue: Files won't upload
**Solution:**
- Verify file is < 4MB
- Check file type is supported (.pdf, .jpg, .png, .txt, .md)
- Try a different file

### Issue: Responsive design not working
**Solution:**
- Hard refresh the page (Ctrl+Shift+R)
- Clear browser cache
- Make sure style changes loaded

### Issue: Contact form not working
**Solution:**
- Check browser console for errors
- Form currently logs to console (not sending actual emails)
- This is expected behavior

## Expected Results Summary

✅ **After Testing, You Should See:**

1. **Responsive Design:** Website works perfectly on all screen sizes
2. **File Upload:** Students can upload PDFs, images, and text files
3. **File Opening:** Clicking "Open file" opens the uploaded file
4. **File Download:** Clicking "Download" downloads the file
5. **Rewards System:** 
   - Students start with 0 points
   - +5 points awarded when admin approves a note
   - Points persist across page refreshes
   - Rewards history shows all approved notes
6. **Contact Page:** Form works and shows success message
7. **Navigation:** All tabs work (including new Rewards and Contact tabs)
8. **No Errors:** No JavaScript errors in browser console
9. **No Horizontal Scroll:** On any device size
10. **Data Persistence:** Users, notes, and points survive page refresh

## Test Data Examples

### Sample Student Accounts:
- john_doe (Student)
- alice_smith (Student)
- bob_jones (Student)
- admin_user (Admin)

### Sample Notes:
```
Title: "Physics Chapter 1 - Kinematics"
Subject: "Physics"
Description: "Motion in one dimension notes"
Content: "Distance = Speed × Time..."

Title: "Mathematics - Calculus Basics"
Subject: "Mathematics"  
Description: "Introduction to derivatives"
Content: "The derivative represents the rate of change..."

Title: "Chemistry - Periodic Table"
Subject: "Chemistry"
Description: "Element properties and trends"
File: Upload a PDF or image
```

## Automated Testing (Optional)

If you want to add automated tests in the future, consider:
- Jest for unit testing
- Cypress for end-to-end testing
- Playwright for cross-browser testing

## Success Criteria

✅ All tests pass
✅ No console errors
✅ Responsive design works on all devices
✅ Files upload, open, and download correctly
✅ Points system works without duplicates
✅ Contact form submits successfully
✅ Navigation works on mobile
✅ Data persists across refreshes

## Report Issues

If you find any bugs:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Note browser version and device
4. Screenshot the issue
5. Test in different browser to confirm

The application should work flawlessly across all the scenarios above!
