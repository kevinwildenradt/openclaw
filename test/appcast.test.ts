import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const APPCAST_URL = new URL("../appcast.xml", import.meta.url);

function expectedSparkleVersion(shortVersion: string): string {
  const [year, month, day] = shortVersion.split(".");
  if (!year || !month || !day) {
    throw new Error(`unexpected short version: ${shortVersion}`);
  }
  return `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
}

describe("appcast.xml", () => {
  it("uses a Sparkle version prefixed by short version date", () => {
    const appcast = readFileSync(APPCAST_URL, "utf8");
    const items = Array.from(appcast.matchAll(/<item>[\s\S]*?<\/item>/g))
      .map((match) => match[0])
      .map((item) => {
        const shortVersion = item.match(
          /<sparkle:shortVersionString>([^<]+)<\/sparkle:shortVersionString>/,
        )?.[1];
        const sparkleVersion = item.match(/<sparkle:version>([^<]+)<\/sparkle:version>/)?.[1];
        return { shortVersion, sparkleVersion };
      })
      .filter((item): item is { shortVersion: string; sparkleVersion: string } =>
        Boolean(item.shortVersion && item.sparkleVersion),
      )
      .filter((item) => /^\d{4}\.\d{1,2}\.\d{1,2}$/.test(item.shortVersion));

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.sparkleVersion.startsWith(expectedSparkleVersion(item.shortVersion))).toBe(true);
    }
  });
});
