/**
 * @jest-environment node
 */
// 静的出力（qr_code_create-01z.1）: ルートレイアウトを (ja) と en に分割した後も、
// 主要ページが静的 HTML として出力され、動的レンダリングを招く API を使っていないことを固定する。
// ビルド成果物のブロックは .next/server/app が無ければ skip（REQUIRE_BUILD_OUTPUT=1 なら fail）。
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const APP = path.join(ROOT, "src", "app");
const BUILD_APP = path.join(ROOT, ".next", "server", "app");

// 前提: このブロックは `npm run build` の成果物（.next/server/app）に依存する。
// - .next/server/app が無ければ skip する（ビルドしていない環境で jest 全件を回せるように）。
// - 環境変数 REQUIRE_BUILD_OUTPUT=1 のときは skip せず、成果物が無ければ
//   「`npm run build` 後に実行してください」で fail する（ビルド後の検証で使う）。
// 下の「動的レンダリングを招く API」ブロックはソースだけを読むので常に実行する。
const REQUIRE_BUILD_OUTPUT = process.env.REQUIRE_BUILD_OUTPUT === "1";
const describeBuildOutput =
  REQUIRE_BUILD_OUTPUT || fs.existsSync(BUILD_APP) ? describe : describe.skip;

describeBuildOutput("ビルド成果物の静的 HTML", () => {
  it.each(["index.html", "en.html", "create.html", "guide/getting-started.html"])(
    ".next/server/app/%s が存在すること",
    (file) => {
      const full = path.join(BUILD_APP, ...file.split("/"));
      if (!fs.existsSync(full)) {
        throw new Error(
          `${full} がありません。静的に出力されていないか、ビルド前です。\`npm run build\` 後に実行してください。`
        );
      }
      expect(fs.existsSync(full)).toBe(true);
    }
  );
});

describe("動的レンダリングを招く API を使っていないこと", () => {
  const DYNAMIC_API = /\bheaders\(|\bcookies\(|\bsearchParams\b/;

  const listFiles = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFiles(full);
      return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
    });

  const targets = [
    ...listFiles(path.join(APP, "en")),
    path.join(ROOT, "src", "components", "layout", "RootShell", "RootShell.tsx"),
    path.join(APP, "(ja)", "layout.tsx"),
  ];

  it("対象ファイルが 1 件以上あること", () => {
    expect(targets.length).toBeGreaterThan(2);
  });

  it.each(targets.map((t) => [path.relative(ROOT, t), t]))(
    "%s に headers( / cookies( / searchParams が無いこと",
    (_label, file) => {
      expect(fs.readFileSync(file, "utf8")).not.toMatch(DYNAMIC_API);
    }
  );
});
