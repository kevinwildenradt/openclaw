import { shouldSuppressMessagingToolReplies } from "../auto-reply/reply/reply-payloads.js";
import type { MessagingToolSend, MessagingToolSentRecord } from "./pi-embedded-messaging.js";

function hasRoutingScope(params: { messageProvider?: string; originatingTo?: string }): boolean {
  return Boolean(
    typeof params.messageProvider === "string" &&
    params.messageProvider.trim().length > 0 &&
    typeof params.originatingTo === "string" &&
    params.originatingTo.trim().length > 0,
  );
}

function collectSentTargets(records: MessagingToolSentRecord[]): MessagingToolSend[] {
  return records
    .map((record) => record.target)
    .filter((target): target is MessagingToolSend => Boolean(target));
}

export function shouldSuppressMessagingToolBlockReply(params: {
  normalizedText: string;
  sentRecords: MessagingToolSentRecord[];
  messageProvider?: string;
  originatingTo?: string;
  accountId?: string;
}): boolean {
  const hasDuplicate = params.sentRecords.some(
    (record) => record.textNormalized === params.normalizedText,
  );
  if (!hasDuplicate) {
    return false;
  }
  if (!hasRoutingScope(params)) {
    // Backward-compatible fallback when upstream caller does not provide routing context.
    return true;
  }

  const sentTargets = collectSentTargets(params.sentRecords);
  if (sentTargets.length === 0) {
    // Backward-compatible fallback: successful sends may infer target from tool context
    // and omit explicit to/target args.
    return true;
  }
  if (
    shouldSuppressMessagingToolReplies({
      messageProvider: params.messageProvider,
      messagingToolSentTargets: sentTargets,
      originatingTo: params.originatingTo,
      accountId: params.accountId,
    })
  ) {
    return true;
  }
  // Mixed runs may include explicit off-target sends and inferred sends.
  // Keep fallback suppression only for matching text from non-explicit targets.
  return params.sentRecords.some(
    (record) =>
      record.textNormalized === params.normalizedText && record.targetSource !== "explicit",
  );
}
