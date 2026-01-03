# Pick Google Calendar Event

> Seamlessly integrate your Google Calendar with Obsidian. Quickly insert calendar events into your notes with intelligent type-ahead search.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-orange?style=flat-square&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/rajeevrajchal)
[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)](https://github.com/rajeevrajchal/pmc)

## Features

### Event Insertion with Type-Ahead Search

- **Quick Access**: Type `:` in any note to trigger the calendar event picker
- **Smart Filtering**: Type `:meeting` to instantly filter events containing "meeting"
- **Multi-field Search**: Searches across event titles, descriptions, locations, and attendees
- **Rich Event Display**: View event details including date, time, location, and video conferencing links
- **One-Click Insert**: Select an event to insert it as a clickable link in your note

### Create New Events

- **In-app Creation**: Create new calendar events without leaving Obsidian
- **Event Details**: Add title, date, time, description, and all-day event support
- **Instant Link**: Automatically inserts a link to the newly created event

### Token Management

- **Flexible Expiry**: Choose from 1 week, 1 month, 3 months, 6 months, or unlimited
- **Unlimited Access**: Set token to never expire until manually disconnected
- **Visual Status**: Real-time token status display in settings
- **Auto-validation**: Automatic token validation before every API call
- **Clear Notifications**: Get notified when tokens expire and need reconnection

### Smart Caching

- **5-Minute Cache**: Reduces API calls with intelligent event caching
- **Background Sync**: Option to manually sync your calendar
- **Configurable Range**: Set custom time range for event suggestions (default: 90 days)

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian Settings
2. Navigate to Community Plugins
3. Search for "Pick Google Calendar Event"
4. Click Install
5. Enable the plugin

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/rajeevrajchal/pmc/releases)
2. Extract the files to your vault's `.obsidian/plugins/pick-google-calendar/` folder
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

## Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Give it a name (e.g., "Obsidian PMC Plugin") and click "Create"

### Step 2: Enable Google Calendar API

1. In the sidebar, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - Add your email as a test user
   - Scopes: Add `calendar.readonly` and `calendar.events`
4. Select "Web application" as the application type
5. Add this Authorized redirect URI:

   ```
   https://rajeevrajchal.github.io/pmc-google/oauth-callback
   ```

6. Click "Create" and copy your Client ID

### Step 4: Configure Plugin

1. Open Obsidian Settings → Pick Google Calendar Event
2. Paste your Client ID
3. Configure token expiry (default: Unlimited)
4. Set your preferred time range for suggestions (default: 90 days)
5. Click "Connect to Google"
6. Authorize the application in your browser
7. Return to Obsidian - you're ready to go!

## Usage

### Basic Usage

#### Insert an Event

1. In any note, type `:`
2. A suggestion menu appears showing your upcoming events
3. Select an event to insert it as a link: `[Event Name](Google Calendar Link)`

#### Search and Filter

1. Type `:` followed by your search query
2. Example: `:team meeting` filters events containing "team meeting"
3. The search works across:
   - Event titles
   - Descriptions
   - Locations
   - Attendee names and emails

#### Create New Event

1. Type `:` to open the event picker
2. Select "+ Create new event" at the top
3. Fill in event details:
   - Title (required)
   - Date (required)
   - All-day toggle
   - Start/End time (for timed events)
   - Description (optional)
4. Click "Create Event"
5. The event link is automatically inserted in your note

### Settings

#### Token Expiry Options

Choose how long your Google Calendar connection remains active:

- **1 Week**: Token expires after 7 days
- **1 Month**: Token expires after 30 days
- **3 Months**: Token expires after 90 days
- **6 Months**: Token expires after 180 days
- **Unlimited**: Token never expires (until manually disconnected)

#### Suggestion Time Range

Configure how far into the past and future to search for events:

- Default: 90 days
- Searches 7 days in the past
- Searches N days into the future (configurable)

#### Token Status

Visual indicator showing:

- ✅ Token valid for X days
- ✅ Token valid: Unlimited
- ⚠️ Token expires in X days (within 24 hours)
- ⚠️ Token expired (reconnection required)

## How It's Built

### Technology Stack

- **TypeScript**: Full type safety and modern JavaScript features
- **Obsidian API**: Native integration with Obsidian's editor
- **Google Calendar API**: Direct communication with Google Calendar
- **esbuild**: Fast bundling and development workflow

### Architecture

