export interface GoogleCalendarSettings {
  clientId: string;
  clientSecret?: string; // For refresh token flow
  accessToken: string;
  refreshToken?: string; // For automatic token refresh
  tokenExpiry: string;
  tokenExpiryDate?: number;
  accessTokenExpiresAt?: number; // Unix timestamp when access token expires
  timeRange: number;
  encryptionEnabled?: boolean; // Track if tokens are encrypted
}

export const DEFAULT_GOOGLE_SETTINGS: GoogleCalendarSettings = {
  clientId: "",
  clientSecret: "",
  accessToken: "",
  refreshToken: "",
  tokenExpiry: "1week", // Default to 1 week for better security
  tokenExpiryDate: undefined,
  accessTokenExpiresAt: undefined,
  timeRange: 90,
  encryptionEnabled: true, // Enable encryption by default
};

export type TokenExpiryOption =
  | "1week"
  | "1month"
  | "3months"
  | "6months"
  | "unlimited";

export const TOKEN_EXPIRY_OPTIONS: Record<TokenExpiryOption, string> = {
  "1week": "1 week",
  "1month": "1 month",
  "3months": "3 months",
  "6months": "6 months",
  unlimited: "Unlimited (until manually disconnected)",
};

export const GOOGLE_OAUTH_CALLBACK_URL =
  "https://rajeevrajchal.github.io/pmc-google/oauth-callback";

// Backend server for token exchange (authorization code flow)
export const GOOGLE_TOKEN_EXCHANGE_URL =
  "https://your-server.com/api/token/exchange"; // TODO: Replace with your actual server
  
export const GOOGLE_TOKEN_REFRESH_URL =
  "https://your-server.com/api/token/refresh"; // TODO: Replace with your actual server

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string; // Present in authorization code flow
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface CalendarEvent {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description?: string;
  location?: string;
  creator?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  iCalUID?: string;
  sequence?: number;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    self?: boolean;
    organizer?: boolean;
  }>;
  hangoutLink?: string;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
      status: {
        statusCode: string;
      };
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
    conferenceSolution?: {
      key: {
        type: string;
      };
      name: string;
      iconUri?: string;
    };
    conferenceId?: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
  eventType: string;
}
