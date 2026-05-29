import { Select } from "@/components/ui/Select/Select";
import { Input } from "@/components/ui/Input/Input";
import { Tooltip } from "@/components/ui/Tooltip/Tooltip";
import styles from "./UtmBuilder.module.css";

interface UtmFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  onTooltipOpen?: () => void;
  /** フィールドを無効化（グレーアウト・操作不能）にする。UTM ON/OFFトグルOFF時に true (デフォルト: false) */
  disabled?: boolean;
}

export function UtmField({
  name,
  label,
  value,
  onChange,
  helpText,
  placeholder,
  options,
  onTooltipOpen,
  disabled = false,
}: UtmFieldProps) {
  return (
    <div
      className={`${styles.fieldRow}${disabled ? ` ${styles.fieldRowDisabled}` : ""}`}
      aria-disabled={disabled}
    >
      <div className={styles.fieldWithTooltip}>
        {options ? (
          <Select
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            allowCustom={true}
            disabled={disabled}
          />
        ) : (
          <Input
            label={label}
            value={value}
            onChange={onChange}
            type="text"
            placeholder={placeholder}
            helpText={name === "campaign" ? "日付や内容を含めると管理しやすくなります" : undefined}
            disabled={disabled}
          />
        )}
        <Tooltip content={helpText} position="top" onOpen={disabled ? undefined : onTooltipOpen}>
          <button
            type="button"
            className={styles.helpButton}
            aria-label={`${label}のヘルプ`}
            disabled={disabled}
          >
            ?
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
