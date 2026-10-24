"use client";

import { createContext, type ReactNode } from "react";
import type { ClientDict, Locale } from "./types";

export const LocaleContext = createContext<Locale>("ja");
export const MessagesContext = createContext<ClientDict | null>(null);

interface I18nProviderProps {
  locale: Locale;
  /** Server で getClientMessages(locale) を呼んで渡す。省略時は ja */
  messages?: ClientDict;
  children: ReactNode;
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  if (locale !== "ja" && !messages && process.env.NODE_ENV !== "production") {
    console.warn(
      `[i18n] I18nProvider: locale="${locale}" ですが messages が未指定です。ja の文言が表示されます。getClientMessages(locale) の結果を渡してください。`
    );
  }
  return (
    <LocaleContext.Provider value={locale}>
      <MessagesContext.Provider value={messages ?? null}>
        {children}
      </MessagesContext.Provider>
    </LocaleContext.Provider>
  );
}
