# Enhanced Claude Code Status Line

A feature-rich, two-line status bar for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with real-time model info, git status, weather, Bitcoin price, and **API quota tracking** (5-hour, weekly, and Sonnet usage bars with reset timers).

## Preview

```
Line 1:  🤖 Sonnet 4.5 │ ⚡ │ 📁 my-project │ 🌿 main* │ 📅 02/06/26 │ ⏰ 20:15 │ 📆 Thu │ ☀️ +42°F │ ₿$97k │ 🔧 2.1.0
Line 2:  Ctx: ● ▓▓░░░░ 12% [24K/200K] │ 5h: ▓▓▓░░ 45% →14:30 │ Wk: ▓▓▓▓▓░ 78% →2d 5h │ Sn: ▓▓░░ 34%
```

### What You See

**Line 1 — Info Bar:**

| Segment | Description |
|---------|-------------|
| 🤖 **Model** | Current Claude model (Sonnet 4.5, Opus, Haiku) |
| ⚡ | Visual separator |
| 📁 **Directory** | Current working directory |
| 🌿 **Git Branch** | Branch name + `*` if uncommitted changes |
| 📅 **Date** | MM/DD/YY |
| ⏰ **Time** | HH:MM:SS |
| 📆 **Day** | Day of week |
| ☀️ **Weather** | Real-time temp + condition emoji |
| ₿ **Bitcoin** | BTC price in USD (thousands) |
| 🔧 **Version** | Claude Code version |

**Line 2 — Usage Bar:**

| Segment | Description |
|---------|-------------|
| `Ctx:` | Context window fill — `●` = real data, `~` = estimated |
| `5h:` | 5-hour rolling quota usage + reset countdown |
| `Wk:` | Weekly quota usage + reset countdown |
| `Sn:` | Sonnet-specific weekly usage (only shows when > 0%) |

All bars are color-coded: **green** < 70%, **yellow** 70–85%, **red** > 85%.

## Features

### Context Window Tracking

- Reads actual token usage from Claude Code transcript files
- Includes input + cache creation + cache read + output tokens
- 1.2x overhead multiplier for accurate context estimation (accounts for MCP schemas, system prompts)
- Visual indicator: `●` (green) = real data, `~` (yellow) = estimated

### API Quota Tracking

- **5-hour rolling window**: Shows how much of your 5-hour rate limit you've used, with a countdown to when it resets
- **Weekly quota**: Shows weekly usage percentage with time-until-reset
- **Sonnet-specific**: Separate bar for Sonnet model usage (hidden when 0%)
- Fetches from the Claude API with 60-second caching
- Cross-platform: uses `curl` on Windows, native HTTPS on macOS/Linux
- **Graceful degradation**: If credentials aren't configured, quota bars simply don't appear — everything else works normally

### Git Integration

- Current branch name with dirty-state indicator (`*`)
- Auto-detects git repositories

### Weather

