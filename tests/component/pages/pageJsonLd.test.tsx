import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomePageView } from "@/components/pages/HomePageView/HomePageView";
import { CreatePageView } from "@/components/pages/CreatePageView/CreatePageView";
import { LOCALES } from "@/i18n/locales";
import { localePath } from "@/lib/i18n/routes";

/**
 * qr_code_create-gx4: トップは WebSite と Organization、/create は WebApplication を出す。
 */
jest.mock("@/components/pages/CreatePageView/QrGeneratorLoader", () => ({
  QrGeneratorLoader: () => <div data-testid="qr-generator-loader" />,
}));

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

type JsonLdNode = { "@type": string; url?: string; "@id"?: string; publisher?: { "@id": string } };

function jsonLdOf(html: string): JsonLdNode[] {
  const scripts = Array.from(
    html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
    (m) => m[1]
  );
  return scripts.map((s) => JSON.parse(s) as JsonLdNode);
}

const typesOf = (nodes: JsonLdNode[]) => nodes.map((n) => n["@type"]);

describe.each(LOCALES)("HomePageView JSON-LD locale=%s", (locale) => {
  const nodes = jsonLdOf(renderToStaticMarkup(<HomePageView locale={locale} />));

  it("WebSite と Organization を 1 件ずつ含み、WebApplication を含まない", () => {
    const types = typesOf(nodes);
    expect(types.filter((t) => t === "WebSite")).toHaveLength(1);
    expect(types.filter((t) => t === "Organization")).toHaveLength(1);
    expect(types).not.toContain("WebApplication");
  });

  it("WebSite の url がその言語のトップで、publisher が Organization の @id を指す", () => {
    const site = nodes.find((n) => n["@type"] === "WebSite");
    const org = nodes.find((n) => n["@type"] === "Organization");
    expect(site?.url).toBe(`${SITE_URL}${localePath(locale, "/")}`);
    expect(org?.["@id"]).toBeDefined();
    expect(site?.publisher?.["@id"]).toBe(org?.["@id"]);
  });
});

describe.each(LOCALES)("CreatePageView JSON-LD locale=%s", (locale) => {
  const nodes = jsonLdOf(renderToStaticMarkup(<CreatePageView locale={locale} />));

  it("WebApplication が 1 件だけ", () => {
    expect(typesOf(nodes).filter((t) => t === "WebApplication")).toHaveLength(1);
  });

  it("WebApplication を含み、その url がその言語の /create", () => {
    const app = nodes.find((n) => n["@type"] === "WebApplication");
    expect(app).toBeDefined();
    expect(app?.url).toBe(`${SITE_URL}${localePath(locale, "/create")}`);
  });

  it("WebSite と Organization は含まない", () => {
    const types = typesOf(nodes);
    expect(types).not.toContain("WebSite");
    expect(types).not.toContain("Organization");
  });
});
