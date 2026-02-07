# Quick Installation Guide

## 1. Download

```bash
# Create statusline directory
mkdir -p ~/.claude/statusline
cd ~/.claude/statusline

# Download the script
curl -O https://raw.githubusercontent.com/aaronvstory/claude-code-enhanced-statusline/master/enhanced-statusline.js
```

On Windows:
```powershell
mkdir "$env:USERPROFILE\.claude\statusline" -Force
cd "$env:USERPROFILE\.claude\statusline"
curl -O https://raw.githubusercontent.com/aaronvstory/claude-code-enhanced-statusline/master/enhanced-statusline.js
```

## 2. Configure Weather Location

Edit `enhanced-statusline.js` and find the `WEATHER_CONFIG` section (around line 50):

```javascript
const WEATHER_CONFIG = {
  zipCode: "10001",           // Change to YOUR zip code
  cityName: "New York,NY",   // Change to YOUR city
  latitude: 40.7128,         // Change to YOUR latitude
  longitude: -74.006,        // Change to YOUR longitude
  defaultLocation: "New York" // Change to YOUR location name
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

**Important:** Replace `username`/`USERNAME` with your actual username!

## 4. Set Up Quota Tracking (Optional)

This enables the `5h:`, `Wk:`, and `Sn:` usage bars on the second line. Skip this step if you only want context tracking.

Create `~/.claude/usage-credentials.json`:

```json
{
  "sessionKey": "YOUR_SESSION_KEY",
  "orgId": "YOUR_ORG_ID"
}
```

**Finding your sessionKey:**
1. Go to [claude.ai](https://claude.ai) and log in
2. Open DevTools (F12) → **Application** → **Cookies** → `https://claude.ai`
3. Copy the value of the `sessionKey` cookie

**Finding your orgId:**
1. Log in to [claude.ai](https://claude.ai)
2. Check the URL: `https://claude.ai/chat/YOUR_ORG_ID`
3. Or find it under **Settings** → **Organization**

> The sessionKey expires periodically. If quota bars disappear, just refresh the key.

## 5. Restart Claude Code

Quit Claude Code completely and relaunch it.

## 6. Verify

You should see **two lines** at the bottom of your terminal:

**Line 1** — Model, directory, git branch, date, time, weather, Bitcoin price, version

**Line 2** — Usage bars:
- `Ctx:` — Context window percentage with token count
- `5h:` — 5-hour rolling quota (only if credentials configured)
- `Wk:` — Weekly quota (only if credentials configured)
- `Sn:` — Sonnet usage (only if > 0% and credentials configured)

## Troubleshooting

### Quota bars not showing?

1. Check that `~/.claude/usage-credentials.json` exists
2. Verify it's valid JSON (no trailing commas, keys in quotes)
3. Re-copy `sessionKey` from browser — it expires periodically
4. Verify `orgId` is correct (from the claude.ai URL)
5. Enable debug mode to see API errors:
   ```bash
   export DEBUG_STATUSLINE=1  # Linux/Mac
   $env:DEBUG_STATUSLINE=1    # Windows PowerShell
   ```

### Weather not showing?

1. Check internet connection
2. Verify your location configuration
3. Try visiting https://wttr.in in your browser

### Bitcoin price not showing?

1. Check internet connection
2. Wait a few seconds for the first fetch

### Version shows "?.?.?"?

Normal if Claude Code isn't in your PATH. The statusline still works fine.

### Token usage shows "~" instead of "●"?

Normal for the first message. After one interaction, it switches to real data.

## Debug Mode

```bash
export DEBUG_STATUSLINE=1    # Linux/Mac
$env:DEBUG_STATUSLINE=1      # Windows PowerShell
claude
```

Check debug file: `%TEMP%\claude-statusline-debug.json` (Windows) or `/tmp/claude-statusline-debug.json` (Linux/Mac)
