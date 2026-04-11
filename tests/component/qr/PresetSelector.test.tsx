import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PresetSelector } from "@/components/qr/DecorationPanel/PresetSelector";
import { DECORATION_PRESETS } from "@/lib/constants/decorationPresets";
import { trackPresetSelected } from "@/lib/analytics/events";

jest.mock("@/lib/analytics/events");

const mockTrackPresetSelected = trackPresetSelected as jest.Mock;

describe("PresetSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("正常系: 表示確認", () => {
    it("5つのプリセットカードが表示されること", () => {
      render(
        <PresetSelector
          currentPresetId={null}
          onApplyPreset={jest.fn()}
        />
      );
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(5);
    });

    it("各カードにプリセット名が表示されること", () => {
      render(
        <PresetSelector
          currentPresetId={null}
          onApplyPreset={jest.fn()}
        />
      );
      for (const preset of DECORATION_PRESETS) {
        expect(screen.getByText(preset.name)).toBeInTheDocument();
      }
    });

    it('role="group"（aria-label="装飾プリセット"）が存在すること', () => {
      render(
        <PresetSelector
          currentPresetId={null}
          onApplyPreset={jest.fn()}
        />
      );
      expect(screen.getByRole("group", { name: "装飾プリセット" })).toBeInTheDocument();
    });
  });

  describe("操作: カードクリック", () => {
    it("カードクリックでonApplyPresetが正しいpresetオブジェクトで呼ばれること", () => {
      const onApplyPreset = jest.fn();
      render(
        <PresetSelector
          currentPresetId={null}
          onApplyPreset={onApplyPreset}
        />
      );
      const firstPreset = DECORATION_PRESETS[0];
      const button = screen.getByRole("button", {
        name: `プリセット: ${firstPreset.name} - ${firstPreset.description}`,
      });
      fireEvent.click(button);
      expect(onApplyPreset).toHaveBeenCalledWith(firstPreset);
    });

    it("カードクリックでtrackPresetSelectedがpreset.idで呼ばれること", () => {
      render(
        <PresetSelector
          currentPresetId={null}
          onApplyPreset={jest.fn()}
        />
      );
      const firstPreset = DECORATION_PRESETS[0];
      const button = screen.getByRole("button", {
        name: `プリセット: ${firstPreset.name} - ${firstPreset.description}`,
      });
      fireEvent.click(button);
      expect(mockTrackPresetSelected).toHaveBeenCalledWith(firstPreset.id);
    });
  });

  describe("選択状態", () => {
    it("currentPresetId指定時に該当カードのaria-pressed=trueであること", () => {
      const targetPreset = DECORATION_PRESETS[1];
      render(
        <PresetSelector
          currentPresetId={targetPreset.id}
          onApplyPreset={jest.fn()}
        />
      );
      const button = screen.getByRole("button", {
        name: `プリセット: ${targetPreset.name} - ${targetPreset.description}`,
      });
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("currentPresetId指定時に他カードのaria-pressed=falseであること", () => {
      const targetPreset = DECORATION_PRESETS[1];
      render(
        <PresetSelector
          currentPresetId={targetPreset.id}
          onApplyPreset={jest.fn()}
        />
      );
      const otherPresets = DECORATION_PRESETS.filter((p) => p.id !== targetPreset.id);
      for (const preset of otherPresets) {
        const button = screen.getByRole("button", {
          name: `プリセット: ${preset.name} - ${preset.description}`,
        });
        expect(button).toHaveAttribute("aria-pressed", "false");
      }
    });

    it("currentPresetId=null時に全カードがaria-pressed=falseであること", () => {
      render(
        <PresetSelector
          currentPresetId={null}
          onApplyPreset={jest.fn()}
        />
      );
      for (const preset of DECORATION_PRESETS) {
        const button = screen.getByRole("button", {
          name: `プリセット: ${preset.name} - ${preset.description}`,
        });
        expect(button).toHaveAttribute("aria-pressed", "false");
      }
    });
  });
});
