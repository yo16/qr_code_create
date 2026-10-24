import { ja } from "./ja";
import { en } from "./en";
import { pickClientDict } from "./client";
import type { ClientDict, Dict, Locale } from "./types";

/** Server 専用: locale の辞書を返す。 */
export function getDict(locale: Locale): Dict {
  return locale === "en" ? en : ja;
}

/** Server 専用: Client Component に渡すスライスを返す。 */
export function getClientMessages(locale: Locale): ClientDict {
  return pickClientDict(getDict(locale));
}
