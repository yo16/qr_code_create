"use client";

import { useContext } from "react";
import { jaClient as ja } from "./jaClient";
import { LocaleContext, MessagesContext } from "./I18nProvider";
import type { ClientDict, Locale } from "./types";

const DEFAULT_MESSAGES: ClientDict = ja;

/** Provider または messages が無いときは ja を返す（既存のコンポーネントテストを無変更で通すため） */
export function useDict(): ClientDict {
  return useContext(MessagesContext) ?? DEFAULT_MESSAGES;
}

/** Provider が無いときは "ja" */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}
