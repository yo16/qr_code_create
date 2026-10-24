import { EN_AVAILABLE_PATHS, hasEnVersion } from "@/lib/i18n/routes";

/** 英語版があるページの一覧（qr_code_create-01z.5 時点）を固定する */
describe("EN_AVAILABLE_PATHS / hasEnVersion", () => {
  // 意図: T3 でトップと /create、T4 で英語ガイド getting-started が加わった
  it("EN_AVAILABLE_PATHS は / と /create と /guide/getting-started", () => {
    expect([...EN_AVAILABLE_PATHS].sort()).toEqual(["/", "/create", "/guide/getting-started"]);
  });

  // 意図: 英語版のあるページは true
  it.each(["/", "/create", "/guide/getting-started"])("hasEnVersion(%s) は true", (p) => {
    expect(hasEnVersion(p)).toBe(true);
  });

  // 意図: 英語版の無いページは false（導線を出さない判断に使う）。ガイド一覧 /guide と他のガイドは英語版が無い
  it.each(["/guide", "/faq", "/guide/utm-setup", "/privacy", "/poster"])(
    "hasEnVersion(%s) は false",
    (p) => {
      expect(hasEnVersion(p)).toBe(false);
    }
  );
});
