/**
 * @jest-environment node
 */
// qr_code_create-dot: csp-ga の E2E で「本物を読みに行く」要求の判定 isPassThrough を、通常の npm test で守る。
import { isPassThrough } from "../../e2e/helpers/gaPassThrough";

describe("isPassThrough", () => {
  it.each([
    ["GET", "https://www.googletagmanager.com/gtag/js?id=G-XXXX"],
    ["GET", "https://www.googletagmanager.com/gtag/destination?id=G-XXXX"],
    ["GET", "https://www.googletagmanager.com:443/gtag/js"],
    ["GET", "https://WWW.GOOGLETAGMANAGER.COM/gtag/js"],
  ])("通す: %s %s", (method, url) => {
    expect(isPassThrough(method, url)).toBe(true);
  });

  it.each([
    ["POST", "https://www.googletagmanager.com/gtag/js?id=G-XXXX"],
    ["GET", "http://www.googletagmanager.com/gtag/js"],
    ["GET", "https://googletagmanager.com/gtag/js"],
    ["GET", "https://www.googletagmanager.com.evil.example/gtag/js"],
    ["GET", "https://www.googletagmanager.com@evil.example/gtag/js"],
    ["GET", "https://www.googletagmanager.com/gtagx"],
    ["GET", "https://www.googletagmanager.com/gtm.js"],
    ["GET", "https://www.googletagmanager.com/gtag/../g/collect"],
    ["GET", "https://www.google-analytics.com/g/collect"],
    ["GET", "https://region1.google-analytics.com/g/collect"],
    ["GET", "https://www.googletagmanager.com:8443/gtag/js"],
  ])("止める: %s %s", (method, url) => {
    expect(isPassThrough(method, url)).toBe(false);
  });

  it("メソッドが小文字の get なら通さない（Playwright は大文字を返す）", () => {
    expect(isPassThrough("get", "https://www.googletagmanager.com/gtag/js")).toBe(false);
  });

  it("壊れた URL は例外を投げる（黙って通さない）", () => {
    expect(() => isPassThrough("GET", "not a url")).toThrow();
    expect(() => isPassThrough("GET", "")).toThrow();
  });
});
