import { ja } from "./ja";
import { pickClientDict } from "./client";
import type { ClientDict, Dict, Locale } from "./types";

/**
 * Server 専用: locale の辞書を返す。
 * 今は ja のみ。en は T3 で en.ts を追加するときにここへ足す。
 */
export function getDict(locale: Locale): Dict {
  void locale;
  return ja;
}

/**
 * Server 専用: Client Component に渡すスライスを返す。
 * 今は ja のみ。en は T3 で追加する。
 */
export function getClientMessages(locale: Locale): ClientDict {
  return pickClientDict(getDict(locale));
}
