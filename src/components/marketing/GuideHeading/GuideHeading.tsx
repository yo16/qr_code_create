import { Children, isValidElement } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { getStepHeadingId } from "@/lib/content/stepHeading";

function extractText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (isValidElement<{ children?: ReactNode }>(child)) return extractText(child.props.children);
      return "";
    })
    .join("");
}

/** 「ステップN」「Step N」で始まる h2 に id="step-N" を付ける（HowTo の url アンカー用） */
export function GuideHeading({ children, ...props }: ComponentPropsWithoutRef<"h2">) {
  const id = getStepHeadingId(extractText(children));
  return (
    <h2 {...props} {...(id ? { id } : {})}>
      {children}
    </h2>
  );
}
