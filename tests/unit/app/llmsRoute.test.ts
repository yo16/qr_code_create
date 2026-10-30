/**
 * @jest-environment node
 */
import { GET, dynamic } from "@/app/llms.txt/route";
import { buildLlmsTxt } from "@/lib/seo/llmsTxt";

describe("llms.txt route", () => {
  it("GET が 200 を返すこと", () => {
    expect(GET().status).toBe(200);
  });

  it("Content-Type が text/plain; charset=utf-8 であること", () => {
    expect(GET().headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
  });

  it("本文が buildLlmsTxt() と同じで、空でないこと", async () => {
    const body = await GET().text();
    expect(body.length).toBeGreaterThan(0);
    expect(body).toBe(buildLlmsTxt());
  });

  it("dynamic が force-static であること", () => {
    expect(dynamic).toBe("force-static");
  });
});
