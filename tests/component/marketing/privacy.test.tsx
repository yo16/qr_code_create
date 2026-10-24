import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, within } from "@testing-library/react";
import PrivacyPage from "@/app/(marketing)/privacy/page";
import { trackUtmSet, flushPendingEvents } from "@/lib/analytics/events";

describe("PrivacyPage", () => {
  describe("見出し・日付", () => {
    it("「プライバシーポリシー」見出しが表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByRole("heading", { level: 1, name: "プライバシーポリシー" })).toBeInTheDocument();
    });

    it("「最終更新日」が表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByText(/最終更新日/)).toBeInTheDocument();
    });
  });

  describe("主要セクション", () => {
    it("「収集する情報」セクションが表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByRole("heading", { name: /収集する情報/ })).toBeInTheDocument();
    });

    it("「アクセス解析ツール」セクションが表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByRole("heading", { name: /アクセス解析ツール/ })).toBeInTheDocument();
    });

    it("「ロゴ画像のアップロード」セクションが表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByRole("heading", { name: /ロゴ画像のアップロード/ })).toBeInTheDocument();
    });

    it("「第三者への情報提供」セクションが表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByRole("heading", { name: /第三者への情報提供/ })).toBeInTheDocument();
    });
  });

  describe("ロゴ画像の取り扱い", () => {
    it("ロゴ画像がサーバーにアップロードされない旨が記載されていること", () => {
      render(<PrivacyPage />);
      expect(screen.getByText(/サーバーにアップロードされることはありません/)).toBeInTheDocument();
    });
  });

  describe("GA4 に送る値との整合（qr_code_create-iza）", () => {
    // 見出しから親の <section> を取り、節の中だけを検査するためのヘルパー
    const getSectionByHeading = (name: RegExp): HTMLElement => {
      const heading = screen.getByRole("heading", { name });
      const section = heading.closest("section");
      if (!section) throw new Error(`見出し ${name} を含む section が見つかりません`);
      return section;
    };

    it("最終更新日が 2026年10月24日 であること", () => {
      // 意図: 記述を改めた日付がページに反映されていること（古い日付のまま残る回帰を防ぐ）
      render(<PrivacyPage />);
      expect(screen.getByText("最終更新日: 2026年10月24日")).toBeInTheDocument();
    });

    it("「収集する情報」節に、ブラウザ内で完結する旨とサーバーに送信も保存もしない旨があること", () => {
      // 意図: 「送信・保存しない」対象が URL 全体・画像・本文であることを、節の中で明記していること
      render(<PrivacyPage />);
      const section = getSectionByHeading(/収集する情報/);
      expect(within(section).getByText(/ブラウザ内で完結/)).toBeInTheDocument();
      expect(within(section).getByText(/当サービスのサーバーに送信も保存もされません/)).toBeInTheDocument();
    });

    it("「アクセス解析ツール」節の一覧が 7 項目で、ドメイン・UTM・ロゴ種類・ダウンロード形式を含むこと", () => {
      // 意図: events.ts が送っている値の種類（ドメイン、UTM 値、装飾、キャプション長、ロゴ種類、生成・DL、UI 操作）が
      //       漏れなく列挙されていること。項目数の変化で送信項目と説明のズレに気づく
      render(<PrivacyPage />);
      const section = getSectionByHeading(/アクセス解析ツール/);
      const items = within(section).getAllByRole("listitem");
      expect(items).toHaveLength(7);

      const texts = items.map((li) => li.textContent ?? "");
      expect(texts.some((t) => t.includes("入力したURLのドメイン部分"))).toBe(true);
      expect(texts.some((t) => t.includes("UTMパラメータの値"))).toBe(true);
      expect(texts.some((t) => t.includes("ロゴ画像の種類"))).toBe(true);
      expect(texts.some((t) => t.includes("ダウンロード形式"))).toBe(true);
    });

    it("送らない情報（URL 全体・QR 画像・ロゴ画像そのもの・キャプション本文）を明記していること", () => {
      // 意図: 「何を送らないか」の否定文が一字一句そのまま残っていること（曖昧な表現への後退を防ぐ）
      render(<PrivacyPage />);
      expect(
        screen.getByText("入力したURLの全体、QRコード画像、ロゴ画像そのもの、キャプションの本文は送りません。")
      ).toBeInTheDocument();
    });

    it("Google Analytics が自動で集める情報がある旨を明記していること", () => {
      // 意図: 列挙した値以外にも GA が自動収集する情報（ページ URL、参照元、端末情報）があることを隠さないこと
      render(<PrivacyPage />);
      expect(screen.getByText(/Google Analyticsが自動で集める情報があります/)).toBeInTheDocument();
    });

    it("「Googleのポリシー」リンクが partner-sites を指し、別タブで安全に開くこと", () => {
      // 意図: Google 側のデータ利用説明への正しい URL を示し、target=_blank に noopener/noreferrer が伴うこと
      render(<PrivacyPage />);
      const link = screen.getByRole("link", { name: "Googleのポリシー" });
      expect(link).toHaveAttribute("href", "https://policies.google.com/technologies/partner-sites");
      expect(link).toHaveAttribute("target", "_blank");
      const relTokens = (link.getAttribute("rel") ?? "").split(/\s+/);
      expect(relTokens).toContain("noopener");
      expect(relTokens).toContain("noreferrer");
    });

    it("「第三者への情報提供」節に、計測の値が Google に送られる補足があること", () => {
      // 意図: 「第三者に提供しない」という原則文と GA 送信が矛盾しないよう、例外として Google を明示していること
      render(<PrivacyPage />);
      const section = getSectionByHeading(/第三者への情報提供/);
      expect(within(section).getByText(/Googleに送られます/)).toBeInTheDocument();
    });

    it("旧記述「サーバーには送信・保存されません」と「匿名」が本文に残っていないこと", () => {
      // 意図: 回帰防止。GA4 送信内容と矛盾していた旧表現、および根拠のない「匿名」表現が復活していないこと
      const { container } = render(<PrivacyPage />);
      const text = container.textContent ?? "";
      expect(text).not.toContain("サーバーには送信・保存されません");
      expect(text).not.toContain("匿名");
    });

    it("ポリシーが根拠にしている送信項目が events.ts に存在し、送らないはずの項目が存在しないこと", () => {
      // 意図: ポリシーの記述は events.ts の実装を根拠にしている。実装側のパラメータ名が消えたり、
      //       URL 全体・キャプション本文・ロゴ画像データのような項目が追加されたりしたら、この節の記述を見直す必要がある
      const source = fs.readFileSync(
        path.join(process.cwd(), "src", "lib", "analytics", "events.ts"),
        "utf-8"
      );

      // 列挙している項目の根拠となるパラメータ名（ソース上に文字どおり現れるもの）
      expect(source).toContain("url_domain");
      expect(source).toContain("foreground_color");
      expect(source).toContain("caption_length");
      expect(source).toContain("file_size_kb");
      // "format" は語として一般的すぎるため、qr_downloaded のパラメータキーとして現れることを確認する
      expect(source).toContain("qr_downloaded");
      expect(source).toMatch(/\bformat:/);

      // utm_source_value はソース上では `utm_${paramName}_value` と組み立てられ文字どおりには現れないため、
      // 実際に送信されるキー名を gtag のモックで確認する（debounce は flushPendingEvents で即時送信）
      window.gtag = jest.fn();
      try {
        trackUtmSet("source", "google", "dropdown");
        flushPendingEvents();
        expect(window.gtag).toHaveBeenCalledWith(
          "event",
          "utm_source_set",
          expect.objectContaining({ utm_source_value: "google" })
        );
      } finally {
        (window as unknown as Record<string, unknown>).gtag = undefined;
      }

      // ポリシーで「送らない」と明記している種類の項目が実装に無いこと
      expect(source).not.toContain("url_full");
      expect(source).not.toContain("caption_text");
      expect(source).not.toContain("logo_data");
    });
  });
});
