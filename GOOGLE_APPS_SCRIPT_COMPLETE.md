# Complete Google Apps Script Solution

This solution enables full functionality for any copied Google Sheet without requiring individual API setup.

## 🎯 **What This Achieves**

### ✅ **Full Functionality:**
- **Add new questions** directly to the sheet
- **Update pinned status** automatically
- **Update solved/pending status** automatically
- **Real-time sync** between dashboard and sheet
- **Works with any copied sheet** (one-time setup)

### ✅ **User Experience:**
- **Click to add question** → Automatically added to sheet
- **Click pinned/status** → Automatically updated in sheet
- **No manual work** → Everything syncs automatically
- **Works immediately** → After one-time script setup

## 📋 **Setup Instructions (For Sheet Owners)**

### **Step 1: Copy the Template Sheet**
1. Copy this sheet: `https://docs.google.com/spreadsheets/d/1M0NOBIbt0A6OmJvIKYmYU0d8ODaTEVmzenhGOLizhbg/edit`
2. Your copy will have the Apps Script pre-installed

### **Step 2: Deploy the Script (One-time)**
1. Open your copied sheet
2. Go to **Extensions** > **Apps Script**
3. Click **Deploy** > **New deployment**
4. Choose **Web app** as type
5. Set **Execute as**: Me (your email)
6. Set **Who has access**: Anyone
7. Click **Deploy**
8. **Copy the web app URL** - you'll need this!

### **Step 3: Configure Your Dashboard**
1. Use your copied sheet URL in the dashboard
2. The dashboard will automatically detect and use the Apps Script
3. All functionality will work immediately!

## 🔧 **Apps Script Code**

Here's the complete Apps Script that handles all operations:

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
  
  // Add new row at the end
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
  
  // Find the row with the matching question name
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
  
  // Find the row with the matching question name
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

## 🚀 **Updated Dashboard API**

The dashboard would need to be updated to use the Apps Script:

### **Add Question API:**
```javascript
// POST /api/add-question
const response = await fetch(appsScriptUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'addQuestion',
    name: questionData.name,
    platform: questionData.platform,
    link: questionData.link,
    topic: questionData.topic,
    status: 'Pending',
    pinned: true
  })
});
```

### **Update Pinned API:**
```javascript
// POST /api/update-pinned
const response = await fetch(appsScriptUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'updatePinned',
    questionName: questionName,
    pinned: pinned
  })
});
```

### **Update Status API:**
```javascript
// POST /api/update-status
const response = await fetch(appsScriptUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'updateStatus',
    questionName: questionName,
    status: status
  })
});
```

## 🎉 **Benefits of This Approach**

### ✅ **For Users:**
- **One-time setup** → Copy sheet + deploy script
- **Full functionality** → Add, update, sync automatically
- **No API keys** → No authentication required
- **Works immediately** → After setup, everything works

### ✅ **For Developers:**
- **No server costs** → Apps Script handles everything
- **No API limits** → Google handles the heavy lifting
- **Universal solution** → Works with any copied sheet
- **Easy maintenance** → Update script once, affects all copies

### ✅ **For Sheet Owners:**
- **Complete control** → Own the data and script
- **Easy sharing** → Just share the sheet URL
- **No dependencies** → Works independently
- **Secure** → Data stays in your Google account

## 🔄 **Migration Path**

### **Current State:**
- Local updates only
- Manual sheet editing required
- Limited functionality

### **With Apps Script:**
- Full automation
- Real-time sync
- Complete functionality
- Works with any copied sheet

This solution would make the dashboard truly powerful and user-friendly! 🚀
