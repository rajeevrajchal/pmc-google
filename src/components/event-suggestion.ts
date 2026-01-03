import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
  Notice,
} from "obsidian";
import PMCPlugin from "main";
import { GoogleCalendarAPI, CalendarEvent } from "./tabs/google";
import { CreateEventModal } from "./create-event";

interface EventSuggestion {
  isCreate?: boolean;
  event?: CalendarEvent;
  summary: string;
}

export class EditorEventSuggestion extends EditorSuggest<EventSuggestion> {
  plugin: PMCPlugin;
  private cachedEvents: CalendarEvent[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(app: App, plugin: PMCPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile,
  ): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line);
    const textBeforeCursor = line.substring(0, cursor.ch);

    // Check if there's a ':' trigger in the line
    const colonMatch = textBeforeCursor.match(/:([\w\s]*)$/);

    if (colonMatch) {
      const query = colonMatch[1] || "";
      const startCh = cursor.ch - colonMatch[0].length + 1; // +1 to skip the ':'

      return {
        start: { line: cursor.line, ch: startCh },
        end: cursor,
        query: query,
      };
    }

    return null;
  }

  private async fetchEventsWithCache(query?: string): Promise<CalendarEvent[]> {
    const now = Date.now();
    const shouldRefetch = now - this.lastFetchTime > this.CACHE_DURATION;

    if (shouldRefetch || this.cachedEvents.length === 0) {
      try {
        // Fetch events for the next 30 days and past 1 days
        const timeMin = new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const timeMax = new Date(
          Date.now() + this.plugin.settings.timeRange * 24 * 60 * 60 * 1000,
        ).toISOString();

        this.cachedEvents = await GoogleCalendarAPI.fetchEvents(
          this.plugin.settings.accessToken,
          "primary",
          undefined,
          timeMin,
          timeMax,
          250,
          this.plugin.settings.tokenExpiryDate,
        );
        this.lastFetchTime = now;
      } catch (error) {
        console.error("Error fetching events:", error);
        return [];
      }
    }

    return this.cachedEvents;
  }

  private filterEvents(
    events: CalendarEvent[],
    query: string,
  ): CalendarEvent[] {
    if (!query || query.trim() === "") {
      return events;
    }

    const lowerQuery = query.toLowerCase().trim();

    return events.filter((event) => {
      // Search in summary
      if (event.summary?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in description
      if (event.description?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in location
      if (event.location?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in attendees
      if (
        event.attendees?.some(
          (attendee) =>
            attendee.email?.toLowerCase().includes(lowerQuery) ||
            attendee.displayName?.toLowerCase().includes(lowerQuery),
        )
      ) {
        return true;
      }

      return false;
    });
  }

  // return list of suggestions
  async getSuggestions(
    context: EditorSuggestContext,
  ): Promise<EventSuggestion[]> {
    if (this.plugin.settings.accessToken === "") {
      new Notice("Please connect to Google Calendar first");
      return [];
    }

    const query = (context.query || "").trim();
    try {
      // Fetch all events from cache
      const allEvents = await this.fetchEventsWithCache();

      // Filter events based on query
      const filteredEvents = this.filterEvents(allEvents, query);

      // Return create option + filtered events
      const suggestions: EventSuggestion[] = [];

      suggestions.push(
        ...filteredEvents.map((event) => ({
          event,
          summary: event.summary || event.description || "Untitled Event",
        })),
      );

      return [
        {
          isCreate: true,
          summary: `+ Create new event`,
        },
        ...suggestions,
      ];
    } catch (error) {
      console.error("Error getting suggestions:", error);
      return [];
    }
  }

  // render each suggestion
  renderSuggestion(item: EventSuggestion, el: HTMLElement): void {
    el.empty();

    const container = el.createDiv({ cls: "gcal-suggestion-container" });

    if (item.isCreate) {
      container.addClass("create-new");
      container.createEl("span", { text: item.summary });
    } else if (item.event) {
      const event = item.event;
      const leftDiv = container.createDiv({ cls: "gcal-suggestion-left" });

      // Event title
      leftDiv.createEl("div", {
        text: event.summary || "Untitled event",
        cls: "gcal-event-title",
      });

      // Add location if available
      if (event.location) {
        leftDiv.createEl("div", {
          text: event.location,
          cls: "gcal-event-location",
        });
      }

      // Date and time on the right
      const rightDiv = container.createDiv({ cls: "gcal-suggestion-right" });

      try {
        const startDate = new Date(
          event.start.dateTime || event.start.date || "",
        );
        const now = new Date();
        const isToday = startDate.toDateString() === now.toDateString();
        const isTomorrow =
          startDate.toDateString() ===
          new Date(now.getTime() + 86400000).toDateString();

        // Format date
        let dateStr = "";
        if (isToday) {
          dateStr = "Today";
        } else if (isTomorrow) {
          dateStr = "Tomorrow";
        } else {
          dateStr = startDate.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year:
              startDate.getFullYear() !== now.getFullYear()
                ? "numeric"
                : undefined,
          });
        }

        let timeStr = "";
        if (event.start.dateTime) {
          timeStr = startDate.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        } else {
          timeStr = "All day";
        }

        // Display date
        rightDiv.createEl("div", {
          text: dateStr,
          cls: "gcal-event-date",
        });

        // Display time
        rightDiv.createEl("div", {
          text: timeStr,
          cls: "gcal-event-time",
        });

        // Add conference indicator if available
        if (event.hangoutLink || event.conferenceData) {
          rightDiv.createEl("div", {
            text: "🎥 Video",
            cls: "gcal-event-conference",
          });
        }
      } catch (e) {
        console.error("Error formatting date:", e);
        rightDiv.createEl("small", {
          text: "Invalid date",
          attr: { style: "color: var(--text-error);" },
        });
      }
    }
  }

  // user selects a suggestion
  selectSuggestion(
    item: EventSuggestion,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    if (!this.context) {
      console.error("No context available");
      return;
    }

    if (item.isCreate) {
      new CreateEventModal(
        this.app,
        this.plugin,
        this.context.query,
        (eventData) => {
          if (this.context) {
            // Insert the created event as a link
            const formattedText = `[${eventData.title}](${eventData.link})`;
            this.context.editor.replaceRange(
              formattedText,
              this.context.start,
              this.context.end,
            );
          }
        },
      ).open();
    } else if (item.event) {
      const event = item.event;
      const eventLink =
        event.htmlLink ||
        `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(event.id)}`;

      const eventTitle = event.summary || "Untitled Event";

      // Format: [Event Name](Google Calendar Link)
      const formattedText = `[${eventTitle}](${eventLink})`;

      this.context.editor.replaceRange(
        formattedText,
        this.context.start,
        this.context.end,
      );
    }
  }

  // Clear cache when needed (can be called from plugin)
  clearCache(): void {
    this.cachedEvents = [];
    this.lastFetchTime = 0;
  }
}
