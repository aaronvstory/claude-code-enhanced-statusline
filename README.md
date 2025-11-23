# Enhanced Claude Code Status Line

A feature-rich, professional status line for [Claude Code](https://claude.ai/claude-code) that displays real-time information including model info, git status, date/time, weather, Bitcoin price, and accurate token usage tracking.

## Preview

```
🤖 Sonnet 4.5 │ ⚡ │ 📁 .claude │ 🌿 master* │ 📅 11/22/25 │ ⏰ 23:04:33 │ 📆 Sat │ ☀️ +60°F │ ₿$86k │ 🔧 2.0.50
Context: ● ██░░░░░░░░░░░░░░░░░░ 9.2% [18K/200K] | ⏱ 2s
```

### What You See

**Top Line:**
- 🤖 **Model**: Current Claude model (Sonnet 4.5, Opus, Haiku)
- ⚡ **Separator**: Visual divider
- 📁 **Directory**: Current working directory
- 🌿 **Git Branch**: Current branch with uncommitted changes indicator (*)
- 📅 **Date**: Current date (MM/DD/YY)
- ⏰ **Time**: Current time (HH:MM:SS)
- 📆 **Day**: Day of week
- ☀️ **Weather**: Real-time weather with emoji and temperature
- ₿ **Bitcoin**: Current BTC price in USD
- 🔧 **Version**: Claude Code version

**Bottom Line:**
- **Context Usage**: Visual progress bar showing token usage
- **● (green)**: Real token data from Claude API
- **~ (yellow)**: Estimated token data
- **Progress Bar**: Color-coded (green → yellow → red as usage increases)
- **Token Count**: Current/Total tokens (e.g., [18K/200K])

## Features

### 🎯 Core Features

- **Real Token Tracking**: Reads actual token usage from Claude Code transcript files
  - Includes input tokens + cache creation tokens + cache read tokens
  - Visual indicator shows whether data is real (●) or estimated (~)
  - Color-coded progress bar (green < 70%, yellow 70-85%, red > 85%)

- **Git Integration**: Shows current branch and uncommitted changes
  - Automatically detects git repository
  - Shows `*` for dirty working directory

- **Real-Time Weather**:
  - Fetches from [wttr.in](https://wttr.in) API
  - Smart emoji based on conditions (☀️ ⛅ ☁️ 🌧️ ⛈️ ❄️ 🌫️)
  - 30-minute caching to reduce API calls
  - Fallback locations if primary fails

- **Bitcoin Price**:
  - Live BTC/USD rate from Coinbase API
  - 15-minute caching
  - Displays in thousands (e.g., $86k)

- **Performance Optimized**:
  - HTTP connection pooling
  - Exponential backoff retry logic
  - Async background data fetching
  - Smart caching system

## Installation

### Prerequisites

- [Claude Code](https://claude.ai/claude-code) installed
- Node.js (usually bundled with Claude Code)
- Git (for repository detection)

### Step 1: Download the Script

```bash
# Navigate to your Claude config directory
cd ~/.claude  # On Linux/Mac
cd C:\Users\USERNAME\.claude  # On Windows

# Create statusline directory
mkdir -p statusline
cd statusline

# Download the script
curl -O https://raw.githubusercontent.com/YOUR-USERNAME/claude-code-enhanced-statusline/main/enhanced-statusline.js

# Make it executable (Linux/Mac only)
chmod +x enhanced-statusline.js
```

### Step 2: Configure Claude Code

Add this to your `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "command": "node /path/to/.claude/statusline/enhanced-statusline.js",
    "type": "command"
  }
}
```

**Platform-specific paths:**
- **Linux/Mac**: `"node /home/username/.claude/statusline/enhanced-statusline.js"`
- **Windows**: `"node C:/Users/USERNAME/.claude/statusline/enhanced-statusline.js"`

### Step 3: Configure Your Location

Edit `enhanced-statusline.js` and update the weather configuration (lines 48-56):

```javascript
const WEATHER_CONFIG = {
    zipCode: '10001',              // Your zip code
    cityName: 'New York,NY',       // Your city
    latitude: 40.7128,             // Your latitude
    longitude: -74.0060,           // Your longitude
    defaultLocation: 'New York'    // Display name
};
```

### Step 4: Restart Claude Code

Quit Claude Code completely and relaunch it. You should see your new status line!

## Configuration

### Custom Colors

The script uses ANSI color codes. You can customize them by editing the `colors` object at the top of the script:

```javascript
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    // ... add more as needed
};
```

### Token Limits

If you're using different Claude models, you can adjust token limits in the `TOKEN_LIMITS` object:

```javascript
const TOKEN_LIMITS = {
    'opus': 200000,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'default': 200000
};
```

### Cache Duration

Adjust how often data refreshes:

```javascript
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const BITCOIN_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
```

## Troubleshooting

### Weather Shows "--°"

1. **Check your internet connection**
2. **Verify wttr.in is accessible**: Visit https://wttr.in in your browser
3. **Try different location format**:
   - Use zip code: `90001`
   - Use city name: `Los Angeles,CA`
   - Use coordinates: `34.0522,-118.2437`
4. **Check cache**: Delete `claude-statusline-weather.json` in your temp directory

### Bitcoin Shows "₿--k"

1. **Check internet connection**
2. **Verify Coinbase API**: Visit https://api.coinbase.com/v2/exchange-rates?currency=BTC
3. **Clear cache**: Delete `claude-statusline-bitcoin.json` in temp directory

### Token Usage Shows "~" (Estimated)

This is normal! The script shows:
- **● (green)**: Real data from Claude API responses
- **~ (yellow)**: Estimated data (used when transcript isn't available yet)

After your first message, it should switch to real data.

### Git Branch Not Showing

Make sure you're in a git repository:

```bash
git status  # Should show git info, not "not a git repository"
```

### Version Shows "v?.?.?"

The script tries multiple methods to detect Claude version. If none work:
- Ensure `claude` or `win-claude-code` is in your PATH
- Or manually set version in the script

## Debug Mode

Enable debug logging to troubleshoot issues:

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

This creates `claude-statusline-debug.json` in your temp directory with detailed information.

## Advanced Features

### Testing Token Calculation

Test the token calculation algorithm:

```bash
node enhanced-statusline.js --test
```

### Custom Weather Emoji

Modify the `getWeatherEmoji()` function to customize weather icons:

```javascript
function getWeatherEmoji(condition) {
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('sunny')) {
        return '☀️';  // Change this to any emoji
    }
    // ... more conditions
}
```

## Performance

- **Startup time**: < 100ms (with cached data)
- **API calls**: Minimal due to smart caching
  - Weather: Max 1 request per 30 minutes
  - Bitcoin: Max 1 request per 15 minutes
- **Memory usage**: ~10-15 MB
- **CPU usage**: Negligible

## Credits

Created for the Claude Code community. Inspired by various terminal status line projects.

## License

MIT License - Feel free to modify and distribute!

## Contributing

Found a bug or want to add a feature?

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### v1.0.0 (Initial Release)
- Real token tracking from Claude API
- Git branch integration
- Weather API integration with caching
- Bitcoin price tracking
- Multi-platform support (Windows, Linux, Mac)
- Performance optimizations
- Debug mode

## Support

If you find this useful, consider:
- Starring the repository
- Sharing with other Claude Code users
- Reporting issues or suggesting features

---

**Enjoy your enhanced Claude Code experience!** 🚀
