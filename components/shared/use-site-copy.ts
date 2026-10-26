"use client";

import { useStore } from "../../lib/store";
import { SITE_TEXT_DEFAULTS } from "../../lib/defaults";

export function useSiteCopy() {
  const { siteTexts } = useStore();
  return (key: keyof typeof SITE_TEXT_DEFAULTS | string) => siteTexts[key] ?? SITE_TEXT_DEFAULTS[key] ?? "";
}