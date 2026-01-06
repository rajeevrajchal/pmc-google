import { Notice, requestUrl } from "obsidian";
import { CalendarEvent } from "./types";
import { TokenManager } from "./token-manager";

export class GoogleCalendarAPI {
  private static readonly BASE_URL = "https://www.googleapis.com/calendar/v3";

  /**
   * Validate access token before making API calls
   * @param accessToken - The access token to validate
   * @param tokenExpiryDate - Optional token expiry date
   * @throws Error if token is invalid, missing, or encrypted
   */
  private static validateToken(accessToken: string, tokenExpiryDate?: number): void {
    // Validate token exists and is not empty
    if (!accessToken || accessToken.trim() === "") {
      console.error("[PMC] Access token is empty or missing");
      new Notice("Please connect to Google Calendar in settings");
      throw new Error("Access token missing");
    }

    // Check if token appears to be encrypted (should not be at this point)
    if (accessToken.startsWith("enc:")) {
      console.error("[PMC] CRITICAL: Access token is still encrypted! Decryption failed.");
      new Notice("Token decryption failed. Please reconnect to Google Calendar.");
      throw new Error("Token not decrypted");
    }

    // Validate token expiry
    if (TokenManager.isTokenExpired(tokenExpiryDate)) {
      new Notice("Google calendar token has expired, please reconnect in settings");
      throw new Error("Token expired");
    }
  }

  /**
   * Fetch calendar events from Google Calendar
   * @param accessToken - OAuth access token
   * @param calendarId - Calendar ID (defaults to 'primary')
   * @param query - Search query for events
   * @param timeMin - Start time for events (ISO 8601)
   * @param timeMax - End time for events (ISO 8601)
   * @param maxResults - Maximum number of events to return
   * @param tokenExpiryDate - Optional token expiry date for validation
   * @returns Array of calendar events
   */
  static async fetchEvents(
    accessToken: string,
    calendarId: string = "primary",
    query?: string,
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 250,
    tokenExpiryDate?: number,
  ): Promise<CalendarEvent[]> {
    try {
      // Validate token before making API call
      this.validateToken(accessToken, tokenExpiryDate);

      const params: Record<string, string> = {
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: maxResults.toString(),
      };

      if (timeMin) {
        params.timeMin = timeMin;
      }
      if (timeMax) {
        params.timeMax = timeMax;
      }
      if (query && query.trim() !== "") {
        params.q = query;
      }

      const queryString = new URLSearchParams(params).toString();

      const response = await requestUrl({
        url: `${this.BASE_URL}/calendars/${calendarId}/events?${queryString}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = response.json;
      return data.items || [];
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      new Notice("Failed to fetch calendar events");
      throw error;
    }
  }

  /**
   * Create a new calendar event
   * @param accessToken - OAuth access token
   * @param event - Event details to create
   * @param calendarId - Calendar ID (defaults to 'primary')
   * @param tokenExpiryDate - Optional token expiry date for validation
   * @returns Created event
   */
  static async createEvent(
    accessToken: string,
    event: Partial<CalendarEvent>,
    calendarId: string = "primary",
    tokenExpiryDate?: number,
  ): Promise<CalendarEvent> {
    try {
      // Validate token before making API call
      this.validateToken(accessToken, tokenExpiryDate);
      const response = await requestUrl({
        url: `${this.BASE_URL}/calendars/${calendarId}/events`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      const createdEvent = response.json;
      new Notice("Event created successfully");
      return createdEvent;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      new Notice("Failed to create calendar event");
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   * @param accessToken - OAuth access token
   * @param eventId - ID of the event to update
   * @param event - Updated event details
   * @param calendarId - Calendar ID (defaults to 'primary')
   * @param tokenExpiryDate - Optional token expiry date for validation
   * @returns Updated event
   */
  static async updateEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId: string = "primary",
    tokenExpiryDate?: number,
  ): Promise<CalendarEvent> {
    try {
      // Validate token before making API call
      this.validateToken(accessToken, tokenExpiryDate);
      const response = await requestUrl({
        url: `${this.BASE_URL}/calendars/${calendarId}/events/${eventId}`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      const updatedEvent = response.json;
      new Notice("Event updated successfully");
      return updatedEvent;
    } catch (error) {
      console.error("Error updating calendar event:", error);
      new Notice("Failed to update calendar event");
      throw error;
    }
  }

  /**
   * Delete a calendar event
   * @param accessToken - OAuth access token
   * @param eventId - ID of the event to delete
   * @param calendarId - Calendar ID (defaults to 'primary')
   * @param tokenExpiryDate - Optional token expiry date for validation
   */
  static async deleteEvent(
    accessToken: string,
    eventId: string,
    calendarId: string = "primary",
    tokenExpiryDate?: number,
  ): Promise<void> {
    try {
      // Validate token before making API call
      this.validateToken(accessToken, tokenExpiryDate);
      await requestUrl({
        url: `${this.BASE_URL}/calendars/${calendarId}/events/${eventId}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      new Notice("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      new Notice("Failed to delete calendar event");
      throw error;
    }
  }

  /**
   * Get list of available calendars
   * @param accessToken - OAuth access token
   * @param tokenExpiryDate - Optional token expiry date for validation
   * @returns Array of calendar objects
   */
  static async listCalendars(
    accessToken: string,
    tokenExpiryDate?: number,
  ): Promise<
    Array<{
      id: string;
      summary: string;
      description?: string;
      timeZone?: string;
      backgroundColor?: string;
      foregroundColor?: string;
      primary?: boolean;
    }>
  > {
    try {
      // Validate token before making API call
      this.validateToken(accessToken, tokenExpiryDate);
      const response = await requestUrl({
        url: `${this.BASE_URL}/users/me/calendarList`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = response.json;
      return data.items || [];
    } catch (error) {
      console.error("Error fetching calendars:", error);
      new Notice("Failed to fetch calendars");
      throw error;
    }
  }

  /**
   * Sync calendar events (fetch and cache)
   * @param accessToken - OAuth access token
   * @param tokenExpiryDate - Optional token expiry date for validation
   */
  static async syncCalendar(
    accessToken: string,
    tokenExpiryDate?: number,
  ): Promise<void> {
    try {
      // Validate token before making API call
      this.validateToken(accessToken, tokenExpiryDate);

      new Notice("Syncing calendar");

      // Fetch events for the next 30 days
      const timeMin = new Date().toISOString();
      const timeMax = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const events = await this.fetchEvents(
        accessToken,
        "primary",
        undefined,
        timeMin,
        timeMax,
      );

      new Notice(`Synced ${events.length} events`);

      return;
    } catch (error) {
      console.error("Error syncing calendar:", error);
      new Notice("Failed to sync calendar");
      throw error;
    }
  }
}
