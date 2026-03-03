import { describe, expect, it } from "vitest";
import type { MessagingToolSentRecord } from "./pi-embedded-messaging.js";
import { shouldSuppressMessagingToolBlockReply } from "./pi-embedded-subscribe.dedupe.js";

describe("shouldSuppressMessagingToolBlockReply", () => {
  it("scopes routing checks to records for the duplicated text", () => {
    const records: MessagingToolSentRecord[] = [
      {
        text: "in-scope text",
        textNormalized: "in-scope text",
        targetSource: "explicit",
        target: { tool: "message", provider: "slack", to: "channel:C1" },
      },
      {
        text: "off-target text",
        textNormalized: "off-target text",
        targetSource: "explicit",
        target: { tool: "message", provider: "slack", to: "channel:C2" },
      },
    ];

    expect(
      shouldSuppressMessagingToolBlockReply({
        normalizedText: "off-target text",
        sentRecords: records,
        messageProvider: "slack",
        originatingTo: "channel:C1",
      }),
    ).toBe(false);
  });

  it("does not fallback-suppress inferred records when they include off-target metadata", () => {
    const records: MessagingToolSentRecord[] = [
      {
        text: "off-target text",
        textNormalized: "off-target text",
        targetSource: "inferred",
        target: { tool: "message", provider: "slack", to: "channel:C2" },
      },
    ];

    expect(
      shouldSuppressMessagingToolBlockReply({
        normalizedText: "off-target text",
        sentRecords: records,
        messageProvider: "slack",
        originatingTo: "channel:C1",
      }),
    ).toBe(false);
  });

  it("keeps fallback suppression for matching records without target metadata", () => {
    const records: MessagingToolSentRecord[] = [
      {
        text: "sent without explicit target",
        textNormalized: "sent without explicit target",
        targetSource: "none",
      },
    ];

    expect(
      shouldSuppressMessagingToolBlockReply({
        normalizedText: "sent without explicit target",
        sentRecords: records,
        messageProvider: "slack",
        originatingTo: "channel:C1",
      }),
    ).toBe(true);
  });
});
