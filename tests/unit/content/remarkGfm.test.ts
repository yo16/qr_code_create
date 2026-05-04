import fs from "fs";
import path from "path";

describe("remark-gfm プラグイン設定", () => {
  const guidePagePath = path.join(
    process.cwd(),
    "src/app/(marketing)/guide/[slug]/page.tsx"
  );
  const useCasesPagePath = path.join(
    process.cwd(),
    "src/app/(marketing)/use-cases/[slug]/page.tsx"
  );

  it("remark-gfm パッケージがインストールされていること", () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    expect(allDeps["remark-gfm"]).toBeDefined();
  });

  it("guide/[slug]/page.tsx に remarkGfm のインポートがあること", () => {
    const content = fs.readFileSync(guidePagePath, "utf-8");
    expect(content).toMatch(/import\s+remarkGfm\s+from\s+["']remark-gfm["']/);
  });

  it("guide/[slug]/page.tsx の MDXRemote に remarkPlugins が設定されていること", () => {
    const content = fs.readFileSync(guidePagePath, "utf-8");
    expect(content).toMatch(/remarkPlugins.*remarkGfm/);
  });

  it("use-cases/[slug]/page.tsx に remarkGfm のインポートがあること", () => {
    const content = fs.readFileSync(useCasesPagePath, "utf-8");
    expect(content).toMatch(/import\s+remarkGfm\s+from\s+["']remark-gfm["']/);
  });

  it("use-cases/[slug]/page.tsx の MDXRemote に remarkPlugins が設定されていること", () => {
    const content = fs.readFileSync(useCasesPagePath, "utf-8");
    expect(content).toMatch(/remarkPlugins.*remarkGfm/);
  });
});
