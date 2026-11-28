import { expect, type Page } from "@playwright/test";

/**
 * CSP 違反の収集（qr_code_create-28o）。csp-enforced.spec.ts と csp-ga.spec.ts で共有する。
 *
 * 2 系統で集める。
 *  1. securitypolicyviolation イベント: addInitScript は全フレームに入るので、各フレームの
 *     window.__cspViolations に溜まる。page.frames() を回って集める
 *  2. コンソール: Chrome は違反のたびに「Refused to ...」「Content Security Policy」を出す
 *     （Report-Only なら「[Report Only]」付き）。page.on("console") で拾う
 */

export type Violation = {
  violatedDirective: string;
  effectiveDirective: string;
  blockedURI: string;
  disposition: string;
  sourceFile: string;
};

declare global {
  interface Window {
    __cspViolations?: Violation[];
  }
}

const CONSOLE_PATTERNS = ["Content Security Policy", "Refused to", "[Report Only]"];

export type CspCollector = {
  /** 全フレームの securitypolicyviolation を集めて返す */
  violations: () => Promise<Violation[]>;
  /** CSP 絡みのコンソール文言 */
  consoleMessages: () => string[];
};

/** goto の前に呼ぶ。ページ読み込みより先にリスナーとコンソール監視を仕込む */
export async function installCspCollector(page: Page): Promise<CspCollector> {
  const consoleLog: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (CONSOLE_PATTERNS.some((p) => text.includes(p))) consoleLog.push(`[${msg.type()}] ${text}`);
  });
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__cspViolations?.push({
        violatedDirective: e.violatedDirective,
        effectiveDirective: e.effectiveDirective,
        blockedURI: e.blockedURI,
        disposition: e.disposition,
        sourceFile: e.sourceFile,
      });
    });
  });

  return {
    consoleMessages: () => [...consoleLog],
    violations: async () => {
      const all: Violation[] = [];
      let main: Violation[] | undefined;
      for (const frame of page.frames()) {
        try {
          const list = await frame.evaluate(() => window.__cspViolations);
          if (frame === page.mainFrame()) main = list;
          if (list) all.push(...list);
        } catch {
          // ブロックされた iframe（エラーページ）などは評価できない。違反は親のドキュメント側に出る
        }
      }
      // リスナーが入っていないと「違反 0 件」が素通りするため、メインフレームで未定義なら失敗にする
      if (main === undefined) throw new Error("window.__cspViolations が未定義です（リスナーが仕込まれていません）");
      return all;
    },
  };
}

export function describeViolations(list: Violation[]): string {
  return list
    .map(
      (v) =>
        `${v.violatedDirective} (effective: ${v.effectiveDirective}) blocked=${v.blockedURI} disposition=${v.disposition} source=${v.sourceFile}`,
    )
    .join("\n");
}

/** イベントとコンソールの 2 系統で違反 0 件を確かめる */
export async function expectNoViolations(c: CspCollector, where: string): Promise<void> {
  const list = await c.violations();
  expect(list, `${where} で CSP 違反イベントが ${list.length} 件\n${describeViolations(list)}`).toEqual([]);
  const logs = c.consoleMessages();
  expect(logs, `${where} で CSP 関連のコンソール出力が ${logs.length} 件\n${logs.join("\n")}`).toEqual([]);
}
