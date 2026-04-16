import fs from "fs";
import path from "path";

describe("Tooltip.module.css の .tooltip 幅指定", () => {
  const cssPath = path.join(
    process.cwd(),
    "src/components/ui/Tooltip/Tooltip.module.css"
  );
  const content = fs.readFileSync(cssPath, "utf-8");
  const tooltipBlock = content.match(/\.tooltip\s*\{[^}]*\}/s)?.[0] ?? "";

  it(".tooltip ブロックが存在すること", () => {
    expect(tooltipBlock).not.toBe("");
  });

  it(".tooltip に width: max-content が指定されていること（shrink-to-fit 収縮防止）", () => {
    expect(tooltipBlock).toMatch(/width:\s*max-content/);
  });

  it(".tooltip に max-width: 240px が指定されていること（上限幅）", () => {
    expect(tooltipBlock).toMatch(/max-width:\s*240px/);
  });

  it(".tooltip に white-space: normal が指定されていること（改行許可）", () => {
    expect(tooltipBlock).toMatch(/white-space:\s*normal/);
  });

  it(".tooltip から死にコードの white-space: nowrap が削除されていること", () => {
    expect(tooltipBlock).not.toMatch(/white-space:\s*nowrap/);
  });
});
