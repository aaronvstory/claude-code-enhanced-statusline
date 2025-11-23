#!/usr/bin/env node

/**
 * Enhanced Claude Code Status Line - Real Token Tracking Edition
 * Professional status line with weather, git info, Bitcoin price, Claude Code version, and REAL token usage
 *
 * Features:
 * - Real token usage from Claude Code transcript files (input_tokens + cache_creation_input_tokens + cache_read_input_tokens)
 * - Weather integration with 30-minute caching
 * - Bitcoin price tracking with 15-minute caching
 * - Git branch and status display
 * - Context window progress bar with actual token counts
 * - Visual indicator: ● (bright green) = real data, ~ (dimmed yellow) = estimated data
 * - Updates dynamically after each message with accurate percentages
 *
 * Configure your zip code/location in the weather section below
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const os = require('os');

// ANSI color codes for terminal styling
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m'
};

// ========================================
// CONFIGURATION SECTION - CUSTOMIZE HERE
// ========================================

// Weather Configuration - Change to your location!
const WEATHER_CONFIG = {
    zipCode: '10001',              // Your zip code (e.g., '10001' for New York)
    cityName: 'New York,NY',       // Your city and state (e.g., 'New York,NY')
    latitude: 40.7128,             // Your latitude (optional, for fallback)
    longitude: -74.0060,           // Your longitude (optional, for fallback)
    defaultLocation: 'New York'    // Display name when location unknown
};

// ========================================
// END CONFIGURATION SECTION
// ========================================

// Function to create a progress bar for context window
function createProgressBar(percentage, width = 20) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    let color = colors.green;
    if (percentage > 70) color = colors.yellow;
    if (percentage > 85) color = colors.red;

    return `${color}${bar}${colors.reset} ${percentage.toFixed(1)}%`;
}

// Token estimation based on model type
const TOKEN_LIMITS = {
    'opus': 200000,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'claude-2.1': 200000,
    'claude-2': 100000,
    'claude-instant': 100000,
    'default': 200000
};

// Function to read actual token usage from Claude Code transcript
function getActualTokenUsage(data) {
    // Get model-specific token limit
    const modelId = data.model?.id || 'opus';
    const modelName = modelId.toLowerCase();
    let tokenLimit = TOKEN_LIMITS.default;

    for (const [key, limit] of Object.entries(TOKEN_LIMITS)) {
        if (modelName.includes(key)) {
            tokenLimit = limit;
            break;
        }
    }

    // Try to read the transcript file to get actual token usage
    const transcriptPath = data.transcript_path;
    if (transcriptPath && fs.existsSync(transcriptPath)) {
        try {
            const transcriptData = fs.readFileSync(transcriptPath, 'utf8');
            const lines = transcriptData.split('\n').filter(line => line.trim());

            let mostRecentUsage = null;
            let messageCount = 0;

            // Parse each message in the transcript to find the most recent assistant response with usage data
            for (const line of lines) {
                try {
                    const message = JSON.parse(line);

                    // Look for assistant messages with usage data
                    if (message.type === 'assistant' && message.message && message.message.usage) {
                        messageCount++;
                        mostRecentUsage = message.message.usage;
                    }
                } catch (parseError) {
                    // Skip invalid JSON lines
                    continue;
                }
            }

            // If we found actual usage data, calculate real context usage
            if (mostRecentUsage) {
                // Calculate total context usage as Claude Code does:
                // Total = input_tokens + cache_creation_input_tokens + cache_read_input_tokens
                const inputTokens = mostRecentUsage.input_tokens || 0;
                const cacheCreationTokens = mostRecentUsage.cache_creation_input_tokens || 0;
                const cacheReadTokens = mostRecentUsage.cache_read_input_tokens || 0;

                const contextUsed = inputTokens + cacheCreationTokens + cacheReadTokens;
                const percentage = (contextUsed / tokenLimit) * 100;

                // Debug logging if enabled
                if (process.env.DEBUG_STATUSLINE) {
                    console.error(`[DEBUG] REAL Token Usage:
                      Input tokens: ${inputTokens}
                      Cache creation tokens: ${cacheCreationTokens}
                      Cache read tokens: ${cacheReadTokens}
                      Total context used: ${contextUsed}
                      Token limit: ${tokenLimit}
                      Percentage: ${percentage.toFixed(2)}%
                      Messages: ${messageCount}`);
                }

                return {
                    percentage: percentage,
                    used: contextUsed,
                    limit: tokenLimit,
                    isActual: true,
                    debug: {
                        inputTokens,
                        cacheCreationTokens,
                        cacheReadTokens,
                        messageCount,
                        totalContext: contextUsed
                    }
                };
            }

        } catch (error) {
            // Fall back to estimation if transcript reading fails
            console.error('Error reading transcript for token usage:', error.message);
        }
    }

    // Fallback to estimation if transcript not available
    return estimateContextUsageFallback(data, tokenLimit);
}

// Fallback estimation function (simplified version of old function)
function estimateContextUsageFallback(data, tokenLimit) {
    const sessionId = data.session_id || '';

    // More realistic estimation for new conversations
    // Most conversations start small and grow gradually
    const sessionHash = sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Start with a small base (1-5% for new conversations)
    const basePercentage = 1 + (sessionHash % 4); // 1-5% base

    // Add modest growth based on session characteristics
    const sessionLength = sessionId.length;
    const lengthBoost = Math.min(10, sessionLength * 0.2); // Up to 10% based on session ID length

    let percentage = basePercentage + lengthBoost;

    // Clamp to realistic range for most conversations
    percentage = Math.max(0.5, Math.min(25, percentage)); // 0.5% to 25% range

    // Convert percentage to actual token count
    const estimatedUsed = Math.floor((percentage / 100) * tokenLimit);

    // Ensure minimum realistic token usage (at least 1K for any active conversation)
    const minimumUsed = Math.max(estimatedUsed, 1000);
    const finalPercentage = (minimumUsed / tokenLimit) * 100;

    return {
        percentage: finalPercentage,
        used: minimumUsed,
        limit: tokenLimit,
        isActual: false
    };
}

// Function to get git branch info
function getGitBranch(dir) {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', {
            cwd: dir,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();

        // Check if there are uncommitted changes
        const status = execSync('git status --porcelain', {
            cwd: dir,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();

        const isDirty = status.length > 0;
        return `🌿 ${branch}${isDirty ? '*' : ''}`;
    } catch (error) {
        return null;
    }
}

// Weather cache configuration
const WEATHER_CACHE_FILE = path.join(os.tmpdir(), 'claude-statusline-weather.json');
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const CACHE_VERSION = '1.0'; // Cache version for invalidation

// Bitcoin cache configuration
const BITCOIN_CACHE_FILE = path.join(os.tmpdir(), 'claude-statusline-bitcoin.json');
const BITCOIN_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// HTTP agent for connection pooling
const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 5,
    keepAliveMsecs: 30000
});

// Function to make HTTPS requests with timeout and retry logic
async function httpsRequestWithRetry(url, maxRetries = 3, timeout = 3000) {
    let lastError;
    let delay = 100; // Initial delay for exponential backoff

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                // Exponential backoff: 100ms, 200ms, 400ms
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }

            const data = await httpsRequest(url, timeout);
            return data;
        } catch (error) {
            lastError = error;
            // Continue to next retry
        }
    }

    throw lastError;
}

// Function to make HTTPS requests with timeout
function httpsRequest(url, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            timeout,
            agent: httpsAgent
        };

        const req = https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.on('error', reject);
    });
}

// Function to get Bitcoin price
async function getBitcoinPrice() {
    try {
        // Check cache first
        const cached = getCachedBitcoin();
        if (cached) {
            return cached;
        }

        // Fetch from Coinbase API with retry logic
        const response = await httpsRequestWithRetry('https://api.coinbase.com/v2/exchange-rates?currency=BTC', 3, 3000);
        const data = JSON.parse(response);

        const price = parseFloat(data.data.rates.USD);
        const formatted = `₿$${(price / 1000).toFixed(0)}k`;

        // Cache the result
        cacheBitcoin(formatted);
        return formatted;

    } catch (error) {
        return '₿--k';
    }
}

// Function to get cached Bitcoin data
function getCachedBitcoin() {
    try {
        if (fs.existsSync(BITCOIN_CACHE_FILE)) {
            const cached = JSON.parse(fs.readFileSync(BITCOIN_CACHE_FILE, 'utf8'));
            const now = Date.now();

            if (now - cached.timestamp < BITCOIN_CACHE_DURATION) {
                return cached.data;
            }
        }
    } catch (error) {
        // Ignore cache errors and fetch fresh data
    }
    return null;
}

// Function to cache Bitcoin data
function cacheBitcoin(bitcoinData) {
    try {
        const cacheData = {
            timestamp: Date.now(),
            data: bitcoinData
        };
        fs.writeFileSync(BITCOIN_CACHE_FILE, JSON.stringify(cacheData));
    } catch (error) {
        // Ignore cache write errors
    }
}

// Function to get cached weather data
function getCachedWeather() {
    try {
        if (fs.existsSync(WEATHER_CACHE_FILE)) {
            const cached = JSON.parse(fs.readFileSync(WEATHER_CACHE_FILE, 'utf8'));
            const now = Date.now();

            // Check cache version and expiration
            if (cached.version === CACHE_VERSION && now - cached.timestamp < WEATHER_CACHE_DURATION) {
                return cached.data;
            }
        }
    } catch (error) {
        // Ignore cache errors and fetch fresh data
    }
    return null;
}

// Function to cache weather data
function cacheWeather(weatherData) {
    try {
        const cacheData = {
            timestamp: Date.now(),
            version: CACHE_VERSION,
            data: weatherData
        };
        fs.writeFileSync(WEATHER_CACHE_FILE, JSON.stringify(cacheData));
    } catch (error) {
        // Ignore cache write errors
    }
}

// Function to fetch real weather data
async function fetchRealWeather() {
    try {
        // Check cache first
        const cached = getCachedWeather();
        if (cached) {
            return cached;
        }

        // Try multiple approaches for better reliability
        let weatherData = null;
        let error = null;

        // Primary: Try zip code with retry logic
        try {
            const response1 = await httpsRequestWithRetry(`https://wttr.in/${WEATHER_CONFIG.zipCode}?format=%t|%C|%l&u&q`, 2, 3000);
            weatherData = response1.trim();
            if (weatherData && !weatherData.includes('Unknown location') && !weatherData.includes('not found')) {
                // Success with zip code
            } else {
                throw new Error('Invalid response from zip code');
            }
        } catch (err) {
            error = err;

            // Fallback: Try city name
            try {
                const response2 = await httpsRequestWithRetry(`https://wttr.in/${WEATHER_CONFIG.cityName}?format=%t|%C|%l&u&q`, 2, 3000);
                weatherData = response2.trim();
                if (!weatherData || weatherData.includes('Unknown location') || weatherData.includes('not found')) {
                    throw new Error('Invalid response from city name');
                }
            } catch (err2) {
                // Final fallback: Try coordinates
                try {
                    const response3 = await httpsRequestWithRetry(`https://wttr.in/${WEATHER_CONFIG.latitude},${WEATHER_CONFIG.longitude}?format=%t|%C|%l&u&q`, 2, 3000);
                    weatherData = response3.trim();
                    if (!weatherData || weatherData.includes('Unknown location') || weatherData.includes('not found')) {
                        throw new Error('All weather sources failed');
                    }
                } catch (err3) {
                    throw new Error('All weather sources failed');
                }
            }
        }

        const [temp, condition, location] = weatherData.split('|');

        // Validate the temperature format
        if (!temp || !temp.trim().match(/[+-]?\d+°[FC]/)) {
            throw new Error('Invalid temperature format');
        }

        // Get weather emoji based on condition
        const weatherEmoji = getWeatherEmoji(condition || 'Unknown');

        const formattedWeather = {
            display: `${weatherEmoji} ${temp.trim()}`,
            condition: (condition || 'Unknown').trim(),
            location: (location || WEATHER_CONFIG.defaultLocation).trim()
        };

        // Cache the result
        cacheWeather(formattedWeather);

        return formattedWeather;

    } catch (error) {
        // Return fallback weather but with more informative display
        return {
            display: '🌡️ --°F',
            condition: 'Unknown',
            location: WEATHER_CONFIG.defaultLocation
        };
    }
}

// Function to get weather emoji based on condition
function getWeatherEmoji(condition) {
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
        return '☀️';
    } else if (conditionLower.includes('partly cloudy') || conditionLower.includes('partial')) {
        return '⛅';
    } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
        return '☁️';
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
        return '🌧️';
    } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
        return '⛈️';
    } else if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) {
        return '❄️';
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
        return '🌫️';
    } else if (conditionLower.includes('wind')) {
        return '💨';
    } else {
        return '🌡️';
    }
}

// Function to get weather (with real API integration)
function getWeather() {
    // Return cached weather synchronously if available, otherwise return fallback
    const cached = getCachedWeather();
    if (cached) {
        return cached.display;
    }

    // Start async fetch in background but don't wait for it
    fetchRealWeather().catch(() => {
        // Ignore errors in background fetch
    });

    return '🌡️ --°'; // Fallback while loading
}

// Function to format date and time
function getDateTime() {
    const now = new Date();

    // Date format: MM/DD/YY
    const date = now.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
    });

    // Time format: HH:MM:SS
    const time = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Day of week (abbreviated)
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'short' });

    return {
        date,
        time,
        dayOfWeek
    };
}

// Main function to generate status line
async function generateStatusLine() {
    let input = '';

    return new Promise((resolve) => {
        // Read from stdin
        process.stdin.setEncoding('utf8');

        process.stdin.on('readable', () => {
            const chunk = process.stdin.read();
            if (chunk !== null) {
                input += chunk;
            }
        });

        process.stdin.on('end', async () => {
            try {
                const data = input ? JSON.parse(input) : {};

                // Debug mode: Log the data structure to understand what Claude Code sends
                // Set DEBUG_STATUSLINE=1 environment variable to enable debug logging
                if (process.env.DEBUG_STATUSLINE) {
                    const debugData = {
                        timestamp: new Date().toISOString(),
                        inputData: data,
                        transcriptExists: data.transcript_path && fs.existsSync(data.transcript_path),
                        transcriptPath: data.transcript_path
                    };
                    fs.writeFileSync(path.join(os.tmpdir(), 'claude-statusline-debug.json'), JSON.stringify(debugData, null, 2));
                }

                // Extract information
                const model = data.model?.display_name || 'Opus 4.1';
                const currentDir = data.workspace?.current_dir || process.cwd();
                const dirName = path.basename(currentDir);
                const contextUsage = getActualTokenUsage(data);
                const dateTime = getDateTime();
                const gitBranch = getGitBranch(currentDir);

                // Get weather - try to fetch fresh if cache is empty, but don't wait long
                let weather = getWeather();

                // If we don't have cached weather, try a quick fetch
                if (weather === '🌡️ --°') {
                    try {
                        const freshWeather = await Promise.race([
                            fetchRealWeather(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
                        ]);
                        weather = freshWeather.display;
                    } catch (error) {
                        // Keep fallback weather if fetch fails or times out
                    }
                }

                // Get Bitcoin price - try to fetch fresh if no cache available
                let btcPrice = getCachedBitcoin();
                if (!btcPrice) {
                    try {
                        // Try a quick fetch if no cached data
                        btcPrice = await Promise.race([
                            getBitcoinPrice(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
                        ]);
                    } catch (error) {
                        btcPrice = '₿--k';
                        // Start background fetch for next time
                        getBitcoinPrice().catch(() => {});
                    }
                } else {
                    // Start background fetch to refresh cache
                    getBitcoinPrice().catch(() => {});
                }

                // Build status line components
                const statusComponents = [
                    `${colors.bright}${colors.cyan}🤖 ${model}${colors.reset}`,
                    `${colors.bright}${colors.yellow}⚡${colors.reset}`, // Lightning bolt separator
                    `${colors.blue}📁 ${dirName}${colors.reset}`
                ];

                // Add git branch if available
                if (gitBranch) {
                    statusComponents.push(`${colors.green}${gitBranch}${colors.reset}`);
                }

                // Add date and time components
                statusComponents.push(`${colors.magenta}📅 ${dateTime.date}${colors.reset}`);
                statusComponents.push(`${colors.yellow}⏰ ${dateTime.time}${colors.reset}`);
                statusComponents.push(`${colors.cyan}📆 ${dateTime.dayOfWeek}${colors.reset}`);
                statusComponents.push(`${colors.green}${weather}${colors.reset}`);

                // Add Bitcoin price with yellow color
                statusComponents.push(`${colors.yellow}${btcPrice}${colors.reset}`);

                // Add Claude Code version - detect NPM vs native installation
                let version = data.version || null;
                if (!version) {
                    try {
                        // Try multiple methods to get Claude version
                        try {
                            // Method 1: Try claude --version
                            const claudeVersion = execSync('claude --version 2>&1', {
                                encoding: 'utf8',
                                stdio: ['ignore', 'pipe', 'ignore'],
                                timeout: 2000,
                                windowsHide: true
                            }).trim();

                            // Extract version number from various formats
                            const versionMatch = claudeVersion.match(/(?:claude\/)?v?(\d+\.\d+\.\d+)/);
                            if (versionMatch) {
                                version = versionMatch[1];
                            }
                        } catch (error) {
                            // Method 2: Try to get from NPM global packages
                            try {
                                const isWindows = os.platform() === 'win32';
                                const npmCmd = isWindows
                                    ? 'npm list -g --depth=0 2>&1 | findstr "@anthropic-ai/claude-code"'
                                    : 'npm list -g --depth=0 2>&1 | grep "@anthropic-ai/claude-code"';

                                const npmList = execSync(npmCmd, {
                                    encoding: 'utf8',
                                    stdio: ['ignore', 'pipe', 'ignore'],
                                    timeout: 3000,
                                    windowsHide: true,
                                    shell: true
                                }).trim();

                                // Extract version from npm list output like "@anthropic-ai/claude-code@1.0.88"
                                const npmMatch = npmList.match(/@anthropic-ai\/claude-code@(\d+\.\d+\.\d+)/);
                                if (npmMatch) {
                                    version = npmMatch[1];
                                } else {
                                    // Try another pattern
                                    const altMatch = npmList.match(/(\d+\.\d+\.\d+)/);
                                    if (altMatch) {
                                        version = altMatch[1];
                                    }
                                }
                            } catch (npmError) {
                                // Keep the default fallback
                            }
                        }
                    } catch (error) {
                        // Final fallback
                        version = '?.?.?';
                    }
                }
                statusComponents.push(`${colors.magenta}🔧 ${version}${colors.reset}`);

                // Context usage on second line with token counter
                // Format tokens with K suffix for thousands
                const formatTokens = (num) => {
                    if (num >= 1000) {
                        return `${(num / 1000).toFixed(0)}K`;
                    }
                    return num.toString();
                };

                const tokenDisplay = `${colors.dim}[${formatTokens(contextUsage.used)}/${formatTokens(contextUsage.limit)}]${colors.reset}`;

                // More descriptive indicators for data source
                let indicator;
                if (contextUsage.isActual) {
                    indicator = `${colors.bright}${colors.green}●${colors.reset}`; // Bright green for real data
                } else {
                    indicator = `${colors.dim}${colors.yellow}~${colors.reset}`; // Dimmed yellow for estimated
                }

                const contextLine = `${colors.dim}Context:${colors.reset} ${indicator} ${createProgressBar(contextUsage.percentage)} ${tokenDisplay}`;

                // Combine everything
                const mainStatusLine = statusComponents.join(' │ ');

                // Output the status lines
                console.log(mainStatusLine);
                console.log(contextLine);

                resolve();

            } catch (error) {
                // Fallback if JSON parsing fails
                const fallbackDateTime = getDateTime();
                const fallbackDir = path.basename(process.cwd());
                const fallbackGit = getGitBranch(process.cwd());
                const fallbackWeather = getWeather();
                const fallbackBtc = getCachedBitcoin() || '₿--k';

                const fallbackComponents = [
                    `${colors.cyan}🤖 Opus 4.1${colors.reset}`,
                    `${colors.yellow}⚡${colors.reset}`,
                    `${colors.blue}📁 ${fallbackDir}${colors.reset}`
                ];

                if (fallbackGit) {
                    fallbackComponents.push(`${colors.green}${fallbackGit}${colors.reset}`);
                }

                fallbackComponents.push(`${colors.magenta}📅 ${fallbackDateTime.date}${colors.reset}`);
                fallbackComponents.push(`${colors.yellow}⏰ ${fallbackDateTime.time}${colors.reset}`);
                fallbackComponents.push(`${colors.cyan}📆 ${fallbackDateTime.dayOfWeek}${colors.reset}`);
                fallbackComponents.push(`${colors.green}${fallbackWeather}${colors.reset}`);
                fallbackComponents.push(`${colors.yellow}${fallbackBtc}${colors.reset}`);

                // Try to get version even in fallback mode
                let fallbackVersion = '?.?.?';
                try {
                    const claudeVersion = execSync('claude --version', {
                        encoding: 'utf8',
                        stdio: ['ignore', 'pipe', 'ignore'],
                        timeout: 2000
                    }).trim();
                    const versionMatch = claudeVersion.match(/(?:claude\/)?(\d+\.\d+\.\d+)/);
                    if (versionMatch) {
                        fallbackVersion = versionMatch[1];
                    }
                } catch (error) {
                    // Keep default fallback
                }
                fallbackComponents.push(`${colors.magenta}🔧 ${fallbackVersion}${colors.reset}`);

                console.log(fallbackComponents.join(' │ '));
                console.log(`${colors.dim}Context:${colors.reset} ${colors.dim}${colors.yellow}~${colors.reset} ${createProgressBar(10)} ${colors.dim}[20K/200K]${colors.reset}`);

                resolve();
            }
        });
    });
}

// Preload weather and Bitcoin data in background on script startup
function preloadData() {
    // Only fetch if cache is expired or missing
    const cachedWeather = getCachedWeather();
    if (!cachedWeather) {
        fetchRealWeather().catch(() => {
            // Ignore errors in background preload
        });
    }

    // Preload Bitcoin price if not cached
    const cachedBitcoin = getCachedBitcoin();
    if (!cachedBitcoin) {
        getBitcoinPrice().catch(() => {
            // Ignore errors in background preload
        });
    }
}

// Test function for debugging token calculations
function testTokenCalculation() {
    // Test with mock data
    const mockData = {
        model: { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet' },
        session_id: 'test-session-123',
        transcript_path: null, // Force fallback estimation
        workspace: { current_dir: process.cwd() },
        version: 'v1.0.0'
    };

    const result = getActualTokenUsage(mockData);
    console.log('Token calculation test result:');
    console.log(`  Used: ${result.used} tokens`);
    console.log(`  Limit: ${result.limit} tokens`);
    console.log(`  Percentage: ${result.percentage.toFixed(2)}%`);
    console.log(`  Is actual: ${result.isActual}`);
    console.log(`  Formatted: ${result.used >= 1000 ? `${(result.used / 1000).toFixed(0)}K` : result.used}/${result.limit >= 1000 ? `${(result.limit / 1000).toFixed(0)}K` : result.limit}`);
}

// Run the status line generator or test
if (require.main === module) {
    // Check for test mode
    if (process.argv.includes('--test')) {
        testTokenCalculation();
        return;
    }

    // Start data preload in background
    preloadData();

    // Generate status line
    generateStatusLine().catch(console.error);
}

module.exports = { generateStatusLine, colors, createProgressBar, fetchRealWeather, getCachedWeather, getBitcoinPrice };
