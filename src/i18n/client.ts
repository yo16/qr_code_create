import { CLIENT_SLICE_KEYS, type ClientDict, type Dict } from "./types";

/** 辞書から Client に渡すスライスだけを取り出す */
export function pickClientDict(dict: Dict): ClientDict {
  const result = {} as Record<string, unknown>;
  for (const key of CLIENT_SLICE_KEYS) {
    result[key] = dict[key];
  }
  return result as ClientDict;
}
