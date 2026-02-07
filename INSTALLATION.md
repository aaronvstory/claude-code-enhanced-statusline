# Quick Installation Guide

## 1. Download

```bash
mkdir -p ~/.claude/statusline
cd ~/.claude/statusline
curl -O https://raw.githubusercontent.com/aaronvstory/claude-code-enhanced-statusline/master/enhanced-statusline.js
```

On Windows:
```powershell
mkdir "$env:USERPROFILE\.claude\statusline" -Force
cd "$env:USERPROFILE\.claude\statusline"
curl -O https://raw.githubusercontent.com/aaronvstory/claude-code-enhanced-statusline/master/enhanced-statusline.js
```

## 2. Configure Claude Code

Add the `statusLine` key to your `~/.claude/settings.json` (create it if needed, but don't overwrite existing settings):

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

Replace `username`/`USERNAME` with your actual username.

## 3. Set Up Quota Tracking

This is how you get the `5h:`, `Wk:`, and `Sn:` usage bars on the second line.

Create `~/.claude/usage-credentials.json`:

```json
{
  "sessionKey": "sk-ant-...",
  "orgId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### Getting your sessionKey:

1. Go to [claude.ai](https://claude.ai) in your browser and log in
2. Press **F12** to open DevTools
3. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
4. In the left sidebar: **Cookies** → **https://claude.ai**
5. Find the `sessionKey` row → copy the **Value** (starts with `sk-ant-`)

### Getting your orgId:

1. On [claude.ai](https://claude.ai), look at the URL in your address bar
2. It looks like: `https://claude.ai/chat/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
3. That UUID after `/chat/` is your orgId — copy it
4. Or: **Settings** → **Organization** on claude.ai

> The sessionKey expires periodically. If quota bars disappear later, just re-copy it from your browser.

## 4. Configure Weather (Optional)

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

Skip this if you don't care about weather — the New York defaults work fine.

## 5. Restart Claude Code

Quit Claude Code completely and relaunch it.

## 6. Verify

You should see **two lines** at the bottom of your terminal:

**Line 1** — Model, directory, git branch, date, time, weather, Bitcoin, version

**Line 2** — Usage bars:
- `Ctx:` — Context window percentage with token count
- `5h:` — 5-hour rolling rate limit usage with reset timer
- `Wk:` — Weekly quota usage with reset timer
- `Sn:` — Sonnet-specific usage (appears when > 0%)

The quota bars (`5h:`, `Wk:`, `Sn:`) populate within a few seconds after launch.

## Troubleshooting

### Quota bars not showing?

1. Check `~/.claude/usage-credentials.json` exists
2. Verify it's valid JSON — both keys in double quotes, no trailing commas
3. Re-copy `sessionKey` from browser cookies — it expires periodically
4. Verify `orgId` is correct (UUID from the claude.ai URL)
5. Enable debug mode to see API errors:
   ```bash
   export DEBUG_STATUSLINE=1  # Linux/Mac
   $env:DEBUG_STATUSLINE=1    # Windows PowerShell
   ```

### Weather not showing?

1. Check internet connection
2. Try visiting https://wttr.in in your browser
3. Update `WEATHER_CONFIG` in the script

### Token usage shows "~" instead of "●"?

Normal on first launch. After one Claude interaction, it switches to real data.

## Debug Mode

```bash
export DEBUG_STATUSLINE=1    # Linux/Mac
$env:DEBUG_STATUSLINE=1      # Windows PowerShell
claude
```

Debug file: `%TEMP%\claude-statusline-debug.json` (Windows) or `/tmp/claude-statusline-debug.json` (Linux/Mac)
