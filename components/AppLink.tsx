"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

// Every link on the site goes through this. Next.js normally preloads every link the moment it scrolls
// into view; on a busy page that is ~25 extra requests per visit, which used up most of Cloudflare's
// free 100,000 requests a day. Here a page is preloaded only when the visitor hovers or touches the
// link, just before they click, so clicks stay fast without the background flood.
type Props = ComponentProps<typeof NextLink>;

export default function Link({ href, onMouseEnter, onTouchStart, onFocus, ...rest }: Props) {
  const router = useRouter();
  const warm = () => {
    if (typeof href === "string" && href.startsWith("/")) router.prefetch(href);
  };
  return (
    <NextLink
      href={href}
      prefetch={false}
      onMouseEnter={(e) => { warm(); onMouseEnter?.(e); }}
      onTouchStart={(e) => { warm(); onTouchStart?.(e); }}
      onFocus={(e) => { warm(); onFocus?.(e); }}
      {...rest}
    />
  );
}
