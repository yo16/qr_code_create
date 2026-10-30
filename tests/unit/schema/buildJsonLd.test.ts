import { buildHowToSchema } from "@/lib/schema/buildJsonLd";

type HowToStep = {
  "@type": string;
  name: string;
  text: string;
  url?: string;
};

type HowToSchema = {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  totalTime: string;
  tool: { "@type": string; name: string };
  step: HowToStep[];
};

describe("buildHowToSchema", () => {
  describe("引数あり（ガイド frontmatter から生成する HowTo）", () => {
    const baseOptions = {
      name: "QRコードの作り方（はじめての方へ）",
      description: "URL を入力してダウンロードするまでの手順を解説します。",
      steps: [
        { name: "URLを入力する", text: "QRコードにしたい URL を入力します。" },
        { name: "ダウンロードする", text: "PNG / SVG / PDF でダウンロードします。" },
      ],
    };

    // 意図: 引数で渡した name / description がそのまま反映され、@type は 'HowTo' のままであること。
    //       現状の実装は引数を無視して UTM 版を返すため、このテストは Red になる。
    it("name / description が引数の値で反映され、@type が 'HowTo' であること", () => {
      const schema = buildHowToSchema(baseOptions) as HowToSchema;
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("HowTo");
      expect(schema.name).toBe(baseOptions.name);
      expect(schema.description).toBe(baseOptions.description);
    });

    // 意図: step は渡した件数と一致し、各要素が @type 'HowToStep' と name / text を持つこと。
    it("step が渡した件数で、各要素が @type 'HowToStep' と name / text を持つこと", () => {
      const schema = buildHowToSchema(baseOptions) as HowToSchema;
      expect(schema.step).toHaveLength(baseOptions.steps.length);
      schema.step.forEach((step, i) => {
        expect(step["@type"]).toBe("HowToStep");
        expect(step.name).toBe(baseOptions.steps[i].name);
        expect(step.text).toBe(baseOptions.steps[i].text);
      });
    });

    // 意図: url は任意。渡した要素には url が入り、渡さなかった要素には url キー自体が無いこと
    //       （JSON-LD に url: undefined のような不要キーを残さない）。
    it("url を渡した step には url が入り、渡さない step には url キーが無いこと", () => {
      const schema = buildHowToSchema({
        ...baseOptions,
        steps: [
          { ...baseOptions.steps[0], url: "https://example.com/guide/x#step-1" },
          { ...baseOptions.steps[1] },
        ],
      }) as HowToSchema;
      expect(schema.step).toHaveLength(2);
      expect(schema.step[0].url).toBe("https://example.com/guide/x#step-1");
      expect(Object.keys(schema.step[1])).not.toContain("url");
    });

    // 意図: totalTime を省略した場合は既定値 'PT3M' を使うこと。
    it("totalTime 未指定の場合は 'PT3M' であること", () => {
      const schema = buildHowToSchema(baseOptions) as HowToSchema;
      expect(schema.totalTime).toBe("PT3M");
    });

    // 意図: totalTime を指定した場合はその値がそのまま使われること。
    //       現状の実装は引数を無視して 'PT3M' 固定のため、このテストは Red になる。
    it("totalTime を指定した場合はその値が使われること", () => {
      const schema = buildHowToSchema({ ...baseOptions, totalTime: "PT5M" }) as HowToSchema;
      expect(schema.totalTime).toBe("PT5M");
    });

    // 意図: 引数ありでも tool（QR Code Create）が共通で付与されること。
    it("tool.name が 'QR Code Create' であること", () => {
      const schema = buildHowToSchema(baseOptions) as HowToSchema;
      expect(schema.tool["@type"]).toBe("HowToTool");
      expect(schema.tool.name).toBe("QR Code Create");
    });
  });
});
