# Enhanced Claude Code Status Line

A two-line status bar for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that shows your **real-time API quota usage** — 5-hour rate limit, weekly quota, and Sonnet-specific usage — with color-coded bars and reset countdown timers. Also includes context window tracking, git status, weather, Bitcoin price, and more.

**Cross-platform:** Works on Windows, macOS, and Linux with no platform-specific dependencies.

## Preview

```
🤖 Sonnet 4.5 │ ⚡ │ 📁 my-project │ 🌿 main* │ 📅 02/06/26 │ ⏰ 20:15 │ 📆 Thu │ ☀️ +42°F │ ₿$97k │ 🔧 2.1.0
Ctx: ● ▓▓░░░░ 12% [24K/200K] │ 5h: ▓▓▓░░ 45% →14:30 │ Wk: ▓▓▓▓▓░ 78% →2d 5h │ Sn: ▓▓░░ 34%
```

**Line 1** — Model, directory, git branch, date/time, weather, BTC, version

**Line 2** — Your usage at a glance:

| Bar | What it shows |
|-----|---------------|
| `Ctx:` | Context window fill percentage with token count |
| `5h:` | 5-hour rolling rate limit usage + countdown to reset |
| `Wk:` | Weekly quota usage + countdown to reset |
| `Sn:` | Sonnet-specific weekly usage (hidden when 0%) |

All bars are color-coded: **green** < 70% | **yellow** 70–85% | **red** > 85%

---

## AI Agent Quick Install

> **For Claude Code, Codex, or any AI coding agent asked to "install this."**
> Follow these steps exactly. Do NOT overwrite the user's existing `settings.json` — merge the `statusLine` key into it.

### 1. Detect platform and resolve paths

```
# Resolve the ACTUAL home directory — never use a literal "USERNAME" placeholder
# Linux/Mac: HOME_DIR = $HOME        (e.g., /home/alice or /Users/alice)
# Windows:   HOME_DIR = $USERPROFILE  (e.g., C:\Users\alice)

STATUSLINE_DIR  = <HOME_DIR>/.claude/statusline
SETTINGS_FILE   = <HOME_DIR>/.claude/settings.json
CREDENTIALS_FILE = <HOME_DIR>/.claude/usage-credentials.json
SCRIPT_FILE     = <STATUSLINE_DIR>/enhanced-statusline.js
```

### 2. Download the script

```bash
mkdir -p "<STATUSLINE_DIR>"
curl -o "<SCRIPT_FILE>" https://raw.githubusercontent.com/aaronvstory/claude-code-enhanced-statusline/master/enhanced-statusline.js
```

### 3. Merge statusLine config into settings.json

Read the existing `settings.json` (create it if missing) and **add/merge** this key — do not replace the file:

```json
{
  "statusLine": {
    "command": "node <SCRIPT_FILE_WITH_FORWARD_SLASHES>",
    "type": "command"
  }
}
```

Always use forward slashes, even on Windows: `node C:/Users/alice/.claude/statusline/enhanced-statusline.js`

### 4. Set up quota tracking credentials

This is the main feature. The user needs to provide two values from their browser — walk them through it:

**Create the file** `<CREDENTIALS_FILE>` (i.e., `~/.claude/usage-credentials.json`):

```json
{
  "sessionKey": "<value from step A>",
  "orgId": "<value from step B>"
}
```

**Tell the user exactly this:**

