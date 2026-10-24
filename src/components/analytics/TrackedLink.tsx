"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { trackCtaClicked } from "@/lib/analytics/events";

type LinkProps = Omit<ComponentProps<typeof Link>, "children">;

type TrackedLinkProps = LinkProps & {
  /** GA イベント cta_clicked の location */
  location: string;
} & (
    | { children: string; buttonText?: string }
    | { children: ReactNode; buttonText: string }
  );

export function TrackedLink({
  location,
  buttonText,
  children,
  onClick,
  ...rest
}: TrackedLinkProps) {
  const text = buttonText ?? (typeof children === "string" ? children : "");

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    trackCtaClicked(text, location);
    onClick?.(event);
  };

  return (
    <Link {...rest} onClick={handleClick}>
      {children}
    </Link>
  );
}
