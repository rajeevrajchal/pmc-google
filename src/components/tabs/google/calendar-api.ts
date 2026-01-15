import { Notice, requestUrl } from "obsidian";
import { CalendarEvent } from "./types";
import { TokenRefreshService } from "./token-refresh";
import PMCPlugin from "main";

export class GoogleCalendarAPI {
  private static readonly BASE_URL = "https://www.googleapis.com/calendar/v3";

  /**
   * Ensure valid access token, refresh if needed
   */
  private static async ensureValidToken(plugin: PMCPlugin): Promise<string> {
    const { settings } = plugin;
    
    if (!settings.accessToken) {
      throw new Error("No access token available. Please connect to Google Calendar in settings.");
    }

    // Check if token is expired
    if (settings.tokenExpiryDate && Date.now() >= settings.tokenExpiryDate) {
      if (settings.refreshToken) {
        // Try to refresh token
        try {
          const tokenResponse = await TokenRefreshService.refreshAccessToken(
            settings.clientId,
            settings.refreshToken
          );

          settings.accessToken = tokenResponse.access_token;
          settings.tokenExpiryDate = Date.now() + (tokenResponse.expires_in * 1000);
          
          await plugin.saveSettings();
        } catch (error) {
          console.error("Token refresh failed:", error);
          throw new Error("Token expired and refresh failed. Please reconnect to Google Calendar in settings.");
        }
      } else {
        throw new Error("Token expired and no refresh token available. Please reconnect to Google Calendar in settings.");
      }
    }

    return settings.accessToken;
  }

  /**
   * Fetch calendar events from Google Calendar
   */
  static async fetchEvents(
    plugin: PMCPlugin,
    calendarId: string = "primary",
    query?: string,
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 250,
  ): Promise<CalendarEvent[]> {
    try {
      const accessToken = await this.ensureValidToken(plugin);

      const params: Record<string, string> = {
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: maxResults.toString(),
      };

      if (timeMin) params.timeMin = timeMin;
      if (timeMax) params.timeMax = timeMax;
      if (query?.trim()) params.q = query;

      const queryString = new URLSearchParams(params).toString();

      const response = await requestUrl({
        url: `${this.BASE_URL}/calendars/${calendarId}/events?${queryString}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.json.items || [];
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      new Notice("Failed to fetch calendar events");
      throw error;
    }
  }

  /**
   * Create a new calendar event
   */
  static async createEvent(
    plugin: PMCPlugin,
    event: Partial<CalendarEvent>,
    calendarId: string = "primary",
  ): Promise<CalendarEvent> {
    try {
      const accessToken = await this.ensureValidToken(plugin);
      
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
   */
  static async updateEvent(
    plugin: PMCPlugin,
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId: string = "primary",
  ): Promise<CalendarEvent> {
    try {
      const accessToken = await this.ensureValidToken(plugin);
      
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
   */
  static async deleteEvent(
    plugin: PMCPlugin,
    eventId: string,
    calendarId: string = "primary",
  ): Promise<void> {
    try {
      const accessToken = await this.ensureValidToken(plugin);
      
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
   */
  static async listCalendars(
    plugin: PMCPlugin,
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
      const accessToken = await this.ensureValidToken(plugin);
      
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
   */
  static async syncCalendar(
    plugin: PMCPlugin,
  ): Promise<void> {
    try {
      await this.ensureValidToken(plugin);

      new Notice("Syncing calendar");

      // Fetch events for the next 30 days
      const timeMin = new Date().toISOString();
      const timeMax = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const events = await this.fetchEvents(
        plugin,
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
