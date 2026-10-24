import { EN_AVAILABLE_PATHS, hasEnVersion } from "@/lib/i18n/routes";

/** 英語版があるページの一覧（qr_code_create-01z.4 時点）を固定する */
describe("EN_AVAILABLE_PATHS / hasEnVersion", () => {
  // 意図: T3 で英語版ができたのはトップと /create だけ
  it("EN_AVAILABLE_PATHS は / と /create", () => {
    expect([...EN_AVAILABLE_PATHS].sort()).toEqual(["/", "/create"]);
  });

  // 意図: 英語版のあるページは true
  it.each(["/", "/create"])("hasEnVersion(%s) は true", (p) => {
    expect(hasEnVersion(p)).toBe(true);
  });

  // 意図: 英語版の無いページは false（導線を出さない判断に使う）
  it.each(["/guide", "/faq", "/guide/getting-started", "/privacy", "/poster"])(
    "hasEnVersion(%s) は false",
    (p) => {
      expect(hasEnVersion(p)).toBe(false);
    }
  );
});
