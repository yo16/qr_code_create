import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UtmBuilder, UtmValues } from "@/components/qr/UtmBuilder/UtmBuilder";
import { UTM_USAGE_EXAMPLES } from "@/lib/constants/utmPresets";

// GA4イベント関数をモック
jest.mock("@/lib/analytics/events");

// Controlled wrapper to simulate real usage
function UtmBuilderWrapper({
  onValuesChange,
}: {
  onValuesChange?: (v: UtmValues) => void;
}) {
  const [values, setValues] = useState<UtmValues>({
    source: "",
    medium: "qr",
    campaign: "",
    term: "",
    content: "",
  });
  const handleChange = (newValues: UtmValues) => {
    setValues(newValues);
    onValuesChange?.(newValues);
  };
  return <UtmBuilder values={values} onChange={handleChange} />;
}

describe("UtmBuilder", () => {
  describe("基本的な表示", () => {
    it("「UTMパラメータ設定」の見出しが表示されること", () => {
      render(<UtmBuilderWrapper />);
      expect(screen.getByText("UTMパラメータ設定")).toBeInTheDocument();
    });

    it("utm_source Selectがレンダリングされること", () => {
      render(<UtmBuilderWrapper />);
      expect(screen.getByLabelText("utm_source（掲載場所）")).toBeInTheDocument();
    });

    it("utm_medium Selectがレンダリングされること", () => {
      render(<UtmBuilderWrapper />);
      expect(screen.getByLabelText("utm_medium（配布手段）")).toBeInTheDocument();
    });

    it("utm_campaign Inputがレンダリングされること", () => {
      render(<UtmBuilderWrapper />);
      expect(screen.getByLabelText("utm_campaign（キャンペーン名）")).toBeInTheDocument();
    });

    it("EffectivenessIndicatorが表示されること", () => {
      render(<UtmBuilderWrapper />);
      expect(screen.getByRole("meter")).toBeInTheDocument();
    });
  });

  describe("UTM未設定時の警告", () => {
    it("全フィールドが空のとき警告メッセージ（role=\"alert\"）が表示されること", () => {
      render(
        <UtmBuilder
          values={{ source: "", medium: "", campaign: "", term: "", content: "" }}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("警告メッセージにGoogle Analyticsへの言及が含まれること", () => {
      render(
        <UtmBuilder
          values={{ source: "", medium: "", campaign: "", term: "", content: "" }}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByRole("alert")).toHaveTextContent("Google Analytics");
    });

    it("mediumのみ設定されているとき警告メッセージが表示されないこと", () => {
      render(
        <UtmBuilder
          values={{ source: "", medium: "qr", campaign: "", term: "", content: "" }}
          onChange={jest.fn()}
        />
      );
      // medium="qr"はfilledCountに含まれるのでalertは非表示
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("詳細設定の表示/非表示", () => {
    it("初期状態でterm/contentフィールドが表示されないこと", () => {
      render(<UtmBuilderWrapper />);
      expect(screen.queryByLabelText("utm_term（検索キーワード）")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("utm_content（コンテンツ識別子）")).not.toBeInTheDocument();
    });

    it("「詳細設定を表示」ボタンが表示されること", () => {
      render(<UtmBuilderWrapper />);
      expect(screen.getByRole("button", { name: /詳細設定を表示/ })).toBeInTheDocument();
    });

    it("「詳細設定を表示」ボタンクリックでterm/contentフィールドが表示されること", async () => {
      const user = userEvent.setup();
      render(<UtmBuilderWrapper />);
      const toggleButton = screen.getByRole("button", { name: /詳細設定を表示/ });
      await user.click(toggleButton);
      expect(screen.getByLabelText("utm_term（検索キーワード）")).toBeInTheDocument();
      expect(screen.getByLabelText("utm_content（コンテンツ識別子）")).toBeInTheDocument();
    });

    it("詳細設定表示後にボタン名が「詳細設定を非表示」に変わること", async () => {
      const user = userEvent.setup();
      render(<UtmBuilderWrapper />);
      await user.click(screen.getByRole("button", { name: /詳細設定を表示/ }));
      expect(screen.getByRole("button", { name: /詳細設定を非表示/ })).toBeInTheDocument();
    });
  });

  describe("用途別設定例", () => {
    it("用途別設定例ボタンが表示されること", () => {
      render(<UtmBuilderWrapper />);
      // UTM_USAGE_EXAMPLESの最初のexampleのlabelが表示されていることを確認
      expect(
        screen.getByRole("button", { name: UTM_USAGE_EXAMPLES[0].label })
      ).toBeInTheDocument();
    });

    it("全ての用途別設定例ボタンが表示されること", () => {
      render(<UtmBuilderWrapper />);
      for (const example of UTM_USAGE_EXAMPLES) {
        expect(
          screen.getByRole("button", { name: example.label })
        ).toBeInTheDocument();
      }
    });

    it("用途別設定例ボタンクリックでvaluesが更新されること", async () => {
      const user = userEvent.setup();
      const handleValuesChange = jest.fn();
      render(<UtmBuilderWrapper onValuesChange={handleValuesChange} />);

      const firstExample = UTM_USAGE_EXAMPLES[0];
      await user.click(screen.getByRole("button", { name: firstExample.label }));

      expect(handleValuesChange).toHaveBeenCalledWith(
        expect.objectContaining({
          source: firstExample.source,
          medium: firstExample.medium,
          campaign: firstExample.campaign,
        })
      );
    });
  });
});
