# SN Utils Config Backup/Restore Bookmarklet

A simple bookmarklet to backup and restore your ServiceNow Utils instance tag configurations (favicon overrides). Never lose your custom instance markers again!

## 🚀 Quick Start

### Installation

**Option 1: Drag and Drop (Recommended)**
1. Open `sn-utils-config-bookmarklet.html` in your browser
2. Drag the bookmarklet link to your bookmarks bar

**Option 2: Manual Installation**
1. Create a new bookmark in your browser
2. Name it "SN Utils Backup"
3. Copy the entire contents of the minified bookmarklet (see below)
4. Paste it as the URL/Location of the bookmark

## 📖 Usage

### Backup Your Configurations
1. Navigate to any ServiceNow instance
2. Click the bookmarklet in your bookmarks bar
3. Click **"💾 Backup Config"**
4. A JSON file will be downloaded with all your instance tag configurations

### Restore Your Configurations
1. Navigate to any ServiceNow instance
2. Click the bookmarklet in your bookmarks bar
3. Click **"📥 Restore from File"**
4. Select your previously saved backup JSON file
5. Configurations will be restored and the page will reload automatically

### View Your Current Configurations
1. Click the bookmarklet
2. Click **"👁️ View Config"**
3. Open browser console (F12) to see all current configurations in detail

## 🔧 What Gets Backed Up?

The bookmarklet backs up all instance-specific tag configurations stored in `chrome.storage.sync`, including:

- `tagText` - The text displayed on the instance marker
- `tagFontSize` - Font size of the marker (e.g., "11pt")
- `tagFontColor` - Text color (e.g., "#FFFFFF")
- `tagTagColor` - Background color / favicon override color (e.g., "#4CAF50")
- `tagOpacity` - Transparency level (e.g., "0.8")
- `tagLeft` - Horizontal position on screen
- `tagBottom` - Vertical position on screen
- `tagCommand` - Command triggered on click (e.g., "/tn")
- `tagCommandShift` - Command triggered on Shift+click (e.g., "/vd")
- `tagTextDoubleclick` - Command triggered on double-click (e.g., "/pop")
- `tagEnabled` - Whether the tag is enabled (true/false)

## 🎯 Use Cases

- **Browser Migration**: Easily transfer your instance tag configs when switching browsers
- **Multiple Machines**: Sync your configs across different computers
- **Backup Before Changes**: Create a safety backup before experimenting with new configurations
- **Team Sharing**: Share your instance tag setup with team members
- **Disaster Recovery**: Quickly restore after accidentally resetting or losing configurations

## 🔍 How It Works

1. The bookmarklet accesses `chrome.storage.sync` (the same storage used by SN Utils)
2. Filters for all keys containing `-instancetag` (format: `{instance}-instancetag`)
3. For backup: Downloads these as a JSON file
4. For restore: Reads the JSON file and writes back to `chrome.storage.sync`

## ⚠️ Important Notes

- **Requires SN Utils Extension**: This bookmarklet requires the ServiceNow Utils extension to be installed
- **ServiceNow Page Required**: Must be executed on a ServiceNow instance page
- **Overwrites on Restore**: Restoring will overwrite existing configurations for matching instances
- **Local Storage Only**: Backup files are saved to your Downloads folder
- **Auto-Reload**: The page automatically reloads after restoring to apply changes

## 🐛 Troubleshooting

### Nothing happens when clicking the bookmarklet
- Ensure you're on a ServiceNow instance page
- Verify the SN Utils extension is installed and active
- Check browser console (F12) for errors

### "No configs found" message
- You may not have configured any instance tags yet
- Try setting up an instance tag first using SN Utils
- Check that configs are stored in sync storage (not local)

### Restore not working
- Verify the JSON file is valid and created by this bookmarklet
- Check browser console for specific error messages
- Ensure you have the necessary permissions in your browser

### Configs not appearing after restore
- Wait for the automatic page reload to complete
- Try manually refreshing the page
- Clear browser cache and reload

## 📝 Backup File Format

The backup file is a JSON object with keys in the format `{instance}-instancetag`:

```json
{
  "dev12345-instancetag": {
    "tagEnabled": true,
    "tagLeft": "1000px",
    "tagBottom": "200px",
    "tagText": "PDI dev12345",
    "tagFontSize": "11pt",
    "tagTagColor": "#FFC107",
    "tagFontColor": "#FFFFFF",
    "tagOpacity": "0.8",
    "tagCommand": "/tn",
    "tagCommandShift": "/vd",
    "tagTextDoubleclick": "/pop"
  },
  "mycompanydev-instancetag": {
    "tagEnabled": true,
    "tagLeft": "auto",
    "tagBottom": "0px",
    "tagText": "DEV",
    "tagFontSize": "11pt",
    "tagTagColor": "#FF9800",
    "tagFontColor": "#000000",
    "tagOpacity": "0.8",
    "tagCommand": "/tn",
    "tagCommandShift": "/vd",
    "tagTextDoubleclick": "/pop"
  }
}
```

## 🔐 Privacy & Security

- All data is stored locally in your browser's sync storage
- No data is sent to external servers
- Backup files remain on your local machine
- The bookmarklet only accesses storage when explicitly triggered

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue in the ServiceNow Utils repository.

## 📄 License

This bookmarklet is part of the ServiceNow Utils project and follows the same license.

## 🙏 Credits

Created for the ServiceNow Utils community to make managing instance tags easier and more reliable.

---

**Pro Tip**: Create regular backups, especially before making major changes or when you have a complex multi-instance setup!
