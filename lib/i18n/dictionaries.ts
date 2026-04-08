import type { Locale } from "./types"
import { DEFAULT_LOCALE } from "./types"
import { flattenMessages } from "./flatten-tree"
import { treeFr } from "@/messages/tree.fr"
import { treeEn } from "@/messages/tree.en"
import { treeNl } from "@/messages/tree.nl"

const flatFr = flattenMessages(treeFr as Record<string, unknown>)
const flatEn = flattenMessages(treeEn as Record<string, unknown>)
const flatNl = flattenMessages(treeNl as Record<string, unknown>)

const byLocale: Record<Locale, Record<string, string>> = {
  fr: flatFr,
  en: flatEn,
  nl: flatNl,
}

export function getFlatMessages(locale: Locale): Record<string, string> {
  return byLocale[locale] ?? byLocale[DEFAULT_LOCALE]
}