```
pmc/
├── src/
│   ├── main.ts                 # Plugin entry point
│   ├── components/
│   │   ├── event-suggestion.ts # Type-ahead event picker
│   │   ├── create-event.ts     # Event creation modal
│   │   ├── setting.ts          # Settings tab
│   │   └── tabs/
│   │       └── google/
│   │           ├── auth.ts         # OAuth flow
│   │           ├── calendar-api.ts # Google Calendar API client
│   │           ├── token-manager.ts# Token validation & expiry
│   │           ├── settings-ui.ts  # Settings UI components
│   │           └── types.ts        # TypeScript interfaces
│   └── style.css              # Custom styles
├── server/
│   └── oauth-server.ts        # OAuth callback handler
├── manifest.json              # Plugin metadata
├── package.json               # Dependencies
└── esbuild.config.mjs        # Build configuration
```

### Key Components

#### EditorEventSuggestion (`event-suggestion.ts`)

- Implements Obsidian's `EditorSuggest` interface
- Triggers on `:` character
- Real-time query filtering with regex pattern matching
- 5-minute cache for API responses
- Multi-field search (title, description, location, attendees)

#### GoogleCalendarAPI (`calendar-api.ts`)

- RESTful API client for Google Calendar
- Automatic token validation before each request
- Methods: `fetchEvents`, `createEvent`, `updateEvent`, `deleteEvent`, `listCalendars`, `syncCalendar`
- Error handling with user-friendly notices

#### TokenManager (`token-manager.ts`)

- Calculates expiry dates based on user settings
- Validates tokens before API calls
- Provides human-readable time remaining
- Supports unlimited (never expiring) tokens

#### OAuth Flow (`auth.ts` + `oauth-callback.html`)

- Implements OAuth 2.0 implicit flow
- Redirects to hosted callback page
- Uses `obsidian://` protocol handler
- Stores access token securely in plugin settings

### Build Process

#### Development

```bash
pnpm install
pnpm run dev
```

- Watches for file changes
- Enables source maps
- No minification
- Hot reload support

#### Production

```bash
pnpm run build
```

- TypeScript compilation with type checking
- esbuild bundling
- Tree shaking for smaller bundle size
- Minification
- Outputs to `main.js`

#### Build Configuration

- **Target**: ES2018
- **Format**: CommonJS
- **Entry**: `src/main.ts`
- **Output**: `main.js`
- **Externals**: Obsidian API, Electron, CodeMirror
- **Minify**: Production only

## Privacy & Security

- **No Data Storage**: Events are cached locally for 5 minutes only
- **OAuth 2.0**: Industry-standard authentication
- **Token Control**: Full control over token expiry
- **Scopes**: Only requests necessary permissions:
  - `calendar.readonly`: Read calendar events
  - `calendar.events`: Create and modify events
- **No Tracking**: No analytics or data collection

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect" error

- **Solution**: Verify Client ID is correct
- **Solution**: Ensure redirect URI is added to Google Cloud Console
- **Solution**: Check OAuth consent screen configuration

### Token Expired

**Problem**: "Token has expired" notification

- **Solution**: Go to Settings → Pick Google Calendar Event
- **Solution**: Click "Disconnect" then "Connect to Google"
- **Solution**: Consider setting token expiry to "Unlimited"

### No Events Showing

**Problem**: Event picker shows no results

- **Solution**: Check if events exist in the time range (Settings → Suggestion Time Range)
- **Solution**: Click "Sync Calendar" in settings
- **Solution**: Try typing `:` without query to see all events

### API Errors

**Problem**: "Failed to fetch events" error

- **Solution**: Check internet connection
- **Solution**: Verify Google Calendar API is enabled
- **Solution**: Try reconnecting your account

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Setup

```bash
# Clone repository
git clone https://github.com/rajeevrajchal/pmc.git
cd pmc

# Install dependencies
pnpm install

# Start development
pnpm run dev

# Run linting
pnpm run lint
```

## Support

If you find this plugin helpful, consider supporting the development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-orange?style=for-the-badge&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/rajeevrajchal)

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Author

**Rajeev Rajchal**

- Website: [rajeevrajchal.com.np](https://rajeevrajchal.com.np)
- GitHub: [@rajeevrajchal](https://github.com/rajeevrajchal)

## Changelog

### v1.0.0 (2026-01-03)

- Initial release
- Type-ahead event search with `:` trigger
- Multi-field search (title, description, location, attendees)
- Create new calendar events
- Flexible token expiry options (1 week to unlimited)
- Automatic token validation
- 5-minute event caching
- Configurable time range for suggestions
- Rich event display with dates, times, and conference links

---

Made with ❤️ for the Obsidian community