- Real-time data from [wttr.in](https://wttr.in)
- Smart emoji: ☀️ ⛅ ☁️ 🌧️ ⛈️ ❄️ 🌫️
- 30-minute cache
- Fallback locations if primary fails

### Bitcoin Price

- Live BTC/USD from Coinbase API
- 15-minute cache
- Displayed in thousands (e.g., `$97k`)

### Performance

- < 100ms startup with cached data
- HTTP connection pooling + exponential backoff
- Async background fetching
- Smart caching across all data sources

## Installation

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- Node.js (bundled with Claude Code)
- Git (for branch detection)

### Step 1: Download the Script

```bash
# Create statusline directory inside your Claude config
mkdir -p ~/.claude/statusline
cd ~/.claude/statusline

# Download
curl -O https://raw.githubusercontent.com/aaronvstory/claude-code-enhanced-statusline/master/enhanced-statusline.js
```

On Windows:
```powershell
mkdir "$env:USERPROFILE\.claude\statusline" -Force
cd "$env:USERPROFILE\.claude\statusline"
curl -O https://raw.githubusercontent.com/aaronvstory/claude-code-enhanced-statusline/master/enhanced-statusline.js
```

### Step 2: Configure Claude Code

Add to your `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "command": "node /home/username/.claude/statusline/enhanced-statusline.js",
    "type": "command"
  }
}
```

**Windows path:**
```json
{
  "statusLine": {
    "command": "node C:/Users/USERNAME/.claude/statusline/enhanced-statusline.js",
    "type": "command"
  }
}
```

Replace `username`/`USERNAME` with your actual username.

### Step 3: Configure Your Location

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

### Step 4 (Optional): Set Up Quota Tracking

This step enables the `5h:`, `Wk:`, and `Sn:` bars on the second line. Skip this if you just want the context bar and info line.

Create `~/.claude/usage-credentials.json`:

```json
{
  "sessionKey": "YOUR_SESSION_KEY",
  "orgId": "YOUR_ORG_ID"
}
```

**How to get your sessionKey:**
1. Open [claude.ai](https://claude.ai) in your browser and log in
2. Open DevTools (F12) → **Application** tab → **Cookies** → `https://claude.ai`
3. Find the cookie named `sessionKey` and copy its value

**How to get your orgId:**
1. Log in to [claude.ai](https://claude.ai)
2. Look at the URL — it contains your org ID: `https://claude.ai/chat/ORG_ID`
3. Or go to **Settings** → **Organization** to find it

> **Note:** The `sessionKey` expires periodically. If quota bars stop appearing, refresh the key.

> **Security:** `usage-credentials.json` is in `.gitignore` — it will never be committed to this repo.

### Step 5: Restart Claude Code

Quit Claude Code completely and relaunch. You should see both lines of the status bar.

## Configuration

### Weather Location

Update `WEATHER_CONFIG` in `enhanced-statusline.js` with your location. You can use zip code, city name, or coordinates.

### Token Limits

Adjust model-specific context limits in the `TOKEN_LIMITS` object:

```javascript
const TOKEN_LIMITS = {
  opus: 200000,
  "claude-3-opus": 200000,
  "claude-3-sonnet": 200000,
  "claude-3-haiku": 200000,
  default: 200000,
};
```

### Cache Durations

```javascript
const WEATHER_CACHE_DURATION = 30 * 60 * 1000;  // 30 minutes
const BITCOIN_CACHE_DURATION = 15 * 60 * 1000;  // 15 minutes
const USAGE_API_CACHE_DURATION = 60 * 1000;      // 60 seconds (quota data)
```

## Troubleshooting

### Quota bars not showing (`5h:`, `Wk:`, `Sn:` missing)

1. Verify `~/.claude/usage-credentials.json` exists and is valid JSON
2. Check that `sessionKey` hasn't expired — re-copy from browser cookies
3. Check that `orgId` is correct
4. Enable debug mode (below) and check for API errors in the debug file

### Weather shows "--°"

1. Check your internet connection
2. Verify [wttr.in](https://wttr.in) is accessible
3. Try a different location format (zip, city name, or coordinates)
4. Clear cache: delete `claude-statusline-weather.json` in your temp directory

### Bitcoin shows "₿--k"

1. Check internet connection
2. Verify Coinbase API: visit `https://api.coinbase.com/v2/exchange-rates?currency=BTC`

### Token usage shows "~" instead of "●"

Normal for the first message. After one interaction, it switches to real data (`●`).

### Version shows "?.?.?"

Normal if `claude` isn't in your PATH. The statusline still works fine without it.

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

Debug output is written to `claude-statusline-debug.json` in your temp directory.

### Test Token Calculation

```bash
node enhanced-statusline.js --test
```

## Changelog

### v2.0.0

- Cross-platform API usage tracking (5-hour, weekly, Sonnet quotas)
- Color-coded quota bars with reset countdown timers
- 1.2x overhead multiplier for accurate context window calculation
- Output tokens included in context calculation
- Windows `curl` support for Cloudflare bypass
- 60-second API cache to minimize requests
- Graceful degradation when credentials aren't configured

### v1.0.0 (Initial Release)

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
