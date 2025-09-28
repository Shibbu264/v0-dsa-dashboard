# 🚀 Complete Apps Script Setup Guide

This guide will help you set up full automation for your DSA Dashboard with Google Apps Script.

## 🎯 What This Achieves

### ✅ **Full Functionality:**
- **Add new questions** directly to your Google Sheet
- **Update pinned status** automatically by clicking
- **Update solved/pending status** automatically by clicking
- **Real-time sync** between dashboard and sheet
- **Works with any copied sheet** (one-time setup)

## 📋 Step-by-Step Setup

### **Step 1: Copy the Template Sheet**
1. Copy this sheet: `https://docs.google.com/spreadsheets/d/1M0NOBIbt0A6OmJvIKYmYU0d8ODaTEVmzenhGOLizhbg/edit`
2. Your copy will have the Apps Script pre-installed

### **Step 2: Open Apps Script**
1. Open your copied Google Sheet
2. Go to **Extensions** → **Apps Script**
3. You'll see a new Apps Script project

### **Step 3: Paste the Code**
1. Delete any existing code in the Apps Script editor
2. Copy and paste the complete Apps Script code (see below)
3. Save the project (Ctrl+S or Cmd+S)

### **Step 4: Deploy the Script**
1. Click **Deploy** → **New deployment**
2. Choose **Web app** as the type
3. Set **Execute as**: Me (your email)
4. Set **Who has access**: Anyone
5. Click **Deploy**
6. **Copy the web app URL** - you'll need this!

### **Step 5: Configure Your Dashboard**
1. Add the web app URL to your environment variables:
   ```bash
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
2. Restart your development server
3. Your dashboard will now use Apps Script automatically!

## 📝 Complete Apps Script Code

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    switch (data.action) {
      case 'addQuestion':
        return addQuestion(sheet, data);
      case 'updatePinned':
        return updatePinned(sheet, data);
      case 'updateStatus':
        return updateStatus(sheet, data);
      default:
        return createResponse({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function addQuestion(sheet, data) {
  const { name, platform, link, topic, status, pinned } = data;
  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;
  
  // Set values in the new row
  sheet.getRange(newRow, 1).setValue(name);           // Column A: Name
  sheet.getRange(newRow, 2).setValue(platform);       // Column B: Platform
  sheet.getRange(newRow, 3).setValue(link);           // Column C: Link
  sheet.getRange(newRow, 4).setValue(topic);          // Column D: Topic
  sheet.getRange(newRow, 5).setValue(status);         // Column E: Status
  sheet.getRange(newRow, 6).setValue(pinned);         // Column F: Pinned
  
  return createResponse({ 
    success: true, 
    message: `Question "${name}" added successfully`,
    row: newRow
  });
}

function updatePinned(sheet, data) {
  const { questionName, pinned } = data;
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === questionName) {
      sheet.getRange(i + 1, 6).setValue(pinned ? 'TRUE' : 'FALSE');
      return createResponse({ 
        success: true, 
        message: `Pinned status updated for "${questionName}"`,
        row: i + 1
      });
    }
  }
  
  return createResponse({ 
    success: false, 
    error: `Question "${questionName}" not found` 
  });
}

function updateStatus(sheet, data) {
  const { questionName, status } = data;
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === questionName) {
      sheet.getRange(i + 1, 5).setValue(status);
      return createResponse({ 
        success: true, 
        message: `Status updated for "${questionName}"`,
        row: i + 1
      });
    }
  }
  
  return createResponse({ 
    success: false, 
    error: `Question "${questionName}" not found` 
  });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function (optional)
function testAddQuestion() {
  const testData = {
    action: 'addQuestion',
    name: 'Test Question',
    platform: 'LeetCode',
    link: 'https://leetcode.com/test',
    topic: 'Arrays',
    status: 'Pending',
    pinned: true
  };
  
  const result = doPost({
    postData: {
      contents: JSON.stringify(testData)
    }
  });
  
  console.log(result.getContent());
}
```

## 🎉 What Happens After Setup

### **Automatic Features:**
- ✅ **Click pinned icons** → Automatically updates in Google Sheet
- ✅ **Click status badges** → Automatically updates in Google Sheet  
- ✅ **Add new questions** → Automatically added to Google Sheet
- ✅ **Real-time sync** → Changes reflect immediately
- ✅ **No manual work** → Everything happens automatically

### **Fallback Behavior:**
- If Apps Script is not set up, changes are saved locally
- Dashboard still works with local updates
- Users can still manually update the Google Sheet

## 🔧 Troubleshooting

### **Common Issues:**

1. **"Script not found" error**
   - Make sure you deployed the script as a web app
   - Check that the URL is correct in your environment variables

2. **"Permission denied" error**
   - Make sure you set "Who has access" to "Anyone"
   - Try redeploying the script

3. **"Question not found" error**
   - Make sure the question name matches exactly
   - Check that the sheet has the correct column structure

4. **Changes not appearing**
   - Refresh your Google Sheet
   - Check the Apps Script logs for errors

### **Testing:**
- Use the `testAddQuestion()` function in Apps Script to test
- Check the execution logs in Apps Script
- Verify the web app URL is accessible

## 🚀 Benefits

### **For Users:**
- **One-time setup** → Copy sheet + deploy script
- **Full automation** → No manual work needed
- **Real-time sync** → Changes appear immediately
- **Works with any sheet** → Universal solution

### **For Developers:**
- **No server costs** → Apps Script handles everything
- **No API limits** → Google handles the heavy lifting
- **Easy maintenance** → Update script once, affects all copies
- **Secure** → Data stays in user's Google account

This setup makes your DSA Dashboard incredibly powerful and user-friendly! 🎉
