import fs from "fs";
import path from "path";

const LLMS_PATH = path.join(process.cwd(), "public", "llms.txt");

describe("llms.txt", () => {
  it("public/llms.txt ファイルが存在すること", () => {
    expect(fs.existsSync(LLMS_PATH)).toBe(true);
  });

  it("必須セクション ## Overview が含まれること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("## Overview");
  });

  it("必須セクション ## Features が含まれること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("## Features");
  });

  it("必須セクション ## Target Users が含まれること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("## Target Users");
  });

  it("必須セクション ## URL が含まれること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("## URL");
  });

  it("サイトURLが記載されていること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toMatch(/https?:\/\//);
  });

  it("QR Code Create のプロダクト名が含まれること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("QR Code Create");
  });
});
