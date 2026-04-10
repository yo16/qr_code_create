import {
  UTM_SOURCE_OPTIONS,
  UTM_MEDIUM_OPTIONS,
  UTM_FIELD_HELP,
  UTM_USAGE_EXAMPLES,
} from "@/lib/constants/utmPresets";

describe("utmPresets", () => {
  describe("UTM_SOURCE_OPTIONS", () => {
    it("空でないこと", () => {
      expect(UTM_SOURCE_OPTIONS.length).toBeGreaterThan(0);
    });

    it("全てのオプションがvalueとlabelを持つこと", () => {
      for (const option of UTM_SOURCE_OPTIONS) {
        expect(option).toHaveProperty("value");
        expect(option).toHaveProperty("label");
        expect(typeof option.value).toBe("string");
        expect(typeof option.label).toBe("string");
        expect(option.value.length).toBeGreaterThan(0);
        expect(option.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("UTM_MEDIUM_OPTIONS", () => {
    it("空でないこと", () => {
      expect(UTM_MEDIUM_OPTIONS.length).toBeGreaterThan(0);
    });

    it("全てのオプションがvalueとlabelを持つこと", () => {
      for (const option of UTM_MEDIUM_OPTIONS) {
        expect(option).toHaveProperty("value");
        expect(option).toHaveProperty("label");
        expect(typeof option.value).toBe("string");
        expect(typeof option.label).toBe("string");
        expect(option.value.length).toBeGreaterThan(0);
        expect(option.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("UTM_USAGE_EXAMPLES", () => {
    it("空でないこと", () => {
      expect(UTM_USAGE_EXAMPLES.length).toBeGreaterThan(0);
    });

    it("全てのexampleがlabel/source/medium/campaignを持つこと", () => {
      for (const example of UTM_USAGE_EXAMPLES) {
        expect(example).toHaveProperty("label");
        expect(example).toHaveProperty("source");
        expect(example).toHaveProperty("medium");
        expect(example).toHaveProperty("campaign");
        expect(typeof example.label).toBe("string");
        expect(typeof example.source).toBe("string");
        expect(typeof example.medium).toBe("string");
        expect(typeof example.campaign).toBe("string");
      }
    });
  });

  describe("UTM_FIELD_HELP", () => {
    it("5フィールド分のヘルプが存在すること", () => {
      const fields = ["source", "medium", "campaign", "term", "content"] as const;
      for (const field of fields) {
        expect(UTM_FIELD_HELP).toHaveProperty(field);
        expect(typeof UTM_FIELD_HELP[field]).toBe("string");
        expect(UTM_FIELD_HELP[field].length).toBeGreaterThan(0);
      }
    });
  });
});
