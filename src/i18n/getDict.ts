import { ja } from "./ja";
import { en } from "./en";
import { es } from "./es";
import { ptBr } from "./ptBr";
import { de } from "./de";
import { pickClientDict } from "./client";
import type { ClientDict, Dict, Locale } from "./types";

const DICTS = { ja, en, es, "pt-br": ptBr, de } satisfies Record<Locale, Dict>;

/** Server 専用: locale の辞書を返す。 */
export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

/** Server 専用: Client Component に渡すスライスを返す。 */
export function getClientMessages(locale: Locale): ClientDict {
  return pickClientDict(getDict(locale));
}
