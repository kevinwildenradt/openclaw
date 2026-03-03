const DEFAULT_RESET_TRIGGERS = ["/new", "/reset"] as const;

type FeishuBeforeResetHookRunner = {
  runBeforeReset: (
    event: {
      type: "command";
      action: "new" | "reset";
      context: Record<string, unknown>;
    },
    ctx: { agentId: string; sessionKey: string },
  ) => Promise<unknown>;
};

/**
 * Handle Feishu command messages and trigger appropriate hooks
 */
export async function handleFeishuCommand(
  messageText: string,
  sessionKey: string,
  hookRunner: FeishuBeforeResetHookRunner,
  context: {
    cfg: unknown;
    sessionEntry: unknown;
    previousSessionEntry?: unknown;
    commandSource: string;
    timestamp: number;
    [key: string]: unknown;
  },
): Promise<boolean> {
  // Check if message is a reset command
  const trimmed = messageText.trim().toLowerCase();
  const isResetCommand = DEFAULT_RESET_TRIGGERS.some(
    (trigger) => trimmed === trigger || trimmed.startsWith(`${trigger} `),
  );

  if (isResetCommand) {
    // Extract the actual command (without arguments)
    const command = trimmed.split(" ")[0];

    // Trigger the before_reset hook
    await hookRunner.runBeforeReset(
      {
        type: "command",
        action: command.replace("/", "") as "new" | "reset",
        context: {
          ...context,
          commandSource: "feishu",
        },
      },
      {
        agentId: "main", // or extract from sessionKey
        sessionKey,
      },
    );

    return true; // Command was handled
  }

  return false; // Not a command we handle
}
