import { App, Modal, Notice, Setting } from "obsidian";
import PickMeetingCalendar from "../main";
import { GoogleCalendarAPI, TokenManager } from "./tabs/google";

export class CreateEventModal extends Modal {
  plugin: PickMeetingCalendar;
  initialTitle: string;
  onSubmit: (eventData: { title: string; link: string }) => void;

  // Form fields
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  isAllDay: boolean;

  constructor(
    app: App,
    plugin: PickMeetingCalendar,
    initialTitle: string,
    onSubmit: (eventData: { title: string; link: string }) => void,
  ) {
    super(app);
    this.plugin = plugin;
    this.initialTitle = initialTitle;
    this.onSubmit = onSubmit;

    // Set defaults
    this.title = initialTitle || "";
    this.isAllDay = false;
    this.description = "";

    // Default to today
    const now = new Date();
    this.date = now.toISOString().split("T")[0] || "";

    // Default times: now + 1 hour for start, + 2 hours for end
    const startHour = (now.getHours() + 1) % 24;
    const endHour = (now.getHours() + 2) % 24;
    this.startTime = `${String(startHour).padStart(2, "0")}:00`;
    this.endTime = `${String(endHour).padStart(2, "0")}:00`;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    new Setting(contentEl).setName("Create calendar event").setHeading();

    // Title
    new Setting(contentEl)
      .setName("Event title")
      .setDesc("Name of the event")
      .addText((text) =>
        text
          .setPlaceholder("Team meeting")
          .setValue(this.title)
          .onChange((value) => {
            this.title = value;
          }),
      );

    // Date
    new Setting(contentEl)
      .setName("Date")
      .setDesc("Event date")
      .addText((text) => {
        text
          .setPlaceholder("yyyy-mm-dd")
          .setValue(this.date)
          .onChange((value) => {
            this.date = value;
          });
        text.inputEl.type = "date";
      });

    // All-day toggle
    new Setting(contentEl)
      .setName("All-day event")
      .setDesc("Toggle for all-day events")
      .addToggle((toggle) =>
        toggle.setValue(this.isAllDay).onChange((value) => {
          this.isAllDay = value;
          // Toggle time inputs visibility
          const timeSettings = contentEl.querySelectorAll(".time-setting");
          timeSettings.forEach((el) => {
            if (value) {
              (el as HTMLElement).addClass("is-hidden");
            } else {
              (el as HTMLElement).removeClass("is-hidden");
            }
          });
        }),
      );

    // Start time
    const startTimeSetting = new Setting(contentEl)
      .setName("Start time")
      .setDesc("Event start time")
      .addText((text) => {
        text
          .setPlaceholder("09:00")
          .setValue(this.startTime)
          .onChange((value) => {
            this.startTime = value;
          });
        text.inputEl.type = "time";
      });
    startTimeSetting.settingEl.addClass("time-setting");

    // End time
    const endTimeSetting = new Setting(contentEl)
      .setName("End time")
      .setDesc("Event end time")
      .addText((text) => {
        text
          .setPlaceholder("10:00")
          .setValue(this.endTime)
          .onChange((value) => {
            this.endTime = value;
          });
        text.inputEl.type = "time";
      });
    endTimeSetting.settingEl.addClass("time-setting");

    // Description
    new Setting(contentEl)
      .setName("Description")
      .setDesc("Additional details (optional)")
      .addTextArea((text) => {
        text
          .setPlaceholder("Meeting agenda, notes, etc.")
          .setValue(this.description)
          .onChange((value) => {
            this.description = value;
          });
        text.inputEl.rows = 4;
      });

    // Buttons
    const buttonContainer = contentEl.createDiv({
      cls: "modal-button-container",
    });

    // Cancel button
    const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
    cancelBtn.addEventListener("click", () => {
      this.close();
    });

    // Create button
    const createBtn = buttonContainer.createEl("button", {
      text: "Create event",
      cls: "mod-cta",
    });
    createBtn.addEventListener("click", () => {
      void this.createEvent();
    });
  }

  async createEvent() {
    // Validate inputs
    if (!this.title.trim()) {
      new Notice("Event title is required");
      return;
    }

    if (!this.date) {
      new Notice("Event date is required");
      return;
    }

    if (!this.isAllDay && (!this.startTime || !this.endTime)) {
      new Notice("Start and end times are required");
      return;
    }

    // Check if access token exists
    if (!this.plugin.settings.accessToken) {
      new Notice(
        "Not authenticated. Please connect your Google account in settings.",
      );
      return;
    }

    // Check if token has expired
    if (TokenManager.isTokenExpired(this.plugin.settings.tokenExpiryDate)) {
      new Notice(
        "Access token has expired. Please reconnect your Google account in settings.",
      );
      return;
    }

    try {
      // Build event object
      const event: Partial<{
        summary: string;
        description?: string;
        start: { date?: string; dateTime?: string; timeZone?: string };
        end: { date?: string; dateTime?: string; timeZone?: string };
      }> = {
        summary: this.title.trim(),
        description: this.description.trim() || undefined,
      };

      if (this.isAllDay) {
        // All-day event
        event.start = {
          date: this.date,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        event.end = {
          date: this.date,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      } else {
        // Timed event
        const startDateTime = `${this.date}T${this.startTime}:00`;
        const endDateTime = `${this.date}T${this.endTime}:00`;

        event.start = {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        event.end = {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }

      // Create event via API
      const createdEvent = await GoogleCalendarAPI.createEvent(
        this.plugin.settings.accessToken,
        event,
        "primary",
        this.plugin.settings.tokenExpiryDate,
      );

      // Get the event link
      const eventLink =
        createdEvent.htmlLink ||
        `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(createdEvent.id)}`;

      // Success!
      new Notice(`Event "${this.title}" created successfully!`);

      // Call the callback with event data
      this.onSubmit({
        title: this.title,
        link: eventLink,
      });

      this.close();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      new Notice(`Failed to create event: ${errorMessage}`);
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
