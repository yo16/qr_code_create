import {
  savePosterHandoff,
  loadPosterHandoff,
  POSTER_HANDOFF_KEY,
  MAX_URL_LENGTH,
  MAX_UTM_LENGTH,
  MAX_CAPTION_LENGTH,
  MAX_LOGO_DATA_URL_LENGTH,
} from "@/lib/handoff/posterHandoff";
import type { PosterHandoffPayload } from "@/types/poster";

type Json = Record<string, unknown>;

function validObject(): Json {
  return {
    url: "https://example.com",
    isUrlValid: true,
    utm: { source: "s", medium: "m", campaign: "c", term: "", content: "" },
    utmEnabled: true,
    decoration: {
      fgColor: "#000000",
      bgColor: "#ffffff",
      logo: null,
      frameType: null,
      caption: { text: "hello", fontSize: 14 },
      preset: null,
    },
    frameColor: "#112233",
    savedAt: new Date().toISOString(),
  };
}

function validLogo(dataUrl = "data:image/png;base64,AAAA"): Json {
  return {
    dataUrl,
    fileName: "logo.png",
    fileType: "image/png",
    fileSizeKb: 10,
    sizePercent: 20,
  };
}

function put(value: unknown): void {
  sessionStorage.setItem(
    POSTER_HANDOFF_KEY,
    typeof value === "string" ? value : JSON.stringify(value)
  );
}

function withDecoration(patch: Json): Json {
  const base = validObject();
  return { ...base, decoration: { ...(base.decoration as Json), ...patch } };
}

function withCaption(patch: Json): Json {
  return withDecoration({ caption: { text: "x", fontSize: 14, ...patch } });
}

function expectRejected(value: unknown): void {
  put(value);
  expect(loadPosterHandoff()).toBeNull();
  expect(sessionStorage.getItem(POSTER_HANDOFF_KEY)).toBeNull();
}

beforeEach(() => {
  sessionStorage.clear();
});

describe("posterHandoff 型ガード: 正常系", () => {
  it("正しい payload がそのまま読める", () => {
    const obj = validObject();
    put(obj);
    const result = loadPosterHandoff();
    expect(result).toEqual(obj);
  });

  it("frameColor の無い古い形式が読める", () => {
    const obj = validObject();
    delete obj.frameColor;
    put(obj);
    const result = loadPosterHandoff();
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("frameColor");
  });

  it("正しいロゴ(png/jpeg/svg+xml)が読める", () => {
    for (const mime of ["png", "jpeg", "svg+xml"]) {
      put(withDecoration({ logo: validLogo(`data:image/${mime};base64,QUJD+/==`) }));
      expect(loadPosterHandoff()).not.toBeNull();
    }
  });

  it("未知のフィールドは取り除かれる", () => {
    put({ ...validObject(), extra: "x" });
    expect(loadPosterHandoff()).not.toHaveProperty("extra");
  });

  it("保存値が false でも URL が正しければ isUrlValid は true になる", () => {
    put({ ...validObject(), isUrlValid: false });
    expect(loadPosterHandoff()?.isUrlValid).toBe(true);
  });
});

describe("posterHandoff isUrlValid は保存値でなく再計算される", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>1</script>",
    "ftp://example.com",
    "",
    "http://",
  ])("保存値 true でも url=%p なら、payload は読めて isUrlValid は false、url は保存値のまま", (url) => {
    put({ ...validObject(), url, isUrlValid: true });
    const result = loadPosterHandoff();
    expect(result).not.toBeNull();
    expect(result?.isUrlValid).toBe(false);
    expect(result?.url).toBe(url);
  });
});

describe("posterHandoff 型ガード: 境界値(上限ちょうどは読める)", () => {
  it("URL が 2048 文字ちょうどなら読める", () => {
    const url = "https://example.com/" + "a".repeat(MAX_URL_LENGTH - 20);
    expect(url.length).toBe(MAX_URL_LENGTH);
    put({ ...validObject(), url });
    expect(loadPosterHandoff()?.url).toBe(url);
  });

  it("UTM が 200 文字ちょうどなら読める", () => {
    const v = "a".repeat(MAX_UTM_LENGTH);
    put({ ...validObject(), utm: { source: v, medium: v, campaign: v, term: v, content: v } });
    expect(loadPosterHandoff()?.utm.source).toBe(v);
  });

  it("caption が 50 文字ちょうどなら読める", () => {
    put(withCaption({ text: "a".repeat(MAX_CAPTION_LENGTH) }));
    expect(loadPosterHandoff()?.decoration.caption.text).toHaveLength(MAX_CAPTION_LENGTH);
  });

  it.each([10, 24])("fontSize が %i なら読める", (fontSize) => {
    put(withCaption({ fontSize }));
    expect(loadPosterHandoff()?.decoration.caption.fontSize).toBe(fontSize);
  });

  it.each([10, 25])("ロゴの sizePercent が %i なら読める", (sizePercent) => {
    put(withDecoration({ logo: { ...validLogo(), sizePercent } }));
    expect(loadPosterHandoff()?.decoration.logo?.sizePercent).toBe(sizePercent);
  });

  it("dataUrl が上限ちょうどなら読める", () => {
    const prefix = "data:image/png;base64,";
    const dataUrl = prefix + "A".repeat(MAX_LOGO_DATA_URL_LENGTH - prefix.length);
    expect(dataUrl.length).toBe(MAX_LOGO_DATA_URL_LENGTH);
    put(withDecoration({ logo: validLogo(dataUrl) }));
    expect(loadPosterHandoff()).not.toBeNull();
  });
});

