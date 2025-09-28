# Google Sheets API Setup

To enable sheet updates (pinning questions), you need to set up Google Sheets API authentication.

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

### 2. Enable Google Sheets API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

### 3. Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Give it a name (e.g., "dsa-dashboard-service")
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### 4. Generate Service Account Key

1. In the Credentials page, find your service account
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Download the JSON file

### 5. Share Your Google Sheet

1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (found in the JSON file) as an editor
4. Make sure to give it "Editor" permissions

### 6. Configure Environment Variables

Create a `.env.local` file in your project root with one of these options:

#### Option A: Base64 Encoded JSON (Recommended for deployment)

```bash
# Convert your JSON file to base64 and add it here
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=your_base64_encoded_json_here
```

To convert JSON to base64:
```bash
# On Windows (PowerShell)
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content "path/to/your/service-account-key.json" -Raw)))

# On Mac/Linux
base64 -i path/to/your/service-account-key.json
```

#### Option B: File Path (For local development)

```bash
# Save your JSON file in the project root and reference it
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json
```

### 7. Test the Setup

1. Restart your development server
2. Try pinning/unpinning a question
3. Check if the Google Sheet updates in real-time

## Troubleshooting

### Common Issues

1. **"Authentication not configured" error**
   - Make sure you've set up the environment variables correctly
   - Check that the JSON file is valid

2. **"Permission denied" error**
   - Make sure you've shared the Google Sheet with the service account email
   - Verify the service account has "Editor" permissions

3. **"Sheet not found" error**
   - Check that the sheet ID is correct
   - Make sure the sheet is accessible

### Security Notes

- Never commit your service account JSON file to version control
- Use environment variables for production deployments
- Consider using a secrets management service for production

## Alternative: Public Sheet Method

If you don't want to set up API authentication, you can make your sheet publicly editable:

1. Open your Google Sheet
2. Click "Share" > "Change to anyone with the link"
3. Set permissions to "Editor"
4. Note: This makes your sheet publicly editable by anyone with the link

However, this method is less secure and not recommended for production use.
