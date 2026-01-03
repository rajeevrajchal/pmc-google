import { App, Modal, Setting } from "obsidian";

export class DonationModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Add custom class for styling
    contentEl.addClass("donation-modal");

    // Header
    contentEl.createEl("h2", {
      text: "❤️ Support Development",
      cls: "donation-header",
    });

    // Description
    contentEl.createEl("p", {
      text: "If you enjoy using this plugin, consider supporting its development! Your support helps keep this project alive and enables new features.",
      cls: "donation-description",
    });

    // Buy Me a Coffee
    new Setting(contentEl)
      .setName("☕ Buy Me a Coffee")
      .setDesc("Support with a one-time donation")
      .addButton((btn) =>
        btn
          .setButtonText("Donate")
          .setCta()
          .onClick(() => {
            window.open("https://www.buymeacoffee.com/yourusername", "_blank");
          }),
      );

    // GitHub Sponsors (optional)
    new Setting(contentEl)
      .setName("⭐ GitHub Sponsors")
      .setDesc("Sponsor on GitHub for recurring support")
      .addButton((btn) =>
        btn.setButtonText("Become a Sponsor").onClick(() => {
          window.open("https://github.com/sponsors/yourusername", "_blank");
        }),
      );

    // Thank you message
    contentEl.createEl("p", {
      text: "Thank you for your support! Every contribution helps improve this plugin. 🙏",
      cls: "donation-thanks",
    });

    // Close button
    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Close").onClick(() => {
        this.close();
      }),
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
