export type LegalDocument = {
  title: string;
  updatedAt: string;
  sections: {
    title: string;
    paragraphs?: string[];
    bullets?: string[];
  }[];
};

export const LEGAL_DOCUMENTS: Record<string, LegalDocument> = {
  terms: {
    title: "Terms and Conditions",
    updatedAt: "October 12, 2026",
    sections: [
      {
        title: "",
        paragraphs: [
          'By installing or using Pickle Scorer ("the app"), you agree to these terms. If you do not agree, please do not use the app.',
        ],
      },
      {
        title: "Purpose of the app",
        paragraphs: [
          "Pickle Scorer is a tool for scoring pickleball matches and tracking results for a group of players. It is intended for recreational use.",
        ],
      },
      {
        title: "Use of the app",
        paragraphs: [
          "You may use the app for personal, non-commercial purposes. You agree not to copy, modify, reverse engineer, or redistribute the app except as permitted by its open source license, where one applies.",
        ],
      },
      {
        title: "Your data",
        paragraphs: [
          "All data you enter is stored on your device. You are responsible for it. Erasing all data in Settings or uninstalling the app permanently removes it, and it cannot be recovered. Please see the Privacy Policy for details.",
        ],
      },
      {
        title: "Rankings and suggestions",
        paragraphs: [
          "Rankings, duo records, and suggested lineups are based only on the results you record in the app. They are a convenience for casual play. They are not official ratings, are not affiliated with any governing body or rating service, and should not be treated as an official measure of skill. The accuracy of results depends on what is entered.",
        ],
      },
      {
        title: "No warranty",
        paragraphs: [
          'The app is provided "as is" and "as available", without warranties of any kind, whether express or implied. We do not guarantee that the app will be error-free, uninterrupted, or that stored data will never be lost.',
        ],
      },
      {
        title: "Limitation of liability",
        paragraphs: [
          "To the extent permitted by law, the developer is not liable for any damages arising from the use of, or inability to use, the app, including loss of data or disputes over scores.",
        ],
      },
      {
        title: "Changes to the app and these terms",
        paragraphs: [
          "The app and these terms may change over time. Continued use of the app after a change means you accept the updated terms.",
        ],
      },
      {
        title: "Governing law",
        paragraphs: [
          "These terms are governed by the laws of the Philippines, without regard to conflict of law rules.",
        ],
      },
      {
        title: "Contact",
        paragraphs: ["For questions about these terms, contact: jirehzoe@gmail.com"],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updatedAt: "October 12, 2026",
    sections: [
      {
        title: "",
        paragraphs: [
          'Pickle Scorer ("the app") is a pickleball scoring and session tracking app. This policy explains what information the app handles. The short version: the app does not collect, transmit, or share any personal data.',
        ],
      },
      {
        title: "Information we collect",
        paragraphs: [
          "None. The app does not require an account, and it does not ask for your name, email address, phone number, location, contacts, photos, or any other personal information.",
        ],
      },
      {
        title: "Information stored on your device",
        paragraphs: [
          "The app stores the following on your device only, using the platform's local storage:",
          "This data never leaves your device. We cannot see it, access it, or recover it. You can delete it at any time from the Settings screen using the option to erase all data, or by uninstalling the app.",
          "The player names you enter are chosen by you. If you enter the names of other people, please make sure they are comfortable with this.",
        ],
        bullets: [
          "Player names that you type into the roster.",
          "Match results, rankings, doubles partnership records, and archived sessions.",
          "Preferences such as theme and whether you have seen the in-app guide.",
        ],
      },
      {
        title: "Information shared with third parties",
        paragraphs: [
          "None. The app does not send data to any server and does not include advertising, analytics, or tracking tools.",
        ],
      },
      {
        title: "Permissions",
        paragraphs: ["The app does not request any special device permissions."],
      },
      {
        title: "Network use",
        paragraphs: ["The app works fully offline. It does not need an internet connection to function."],
      },
      {
        title: "Children's privacy",
        paragraphs: [
          "The app does not knowingly collect information from anyone, including children under 13. Because no data is collected or transmitted, no personal information from children is received by us.",
        ],
      },
      {
        title: "Data retention and deletion",
        paragraphs: [
          "Data remains on your device until you erase it in Settings or uninstall the app. Because we hold no copy, there is nothing for us to delete on our side.",
        ],
      },
      {
        title: "Changes to this policy",
        paragraphs: [
          "If the app changes in a way that affects how data is handled, such as adding cloud sync, this policy will be updated before the change is released. The date at the top shows when it was last revised.",
        ],
      },
      {
        title: "Contact",
        paragraphs: ["If you have questions about this policy, contact: jirehzoe@gmail.com"],
      },
    ],
  },
};
