import fs from "fs";
import path from "path";

/**
 * 記事の表の枠線（qr_code_create-ttm）。
 * MDXRemote で記事を描くすべてのファイルが読む CSS Module に、th / td の枠線の規則があること。
 */

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const mdxUsers = walk(SRC).filter(
  (f) => /\.(tsx|ts)$/.test(f) && fs.readFileSync(f, "utf-8").includes("MDXRemote")
);

function cssModulesOf(file: string): string[] {
  const text = fs.readFileSync(file, "utf-8");
  const out: string[] = [];
  const re = /import\s+\w+\s+from\s+["'](\.[^"']+\.module\.css)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(path.resolve(path.dirname(file), m[1]));
  }
  return out;
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** セレクタに th または td を含み、border に var(--table-border) を使う規則があるか */
function hasBorderRule(css: string, tag: "th" | "td"): boolean {
  const rules = stripComments(css).match(/[^{}]+\{[^{}]*\}/g) ?? [];
  return rules.some((r) => {
    const selector = r.slice(0, r.indexOf("{"));
    const body = r.slice(r.indexOf("{"));
    return (
      new RegExp(`:global\\(${tag}\\)`).test(selector) &&
      /border\s*:\s*var\(--table-border\)/.test(body)
    );
  });
}

/** 表に関する規則（table / th / td を含むセレクタ）を空白を詰めて連結する */
function tableRules(css: string): string {
  const text = stripComments(css);
  const out: string[] = [];
  const re = /([^{}]*:global\((?:table|th|td)\)[^{}]*)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(`${m[1].replace(/\s+/g, " ").trim()}{${m[2].replace(/\s+/g, " ").trim()}}`);
  }
  return out.join("\n");
}

describe("記事の表の枠線の規則（静的検査）", () => {
  it("MDXRemote を使うファイルが 3 つ以上見つかる（検出が空振りしていない）", () => {
    expect(mdxUsers.length).toBeGreaterThanOrEqual(3);
  });

  it.each(mdxUsers.map((f) => [path.relative(ROOT, f), f]))(
    "%s が import する CSS Module に th と td の border: var(--table-border) がある",
    (_name, file) => {
      const modules = cssModulesOf(file);
      expect(modules.length).toBeGreaterThan(0);
      const css = modules.map((m) => fs.readFileSync(m, "utf-8")).join("\n");
      expect(hasBorderRule(css, "th")).toBe(true);
      expect(hasBorderRule(css, "td")).toBe(true);
    }
  );

  it("ガイド・ブログ・用途別の 3 つの CSS の表の規則が同一である", () => {
    const files = [
      "src/components/pages/GuideArticlePageView/guide.module.css",
      "src/app/(ja)/(marketing)/blog/[slug]/blog.module.css",
      "src/app/(ja)/(marketing)/use-cases/[slug]/use-case.module.css",
    ];
    const rules = files.map((f) => tableRules(fs.readFileSync(path.join(ROOT, f), "utf-8")));
    expect(rules[0]).not.toBe("");
    expect(rules[1]).toBe(rules[0]);
    expect(rules[2]).toBe(rules[0]);
  });
});

describe("globals.css の --color-table-border のコントラスト", () => {
  const css = fs.readFileSync(path.join(SRC, "app/globals.css"), "utf-8");

  function resolveVar(name: string, depth = 0): string {
    const m = css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
    if (!m) throw new Error(`${name} が globals.css にない`);
    const value = m[1].trim();
    const ref = value.match(/^var\((--[\w-]+)\)$/);
    if (ref) {
      if (depth > 5) throw new Error("var の参照が深すぎる");
      return resolveVar(ref[1], depth + 1);
    }
    return value;
  }

  function luminance(hex: string): number {
    const m = hex.match(/^#([0-9a-f]{6})$/i);
    if (!m) throw new Error(`色が #rrggbb でない: ${hex}`);
    const [r, g, b] = [0, 2, 4].map((i) => {
      const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function ratio(a: string, b: string): number {
    const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  }

  const border = resolveVar("--color-table-border");

  it("白（#ffffff）に対して 3:1 以上", () => {
    expect(ratio(border, "#ffffff")).toBeGreaterThanOrEqual(3);
  });

  it("--color-surface に対して 3:1 以上", () => {
    expect(ratio(border, resolveVar("--color-surface"))).toBeGreaterThanOrEqual(3);
  });

  it("--table-border が 1px solid var(--color-table-border) である", () => {
    const m = css.match(/--table-border\s*:\s*([^;]+);/);
    expect(m?.[1].trim()).toBe("1px solid var(--color-table-border)");
  });
});