> **A) Get your sessionKey:**
> 1. Open **[claude.ai](https://claude.ai)** in Chrome/Edge/Firefox and make sure you're logged in
> 2. Press **F12** to open DevTools
> 3. Click the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
> 4. In the left sidebar, expand **Cookies** → click **https://claude.ai**
> 5. Find the row named **`sessionKey`** — copy the **Value** column (it's a long string starting with `sk-ant-`)
>
> **B) Get your orgId:**
> 1. On [claude.ai](https://claude.ai), look at the URL in your browser's address bar
> 2. It looks like: `https://claude.ai/chat/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
> 3. That UUID after `/chat/` is your orgId — copy it
> 4. Alternative: go to claude.ai → Settings → Organization — the ID is shown there

**After the user provides both values**, write them to the credentials file and confirm:
- The file must be at `~/.claude/usage-credentials.json` (the script reads from this exact path)
- The `sessionKey` expires periodically — if quota bars stop showing, the user just needs to re-copy it from their browser

### 5. Weather location (optional)

Edit the `WEATHER_CONFIG` object near line 50 of `enhanced-statusline.js` to set the user's location. If skipped, New York defaults work fine.

### 6. Restart Claude Code

Tell the user to quit and relaunch Claude Code. Both lines of the statusline will appear immediately. The `5h:`, `Wk:`, and `Sn:` bars will populate within a few seconds once the API call completes.

---

## Installation (Manual)

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- Node.js (bundled with Claude Code)

### Step 1: Download the Script

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

### Step 2: Configure Claude Code

Add the `statusLine` key to your `~/.claude/settings.json` (create the file if it doesn't exist — but don't overwrite other settings if it does):

**Linux/Mac:**
```json
{
  "statusLine": {
    "command": "node /home/username/.claude/statusline/enhanced-statusline.js",
    "type": "command"
  }
}
```

**Windows:**
```json
{
  "statusLine": {
    "command": "node C:/Users/USERNAME/.claude/statusline/enhanced-statusline.js",
    "type": "command"
  }
}
```

Replace `username`/`USERNAME` with your actual username.

### Step 3: Set Up Quota Tracking

Create `~/.claude/usage-credentials.json` with your Claude API credentials:

```json
{
  "sessionKey": "sk-ant-...",
  "orgId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**How to get your sessionKey:**
1. Go to [claude.ai](https://claude.ai) in your browser and log in
2. Open DevTools — press **F12**
3. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
4. Expand **Cookies** in the left sidebar → click **https://claude.ai**
5. Find the row named `sessionKey` → copy the **Value** (starts with `sk-ant-`)

**How to get your orgId:**
1. On [claude.ai](https://claude.ai), look at your browser's address bar
2. The URL looks like: `https://claude.ai/chat/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
3. That UUID after `/chat/` is your orgId
4. Or: go to **Settings** → **Organization** on claude.ai

> **The sessionKey expires periodically.** If the `5h:` / `Wk:` / `Sn:` bars disappear, just re-copy the sessionKey from your browser. Everything else continues working.

### Step 4: Configure Weather (Optional)

Edit `enhanced-statusline.js` and update the `WEATHER_CONFIG` section (around line 50):

```javascript
const WEATHER_CONFIG = {
  zipCode: "10001",           // Your zip code
  cityName: "New York,NY",   // Your city
  latitude: 40.7128,         // Your latitude (fallback)
  longitude: -74.006,        // Your longitude (fallback)
  defaultLocation: "New York" // Display name
};
```

### Step 5: Restart Claude Code

Quit Claude Code completely and relaunch. You'll see both lines immediately. The quota bars (`5h:`, `Wk:`, `Sn:`) appear within a few seconds after the first API call.

---

## Features

### API Quota Tracking

The main feature. Shows your real-time Claude API usage on the second line:

- **`5h:` — 5-hour rolling window**: How much of your rate limit you've used, with a countdown timer showing when it resets
- **`Wk:` — Weekly quota**: Your weekly usage percentage with time-until-reset (e.g., `→2d 5h`)
- **`Sn:` — Sonnet usage**: Sonnet-specific weekly quota (only shown when > 0%)
- Fetches from the Claude API with 60-second caching to minimize requests
- Cross-platform: uses `curl` on Windows (bypasses Cloudflare), native HTTPS on macOS/Linux

### Context Window Tracking

- Reads actual token usage from Claude Code transcript files
- Includes input + cache creation + cache read + output tokens
- 1.2x overhead multiplier for accurate estimation (accounts for MCP tool schemas, system prompts, plugin configs)
- `●` (green) = real transcript data, `~` (yellow) = estimated

### Git Integration

- Current branch name with `*` for uncommitted changes
- Auto-detects git repositories

### Weather & Bitcoin

- Weather from [wttr.in](https://wttr.in) with smart emoji (30-min cache)
- BTC/USD from Coinbase API (15-min cache)

### Performance

- < 100ms startup with cached data
- HTTP connection pooling + exponential backoff
- Async background fetching for all data sources

---

## Configuration

### Cache Durations

```javascript
const WEATHER_CACHE_DURATION = 30 * 60 * 1000;  // 30 minutes
const BITCOIN_CACHE_DURATION = 15 * 60 * 1000;  // 15 minutes
const USAGE_API_CACHE_DURATION = 60 * 1000;      // 60 seconds (quota API)
```

### Token Limits

```javascript
const TOKEN_LIMITS = {
  opus: 200000,
  "claude-3-opus": 200000,
  "claude-3-sonnet": 200000,
  "claude-3-haiku": 200000,
  default: 200000,
};
```

---

## Troubleshooting

### Quota bars not showing (`5h:`, `Wk:`, `Sn:` missing)

This means the API call isn't returning data. Check in order:

1. **File exists?** — Verify `~/.claude/usage-credentials.json` is present
2. **Valid JSON?** — No trailing commas, both keys in double quotes
3. **sessionKey fresh?** — Re-copy from browser cookies (it expires)
4. **orgId correct?** — Should be a UUID from the claude.ai URL
5. **Debug it** — Enable debug mode and check for API errors:
   ```bash
   export DEBUG_STATUSLINE=1   # Linux/Mac
   $env:DEBUG_STATUSLINE=1     # Windows PowerShell
   claude
   ```
   Then check the debug file in your temp directory for `[DEBUG] Claude API Usage` or error messages.

### Weather shows "--°"

1. Check internet connection
2. Verify [wttr.in](https://wttr.in) is accessible
3. Try different location format in `WEATHER_CONFIG`

### Token usage shows "~" instead of "●"

Normal on first launch. After one Claude interaction, it reads the transcript and switches to real data.

### Version shows "?.?.?"

Normal if `claude` isn't in your PATH. Cosmetic only.

---

## Debug Mode

```bash
# Linux/Mac
export DEBUG_STATUSLINE=1 && claude

# Windows PowerShell
$env:DEBUG_STATUSLINE=1; claude
```

Debug output goes to `claude-statusline-debug.json` in your temp directory (`$TMPDIR` on Mac, `/tmp` on Linux, `%TEMP%` on Windows).

```bash
# Test token calculation without launching Claude
node enhanced-statusline.js --test
```

---

## Changelog

### v2.0.0

- **API quota tracking**: real-time 5-hour, weekly, and Sonnet usage bars with reset timers
- Cross-platform API fetching (Windows curl + macOS/Linux HTTPS)
- 1.2x overhead multiplier for accurate context window calculation
- Output tokens included in context calculation
- 60-second API cache
- Color-coded bars with reset countdown timers

### v1.0.0

- Real token tracking from Claude Code transcript files
- Git branch integration
- Weather API with caching
- Bitcoin price tracking
- Multi-platform support (Windows, Linux, Mac)
- Debug mode

## License

MIT License — feel free to modify and distribute.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a Pull Request