describe("posterHandoff 型ガード: 異常系(null を返しキーが消える)", () => {
  it("JSON でない文字列", () => {
    expectRejected("not json{");
  });

  it.each([
    ["null", null],
    ["配列", []],
    ["数値", 42],
    ["文字列", "str"],
  ])("トップレベルが %s", (_n, v) => {
    expectRejected(JSON.stringify(v));
  });

  it("url が文字列でない", () => {
    expectRejected({ ...validObject(), url: 123 });
  });

  it("url が 2049 文字", () => {
    expectRejected({ ...validObject(), url: "https://e.com/" + "a".repeat(MAX_URL_LENGTH) });
  });

  it("utmEnabled が真偽値でない", () => {
    expectRejected({ ...validObject(), utmEnabled: "true" });
  });

  it("savedAt が文字列でない", () => {
    expectRejected({ ...validObject(), savedAt: 1234 });
  });

  it("utm が null", () => {
    expectRejected({ ...validObject(), utm: null });
  });

  it("utm の値が文字列でない", () => {
    expectRejected({
      ...validObject(),
      utm: { source: 1, medium: "m", campaign: "c", term: "", content: "" },
    });
  });

  it("UTM が 201 文字", () => {
    expectRejected({
      ...validObject(),
      utm: { source: "a".repeat(MAX_UTM_LENGTH + 1), medium: "", campaign: "", term: "", content: "" },
    });
  });

  it("decoration が配列", () => {
    expectRejected({ ...validObject(), decoration: [] });
  });

  it.each(["#fff", "red", "#gggggg", "000000", 0])("fgColor が %p", (c) => {
    expectRejected(withDecoration({ fgColor: c }));
  });

  it.each(["#fff", "red"])("bgColor が %s", (c) => {
    expectRejected(withDecoration({ bgColor: c }));
  });

  it.each(["#fff", "red", 5])("frameColor が %p", (c) => {
    expectRejected({ ...validObject(), frameColor: c });
  });

  it("frameType が文字列でも null でもない", () => {
    expectRejected(withDecoration({ frameType: 1 }));
  });

  it("preset が文字列でも null でもない", () => {
    expectRejected(withDecoration({ preset: {} }));
  });

  it("caption が null", () => {
    expectRejected(withDecoration({ caption: null }));
  });

  it("caption.text が 51 文字", () => {
    expectRejected(withCaption({ text: "a".repeat(MAX_CAPTION_LENGTH + 1) }));
  });

  it("caption.text が文字列でない", () => {
    expectRejected(withCaption({ text: 5 }));
  });

  it.each([9, 25, Number.NaN, "14"])("fontSize が %p", (fontSize) => {
    expectRejected(withCaption({ fontSize }));
  });

  it("logo が文字列", () => {
    expectRejected(withDecoration({ logo: "data:image/png;base64,AAAA" }));
  });

  it.each([9, 26])("ロゴの sizePercent が %i", (sizePercent) => {
    expectRejected(withDecoration({ logo: { ...validLogo(), sizePercent } }));
  });

  it("ロゴの fileSizeKb が負", () => {
    expectRejected(withDecoration({ logo: { ...validLogo(), fileSizeKb: -1 } }));
  });

  it("ロゴの fileName が文字列でない", () => {
    expectRejected(withDecoration({ logo: { ...validLogo(), fileName: 1 } }));
  });

  it.each([
    ["data:text/html;base64,AAAA"],
    ["data:image/png;base64,AA<>AA"],
    ["data:image/png;base64,AA AA"],
    ["data:image/gif;base64,AAAA"],
    ["data:image/png,AAAA"],
    ["javascript:alert(1)"],
    ["https://example.com/a.png"],
  ])("ロゴの dataUrl が %s", (dataUrl) => {
    expectRejected(withDecoration({ logo: validLogo(dataUrl) }));
  });

  it("ロゴの dataUrl が上限 +1 文字", () => {
    const prefix = "data:image/png;base64,";
    const dataUrl = prefix + "A".repeat(MAX_LOGO_DATA_URL_LENGTH - prefix.length + 1);
    expectRejected(withDecoration({ logo: validLogo(dataUrl) }));
  });
});

describe("savePosterHandoff の caption 切り詰め", () => {
  const base: Omit<PosterHandoffPayload, "savedAt"> = {
    url: "https://example.com",
    isUrlValid: true,
    utm: { source: "", medium: "", campaign: "", term: "", content: "" },
    utmEnabled: false,
    decoration: {
      fgColor: "#000000",
      bgColor: "#ffffff",
      logo: null,
      frameType: null,
      caption: { text: "", fontSize: 14 },
      preset: null,
    },
  };

  it("51 文字以上の caption は 50 文字に切り詰めて保存され、読み出せる", () => {
    savePosterHandoff({
      ...base,
      decoration: { ...base.decoration, caption: { text: "あ".repeat(80), fontSize: 14 } },
    });
    const result = loadPosterHandoff();
    expect(result).not.toBeNull();
    expect(result?.decoration.caption.text).toBe("あ".repeat(MAX_CAPTION_LENGTH));
  });

  it("50 文字ちょうどの caption は切り詰められない", () => {
    const text = "a".repeat(MAX_CAPTION_LENGTH);
    savePosterHandoff({
      ...base,
      decoration: { ...base.decoration, caption: { text, fontSize: 14 } },
    });
    expect(loadPosterHandoff()?.decoration.caption.text).toBe(text);
  });

  it("切り詰めは渡された payload を破壊しない", () => {
    const text = "a".repeat(60);
    const input = { ...base, decoration: { ...base.decoration, caption: { text, fontSize: 14 } } };
    savePosterHandoff(input);
    expect(input.decoration.caption.text).toBe(text);
  });
});
