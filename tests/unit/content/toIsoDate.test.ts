import matter from "gray-matter";
import { requireIsoDate, toIsoDate } from "@/lib/content/toIsoDate";

describe("toIsoDate", () => {
  it("UTC 0 時の Date を YYYY-MM-DD にすること", () => {
    expect(toIsoDate(new Date("2026-10-28T00:00:00.000Z"))).toBe("2026-10-28");
  });

  it("文字列はそのまま返すこと", () => {
    expect(toIsoDate("2026-10-28")).toBe("2026-10-28");
  });

  it.each([
    ["空文字", ""],
    ["不正な Date", new Date("invalid")],
    ["数値", 20261028],
    ["undefined", undefined],
    ["null", null],
  ])("%s は undefined になること", (_label, value) => {
    expect(toIsoDate(value)).toBeUndefined();
  });

  describe("gray-matter が読んだ frontmatter", () => {
    it("引用符なしの date（Date に変換される）が 2026-10-28 になること", () => {
      const { data } = matter("---\ndate: 2026-10-28\n---\nbody");
      expect(data.date).toBeInstanceOf(Date);
      expect(toIsoDate(data.date)).toBe("2026-10-28");
    });

    it("引用符付きの date（文字列のまま）が 2026-10-28 になること", () => {
      const { data } = matter('---\ndate: "2026-10-28"\n---\nbody');
      expect(typeof data.date).toBe("string");
      expect(toIsoDate(data.date)).toBe("2026-10-28");
    });

    it("引用符の有無で結果が同じであること", () => {
      const a = matter("---\ndate: 2026-10-28\n---\n").data.date;
      const b = matter('---\ndate: "2026-10-28"\n---\n').data.date;
      expect(toIsoDate(a)).toBe(toIsoDate(b));
    });
  });
});

describe("toIsoDate（タイムゾーンが UTC より西でも）", () => {
  const original = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "America/Los_Angeles";
  });
  afterAll(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });

  it("引用符なしの date が 2026-10-28 になること（前日にずれない）", () => {
    const { data } = matter("---\ndate: 2026-10-28\n---\nbody");
    expect(toIsoDate(data.date)).toBe("2026-10-28");
  });
});

describe("requireIsoDate", () => {
  it("正しい値はそのまま日付文字列にすること", () => {
    expect(requireIsoDate("2026-04-17", "a.mdx")).toBe("2026-04-17");
    expect(requireIsoDate(new Date("2026-04-17T00:00:00.000Z"), "a.mdx")).toBe("2026-04-17");
  });

  it.each([
    ["undefined", undefined],
    ["空文字", ""],
    ["不正な Date", new Date("invalid")],
    ["数値", 123],
  ])("%s なら source を含むエラーを投げること", (_label, value) => {
    expect(() => requireIsoDate(value, "src/content/guide/broken.mdx")).toThrow(
      /src\/content\/guide\/broken\.mdx/
    );
  });
});
