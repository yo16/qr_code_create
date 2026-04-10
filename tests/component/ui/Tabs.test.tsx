import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "@/components/ui/Tabs/Tabs";

const defaultTabs = [
  { id: "tab1", label: "タブ1", content: <div>コンテンツ1</div> },
  { id: "tab2", label: "タブ2", content: <div>コンテンツ2</div> },
  { id: "tab3", label: "タブ3", content: <div>コンテンツ3</div> },
];

describe("Tabs", () => {
  describe("正常系", () => {
    it("すべてのタブラベルが表示されること", () => {
      render(<Tabs tabs={defaultTabs} />);
      expect(screen.getByRole("tab", { name: "タブ1" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "タブ2" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "タブ3" })).toBeInTheDocument();
    });

    it("デフォルトタブが最初のタブとしてアクティブであること", () => {
      render(<Tabs tabs={defaultTabs} />);
      expect(screen.getByRole("tab", { name: "タブ1" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(screen.getByText("コンテンツ1")).toBeVisible();
    });

    it("defaultTabが指定された場合にそのタブがアクティブであること", () => {
      render(<Tabs tabs={defaultTabs} defaultTab="tab2" />);
      expect(screen.getByRole("tab", { name: "タブ2" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(screen.getByText("コンテンツ2")).toBeVisible();
    });

    it("タブクリックでパネルが切り替わること", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);
      await user.click(screen.getByRole("tab", { name: "タブ2" }));
      expect(screen.getByRole("tab", { name: "タブ2" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(screen.getByText("コンテンツ2")).toBeVisible();
    });

    it("role='tablist'が存在すること", () => {
      render(<Tabs tabs={defaultTabs} />);
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("各タブパネルにrole='tabpanel'が付与されること", () => {
      render(<Tabs tabs={defaultTabs} />);
      // アクティブなパネルのみがrole="tabpanel"で取得可能（hidden要素は除外される）
      const visiblePanels = screen.getAllByRole("tabpanel");
      expect(visiblePanels).toHaveLength(1);
      // hidden含む全パネルを確認
      const allPanels = screen.getAllByRole("tabpanel", { hidden: true });
      expect(allPanels).toHaveLength(3);
    });
  });

  describe("キーボード操作", () => {
    it("ArrowRightキーで次のタブに移動すること", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);
      screen.getByRole("tab", { name: "タブ1" }).focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "タブ2" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("ArrowLeftキーで前のタブに移動すること", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} defaultTab="tab2" />);
      screen.getByRole("tab", { name: "タブ2" }).focus();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("tab", { name: "タブ1" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("最後のタブでArrowRightキーを押すと最初のタブに移動すること", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} defaultTab="tab3" />);
      screen.getByRole("tab", { name: "タブ3" }).focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "タブ1" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("Homeキーで最初のタブに移動すること", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} defaultTab="tab3" />);
      screen.getByRole("tab", { name: "タブ3" }).focus();
      await user.keyboard("{Home}");
      expect(screen.getByRole("tab", { name: "タブ1" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("Endキーで最後のタブに移動すること", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);
      screen.getByRole("tab", { name: "タブ1" }).focus();
      await user.keyboard("{End}");
      expect(screen.getByRole("tab", { name: "タブ3" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });
  });

  describe("異常系・エッジケース", () => {
    it("非アクティブなタブのコンテンツはhiddenであること", () => {
      render(<Tabs tabs={defaultTabs} />);
      const allPanels = screen.getAllByRole("tabpanel", { hidden: true });
      // tab1がアクティブなのでpanel2とpanel3はhidden
      const hiddenPanels = allPanels.filter((p) => p.hasAttribute("hidden"));
      expect(hiddenPanels).toHaveLength(2);
    });

    it("最初のタブでArrowLeftを押すと最後のタブに移動すること", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);
      screen.getByRole("tab", { name: "タブ1" }).focus();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("tab", { name: "タブ3" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("tabs=[]のときクラッシュしないこと", () => {
      expect(() => {
        render(<Tabs tabs={[]} />);
      }).not.toThrow();
    });

    it("aria-controlsとaria-labelledbyの対応関係が正しいこと", () => {
      render(<Tabs tabs={defaultTabs} />);
      const tab1 = screen.getByRole("tab", { name: "タブ1" });
      const panelId = tab1.getAttribute("aria-controls");
      expect(panelId).toBeTruthy();
      const panel = document.getElementById(panelId!);
      expect(panel).not.toBeNull();
      expect(panel).toHaveAttribute("aria-labelledby", tab1.id);
    });

    it("非アクティブタブのtabIndexが-1であること", () => {
      render(<Tabs tabs={defaultTabs} />);
      const tab2 = screen.getByRole("tab", { name: "タブ2" });
      const tab3 = screen.getByRole("tab", { name: "タブ3" });
      expect(tab2).toHaveAttribute("tabIndex", "-1");
      expect(tab3).toHaveAttribute("tabIndex", "-1");
    });
  });
});
