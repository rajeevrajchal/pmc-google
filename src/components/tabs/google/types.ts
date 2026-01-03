export interface GoogleCalendarSettings {
  clientId: string;
  accessToken: string;
  tokenExpiry: string;
  tokenExpiryDate?: number;
  timeRange: number;
}

export const DEFAULT_GOOGLE_SETTINGS: GoogleCalendarSettings = {
  clientId: "",
  accessToken: "",
  tokenExpiry: "unlimited",
  tokenExpiryDate: undefined,
  timeRange: 90,
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

export interface OAuthTokenResponse {
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
