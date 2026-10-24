import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrackedLink } from "@/components/analytics/TrackedLink";

/**
 * TrackedLink のテスト（qr_code_create-pa6）
 *
 * next/link の Link を包み、クリック時に trackCtaClicked(buttonText, location) を送る
 * クライアントコンポーネント。next/link は実物を使う（jsdom では <a> として描画され、
 * ルーターが無い環境では onClick を呼んだあと遷移処理に進まない）。
 * 契約: children が string なら既定の buttonText、要素なら buttonText 必須。
 *       渡された onClick は追跡の後に呼ぶ。location / buttonText / onClick 以外の props は Link に透過。
 */

jest.mock("@/lib/analytics/events", () => ({
  trackCtaClicked: jest.fn(),
}));

const { trackCtaClicked } = jest.requireMock("@/lib/analytics/events") as {
  trackCtaClicked: jest.Mock;
};

describe("TrackedLink", () => {
  beforeEach(() => {
    // 呼び出し順のテストで mockImplementation を使うため、実装ごとリセットする
    trackCtaClicked.mockReset();
  });

  describe("描画", () => {
    it("href と className が <a> に渡ること", () => {
      // 意図: 遷移先と見た目に関わる props が TrackedLink で握り潰されず、そのまま <a> に届くこと
      render(
        <TrackedLink href="/create" className="cta-link" location="hero">
          無料でQRコードを作成
        </TrackedLink>
      );
      const link = screen.getByRole("link", { name: "無料でQRコードを作成" });
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "/create");
      expect(link).toHaveClass("cta-link");
    });

    it("Link のほかの props（aria-label など）が透過すること", () => {
      // 意図: アクセシビリティ属性のような Link の任意 props が落ちないこと（...rest の透過）
      render(
        <TrackedLink href="/guide" location="hero" aria-label="使い方のページへ">
          使い方を見る
        </TrackedLink>
      );
      expect(screen.getByRole("link", { name: "使い方のページへ" })).toHaveAttribute(
        "href",
        "/guide"
      );
    });

    it("children が要素のとき、その要素がリンクの中に描画されること", () => {
      // 意図: Button を包む使い方（HeroSection / CtaSection）で中身がそのまま出ること
      render(
        <TrackedLink href="/create" location="hero" buttonText="無料でQRコードを作成">
          <button type="button">無料でQRコードを作成</button>
        </TrackedLink>
      );
      const link = screen.getByRole("link", { name: "無料でQRコードを作成" });
      expect(link.querySelector("button")).not.toBeNull();
    });
  });

  describe("クリック計測", () => {
    it("描画しただけでは trackCtaClicked が呼ばれないこと", () => {
      // 意図: 表示時に計測が飛んでクリック率が過大評価されないこと
      render(
        <TrackedLink href="/create" location="hero">
          無料でQRコードを作成
        </TrackedLink>
      );
      expect(trackCtaClicked).not.toHaveBeenCalled();
    });

    it("children が文字列のとき、クリックで trackCtaClicked(children, location) が 1 回呼ばれること", () => {
      // 意図: buttonText を省略した場合は children の文言が既定の button_text になること（Header / MobileNav の使い方）
      render(
        <TrackedLink href="/create" location="header">
          QRコード生成
        </TrackedLink>
      );
      fireEvent.click(screen.getByRole("link", { name: "QRコード生成" }));
      expect(trackCtaClicked).toHaveBeenCalledTimes(1);
      expect(trackCtaClicked).toHaveBeenCalledWith("QRコード生成", "header");
    });

    it("children が要素のとき、buttonText が button_text として送られること", () => {
      // 意図: 要素からは文言を取れないので、明示した buttonText がそのまま送られること
      render(
        <TrackedLink href="/create" location="top_bottom" buttonText="無料でQRコードを作成する">
          <span>
            無料で<strong>QRコード</strong>を作成する
          </span>
        </TrackedLink>
      );
      fireEvent.click(screen.getByRole("link"));
      expect(trackCtaClicked).toHaveBeenCalledTimes(1);
      expect(trackCtaClicked).toHaveBeenCalledWith("無料でQRコードを作成する", "top_bottom");
    });

    it("children が文字列でも buttonText を指定すればそちらが優先されること", () => {
      // 意図: 表示文言と GA 上の文言を分けたいときに buttonText が優先されること（?? の評価順）
      render(
        <TrackedLink href="/create" location="hero" buttonText="計測用の文言">
          表示用の文言
        </TrackedLink>
      );
      fireEvent.click(screen.getByRole("link", { name: "表示用の文言" }));
      expect(trackCtaClicked).toHaveBeenCalledWith("計測用の文言", "hero");
    });

    it("リンク内のボタンをクリックしても <a> の onClick に届いて計測されること", () => {
      // 意図: HeroSection などでユーザーが実際に押すのはリンク内の Button。バブリングで計測されること
      render(
        <TrackedLink href="/create" location="hero" buttonText="無料でQRコードを作成">
          <button type="button">無料でQRコードを作成</button>
        </TrackedLink>
      );
      fireEvent.click(screen.getByRole("button", { name: "無料でQRコードを作成" }));
      expect(trackCtaClicked).toHaveBeenCalledTimes(1);
      expect(trackCtaClicked).toHaveBeenCalledWith("無料でQRコードを作成", "hero");
    });

    it("渡した onClick が、追跡（trackCtaClicked）の後に同じクリックイベントで呼ばれること", () => {
      // 意図: MobileNav はメニューを閉じる onClick を渡す。閉じる処理でアンマウントされても計測が漏れないよう、
      //       追跡 → onClick の順で、onClick にはクリックイベントがそのまま渡ること
      const order: string[] = [];
      trackCtaClicked.mockImplementation(() => {
        order.push("track");
      });
      const onClick = jest.fn(() => {
        order.push("onClick");
      });
      render(
        <TrackedLink href="/create" location="mobile_nav" onClick={onClick}>
          QRコード生成
        </TrackedLink>
      );
      fireEvent.click(screen.getByRole("link", { name: "QRコード生成" }));
      expect(order).toEqual(["track", "onClick"]);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: "click" }));
    });
  });
});
