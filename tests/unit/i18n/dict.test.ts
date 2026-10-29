import { ja } from "@/i18n/ja";
import { getDict, getClientMessages } from "@/i18n/getDict";
import { pickClientDict } from "@/i18n/client";
import { CLIENT_SLICE_KEYS } from "@/i18n/types";

/** オブジェクトの全葉を [パス, 値] で列挙する */
function collectLeaves(
  value: unknown,
  path: string[] = []
): Array<[string, unknown]> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      collectLeaves(v, [...path, k])
    );
  }
  return [[path.join("."), value]];
}

describe("getDict / getClientMessages", () => {
  // 意図: Phase 1.5 時点では ja 辞書そのものを返す
  it('getDict("ja") は ja 辞書を返す', () => {
    expect(getDict("ja")).toBe(ja);
  });

  // 意図: Client に渡すのは CLIENT_SLICE_KEYS のスライスだけ（過不足なし）
  it('getClientMessages("ja") は CLIENT_SLICE_KEYS のスライスだけを持つ', () => {
    const messages = getClientMessages("ja");
    expect(Object.keys(messages).sort()).toEqual([...CLIENT_SLICE_KEYS].sort());
    for (const key of CLIENT_SLICE_KEYS) {
      expect(messages[key]).toEqual(ja[key]);
    }
  });

  // 意図: CLIENT_SLICE_KEYS が設計どおりの 5 スライスであること
  it("CLIENT_SLICE_KEYS は common / ui / tool / utm / decoration", () => {
    expect([...CLIENT_SLICE_KEYS].sort()).toEqual(
      ["common", "decoration", "tool", "ui", "utm"].sort()
    );
  });

  // 意図: Server スライス（header / footer / home / guide / meta / schema など）が Client に漏れない
  it("Server スライスを Client に含めない", () => {
    const messages = getClientMessages("ja") as Record<string, unknown>;
    const serverKeys = [
      ...Object.keys(ja).filter(
        (k) => !(CLIENT_SLICE_KEYS as readonly string[]).includes(k)
      ),
      "header",
      "footer",
      "home",
      "guide",
      "meta",
      "schema",
    ];
    for (const key of serverKeys) {
      expect(messages).not.toHaveProperty(key);
    }
  });

  // 意図: T2b で ja に実在するようになった Server スライスが、ja には有り Client には無いこと
  it.each(["header", "footer", "home", "guide", "meta", "schema"])(
    "Server スライス %s は ja に実在し、Client には含めない",
    (key) => {
      expect(ja).toHaveProperty(key);
      expect((CLIENT_SLICE_KEYS as readonly string[]).includes(key)).toBe(false);
      expect(getClientMessages("ja")).not.toHaveProperty(key);
    }
  );

  // 意図: Server スライスに関数値を足しても pickClientDict が落とすこと
  it("pickClientDict は Client スライス以外のキーを落とす", () => {
    const extended = {
      ...ja,
      meta: { title: (n: number) => `t${n}` },
    } as unknown as typeof ja;
    const picked = pickClientDict(extended) as Record<string, unknown>;
    expect(picked).not.toHaveProperty("meta");
  });
});

describe("Client スライスの値", () => {
  const leaves = collectLeaves(getClientMessages("ja"));

  // 意図: 葉が十分ある（走査が空振りしていない）
  it("葉を 1 つ以上走査している", () => {
    expect(leaves.length).toBeGreaterThan(50);
  });

  // 意図: RSC の props で渡すため、全葉が string（関数・数値・配列などが無い）
  it("全葉が string である", () => {
    const invalid = leaves.filter(([, v]) => typeof v !== "string");
    expect(invalid.map(([p, v]) => `${p}: ${typeof v}`)).toEqual([]);
  });

  // 意図: T2b で Client スライス（common）に追加した文言が存在し、全葉 string であること
  it.each([
    // 38x.9: 旧キー label / hint は削除済み
    ["common.languageSwitch", ["buttonLabel", "listLabel"]],
    ["common.mobileMenu", ["open", "close", "cta"]],
    ["common.notFound", ["title", "body", "link"]],
    ["common.comingSoon", ["badge", "noteLine1", "noteLine2", "create", "backToTop"]],
    ["common.articleCta", ["ariaLabel", "heading", "defaultText", "note"]],
  ] as const)("%s の葉が揃っていて全て空でない string", (prefix, keys) => {
    const sub = leaves
      .filter(([p]) => p.startsWith(`${prefix}.`))
      .map(([p, v]) => [p.slice(prefix.length + 1), v] as const);
    expect(sub.map(([k]) => k).sort()).toEqual([...keys].sort());
    for (const [, v] of sub) {
      expect(typeof v).toBe("string");
      expect(v).not.toBe("");
    }
  });

  // 意図: ja に空文字の文言が無い（移し忘れの検出）。プリセット simple の caption は
  // 辞書化前から「キャプション無し」を表す空文字なので例外として固定する
  it("空文字の葉は decoration.presets.simple.caption だけ", () => {
    const empty = collectLeaves(ja)
      .filter(([, v]) => v === "")
      .map(([p]) => p);
    expect(empty).toEqual(["decoration.presets.simple.caption"]);
  });

  // 意図: JSON 往復で値が変わらない（シリアライズ可能性の担保）
  it("JSON に往復しても同じ値になる", () => {
    const messages = getClientMessages("ja");
    expect(JSON.parse(JSON.stringify(messages))).toEqual(messages);
  });

  // 意図: プレースホルダは formatMessage が扱える {英数字} だけ（{ n } や {a.b}、閉じ忘れを検出）
  it("波括弧は {英数字} 形式のプレースホルダとしてのみ現れる", () => {
    const invalid: string[] = [];
    for (const [path, value] of leaves) {
      if (typeof value !== "string") continue;
      const stripped = value.replace(/\{[A-Za-z0-9]+\}/g, "");
      if (/[{}]/.test(stripped)) invalid.push(`${path}: ${value}`);
    }
    expect(invalid).toEqual([]);
  });
});
