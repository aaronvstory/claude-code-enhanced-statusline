# Quick Installation Guide

## 1. Download

```bash
# Navigate to your Claude config directory
cd ~/.claude  # On Linux/Mac
cd C:\Users\USERNAME\.claude  # On Windows

# Create statusline directory
mkdir -p statusline
cd statusline

# Download the script
curl -O https://raw.githubusercontent.com/aaronvstory/claude-code-enhanced-statusline/main/enhanced-statusline.js

# Make it executable (Linux/Mac only)
chmod +x enhanced-statusline.js
```

## 2. Configure Weather Location

Edit `enhanced-statusline.js` and find the `WEATHER_CONFIG` section (around line 50):

```javascript
const WEATHER_CONFIG = {
  zipCode: "10001", // Change to YOUR zip code
  cityName: "New York,NY", // Change to YOUR city
  latitude: 40.7128, // Change to YOUR latitude
  longitude: -74.006, // Change to YOUR longitude
  defaultLocation: "New York", // Change to YOUR location name
};
```

## 3. Configure Claude Code

Add to your `~/.claude/settings.json`:

### Linux/Mac:

```json
{
  "statusLine": {
    "command": "node /home/username/.claude/statusline/enhanced-statusline.js",
    "type": "command"
  }
}
```

### Windows:

```json
{
  "statusLine": {
    "command": "node C:/Users/USERNAME/.claude/statusline/enhanced-statusline.js",
    "type": "command"
  }
}
```

**Important:** Replace `USERNAME` with your actual username!

## 4. Restart Claude Code

Quit Claude Code completely and relaunch it.

## 5. Verify

You should see your new status line with:

- Model name
- Current directory
- Git branch (if in a git repo)
- Date and time
- Weather
- Bitcoin price
- Version number
- Token usage with progress bar

## Troubleshooting

### Weather not showing?

1. Check internet connection
2. Verify your location configuration
3. Try visiting https://wttr.in in your browser

### Bitcoin price not showing?

1. Check internet connection
2. Wait a few seconds for the first fetch

### Version shows "?.?.?"?

This is normal if Claude Code isn't in your PATH. The statusline will still work fine.

### Token usage shows "~" instead of "●"?

This is normal for the first message. After your first interaction, it should show "●" (real data).

## Debug Mode

Enable debug logging:

**Linux/Mac:**

```bash
export DEBUG_STATUSLINE=1
claude
```

**Windows:**

```powershell
$env:DEBUG_STATUSLINE=1
claude
```

Check debug file: `%TEMP%\claude-statusline-debug.json` (Windows) or `/tmp/claude-statusline-debug.json` (Linux/Mac)
