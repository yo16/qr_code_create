import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { trackFaqOpened } from "@/lib/analytics/events";

jest.mock("@/lib/analytics/events");

const mockTrackFaqOpened = trackFaqOpened as jest.Mock;

const sampleItems = [
  { id: "q1", question: "質問1", answer: "回答1" },
  { id: "q2", question: "質問2", answer: "回答2" },
  { id: "q3", question: "質問3", answer: "回答3" },
];

describe("FaqAccordion", () => {
  beforeEach(() => {
    mockTrackFaqOpened.mockClear();
  });

  describe("正常系", () => {
    it("渡されたFAQ項目が全て表示されること", () => {
      render(<FaqAccordion items={sampleItems} />);
      sampleItems.forEach((item) => {
        expect(screen.getByText(item.question)).toBeInTheDocument();
      });
    });

    it("各項目に質問テキストが表示されること", () => {
      render(<FaqAccordion items={sampleItems} />);
      expect(screen.getByText("質問1")).toBeInTheDocument();
      expect(screen.getByText("質問2")).toBeInTheDocument();
      expect(screen.getByText("質問3")).toBeInTheDocument();
    });

    it("初期状態では回答が非表示（hidden）であること", () => {
      render(<FaqAccordion items={sampleItems} />);
      sampleItems.forEach((item) => {
        const panel = document.getElementById(`faq-panel-${item.id}`);
        expect(panel).toHaveAttribute("hidden");
      });
    });

    it("ボタンクリックで該当項目が展開されること（aria-expanded=true）", async () => {
      const user = userEvent.setup();
      render(<FaqAccordion items={sampleItems} />);

      const button = screen.getByRole("button", { name: /質問1/ });
      await user.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("展開後の再クリックで折りたたまれること", async () => {
      const user = userEvent.setup();
      render(<FaqAccordion items={sampleItems} />);

      const button = screen.getByRole("button", { name: /質問1/ });
      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("複数項目を同時に開けること", async () => {
      const user = userEvent.setup();
      render(<FaqAccordion items={sampleItems} />);

      const button1 = screen.getByRole("button", { name: /質問1/ });
      const button2 = screen.getByRole("button", { name: /質問2/ });

      await user.click(button1);
      await user.click(button2);

      expect(button1).toHaveAttribute("aria-expanded", "true");
      expect(button2).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("GA4", () => {
    it("項目を開くときtrackFaqOpenedが該当idで呼ばれること", async () => {
      const user = userEvent.setup();
      render(<FaqAccordion items={sampleItems} />);

      const button = screen.getByRole("button", { name: /質問1/ });
      await user.click(button);

      expect(mockTrackFaqOpened).toHaveBeenCalledTimes(1);
      expect(mockTrackFaqOpened).toHaveBeenCalledWith("q1");
    });

    it("項目を閉じるときtrackFaqOpenedが呼ばれないこと", async () => {
      const user = userEvent.setup();
      render(<FaqAccordion items={sampleItems} />);

      const button = screen.getByRole("button", { name: /質問1/ });
      // 開く（1回目）
      await user.click(button);
      mockTrackFaqOpened.mockClear();

      // 閉じる（2回目）
      await user.click(button);
      expect(mockTrackFaqOpened).not.toHaveBeenCalled();
    });
  });

  describe("アクセシビリティ", () => {
    it("ボタンにaria-expanded属性があること", () => {
      render(<FaqAccordion items={sampleItems} />);
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-expanded");
      });
    });

    it("ボタンにaria-controls属性があること", () => {
      render(<FaqAccordion items={sampleItems} />);
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-controls");
      });
    });

    it("パネルにrole='region'とaria-labelledbyがあること", () => {
      render(<FaqAccordion items={sampleItems} />);
      sampleItems.forEach((item) => {
        const panel = document.getElementById(`faq-panel-${item.id}`);
        expect(panel).toHaveAttribute("role", "region");
        expect(panel).toHaveAttribute("aria-labelledby", `faq-btn-${item.id}`);
      });
    });
  });
});
