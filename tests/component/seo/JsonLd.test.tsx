import React from "react";
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { JsonLd, serializeJsonLd } from "@/components/seo/JsonLd";

function ssr(data: Record<string, unknown>): string {
  return renderToStaticMarkup(<JsonLd data={data} />);
}

/** SSR の HTML について、script の中身(開始タグと最後の閉じタグの間)を返す */
function inner(html: string): string {
  const start = html.indexOf(">") + 1;
  const end = html.toLowerCase().lastIndexOf("</script");
  return html.slice(start, end);
}

describe("serializeJsonLd", () => {
  it("通常の値は JSON.parse で元に戻る", () => {
    const data = { "@type": "WebSite", name: "QR", n: 1, list: [1, "a", null], nested: { a: true } };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("</script> を含む値は < がエスケープされ、パースすると元に戻る", () => {
    const data = { name: "</script><script>alert(1)" };
    const out = serializeJsonLd(data);
    expect(out).not.toContain("<");
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out)).toEqual(data);
  });

  it("U+2028 / U+2029 がエスケープされ、パースすると元に戻る", () => {
    const data = { a: "x\u2028y\u2029z" };
    const out = serializeJsonLd(data);
    expect(out).not.toContain("\u2028");
    expect(out).not.toContain("\u2029");
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
    expect(JSON.parse(out)).toEqual(data);
  });

  it("キー側の < もエスケープされる", () => {
    const data = { "</script>": "v" };
    const out = serializeJsonLd(data);
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual(data);
  });

  it("空オブジェクトを扱える", () => {
    expect(serializeJsonLd({})).toBe("{}");
  });
});

describe("JsonLd コンポーネント(DOM)", () => {
  it("application/ld+json の script として描画される", () => {
    const { container } = render(<JsonLd data={{ name: "QR" }} />);
    const script = container.querySelector("script");
    expect(script).not.toBeNull();
    expect(script?.getAttribute("type")).toBe("application/ld+json");
    expect(JSON.parse(script?.innerHTML ?? "")).toEqual({ name: "QR" });
  });
});

describe("JsonLd の SSR 出力(renderToStaticMarkup)", () => {
  const payloads: [string, Record<string, unknown>][] = [
    ["</script><script>alert(1)", { name: "</script><script>alert(1)" }],
    ["大文字の </SCRIPT>", { name: "a</SCRIPT><img src=x onerror=alert(1)>" }],
    ["<!-- コメント開始", { name: "<!-- evil <script>" }],
    ["<script> の入れ子", { name: "<script><script>alert(1)</script></script>" }],
    ["ネストしたオブジェクト", { a: { b: { c: "</script><script>alert(1)" } } }],
    ["配列の中", { list: ["ok", ["</script>"], { x: "</ScRiPt>" }] }],
    ["キー", { "</script><b>": "v" }],
  ];

  it.each(payloads)("%s: 閉じタグが出力全体でちょうど 1 回だけ", (_n, data) => {
    const html = ssr(data);
    expect(html.toLowerCase().split("</script").length - 1).toBe(1);
    expect(html.toLowerCase().endsWith("</script>")).toBe(true);
  });

  it.each(payloads)("%s: 開始タグと最後の閉じタグの間に < が無い", (_n, data) => {
    expect(inner(ssr(data))).not.toContain("<");
  });

  it.each(payloads)("%s: 中身を JSON.parse すると元の値に戻る", (_n, data) => {
    expect(JSON.parse(inner(ssr(data)))).toEqual(data);
  });

  it("対照: エスケープされた </script> が \\u003c/script> として含まれる", () => {
    const html = ssr({ name: "</script>" });
    expect(html).toContain("\\u003c/script>");
  });

  it("対照: 通常の値は < を含まず、そのまま出力される", () => {
    const html = ssr({ name: "QR" });
    expect(inner(html)).toBe('{"name":"QR"}');
  });
});
