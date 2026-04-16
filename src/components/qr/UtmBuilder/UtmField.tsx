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
}: UtmFieldProps) {
  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldWithTooltip}>
        {options ? (
          <Select
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            allowCustom={true}
          />
        ) : (
          <Input
            label={label}
            value={value}
            onChange={onChange}
            type="text"
            placeholder={placeholder}
            helpText={name === "campaign" ? "日付や内容を含めると管理しやすくなります" : undefined}
          />
        )}
        <Tooltip content={helpText} position="top" onOpen={onTooltipOpen}>
          <button
            type="button"
            className={styles.helpButton}
            aria-label={`${label}のヘルプ`}
          >
            ?
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
