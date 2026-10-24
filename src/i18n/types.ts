import type { ja } from "./ja";

export type Locale = "ja" | "en";

/** 辞書全体の型。ja.ts を正とし、en.ts は `satisfies Dict` で全キーを要求される（T3） */
export type Dict = typeof ja;

/** Client Component に渡すスライス名（Server → Client の props で渡せるものだけ） */
export type ClientSliceKey = "common" | "ui" | "tool" | "utm" | "decoration";

/** Client に渡せる値: 文字列と入れ子オブジェクトだけ（関数は RSC の props で渡せない） */
type ClientValue = string | { [key: string]: ClientValue };

/** 関数値などが混ざるとここでコンパイルエラーになる */
type AssertClient<T extends ClientValue> = T;

export type ClientDict = AssertClient<Pick<Dict, ClientSliceKey>>;

export const CLIENT_SLICE_KEYS: readonly ClientSliceKey[] = [
  "common",
  "ui",
  "tool",
  "utm",
  "decoration",
];
