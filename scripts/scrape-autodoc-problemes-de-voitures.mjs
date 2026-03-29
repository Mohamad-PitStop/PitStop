/**
 * Scrape AUTODOC: https://www.auto-doc.fr/info/category/problemes-de-voitures
 *
 * Objectif:
 * - parcourir toutes les pages de la rubrique (page=1..N)
 * - ouvrir chaque article via le lien "En savoir plus"
 * - extraire:
 *   - url
 *   - titre (h1)
 *   - modèle (déduit du titre)
 *   - motorisations/moteurs (déduites du texte de l’article)
 *   - un extrait (1-3 premiers paragraphes)
 * - exporter en JSON: data/autodoc-problemes-de-voitures.json
 *
 * Notes Cloudflare:
 * - Le site peut bloquer les requêtes automatisées.
 * - Ce script utilise un "storage state" persistant via `userDataDir`.
 * - Lors du premier lancement, tu devras peut-être résoudre manuellement un challenge
 *   (fenêtre visible) puis relancer (le contexte sera sauvegardé).
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const CATEGORY_URL = "https://www.auto-doc.fr/info/category/problemes-de-voitures"

const OUT_PATH_DEFAULT = path.join(ROOT, "data", "autodoc-problemes-de-voitures.json")
const CACHE_PATH_DEFAULT = path.join(ROOT, "data", "autodoc-problemes-de-voitures.cache.json")

function getArg(name, fallback) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return fallback
  const v = process.argv[idx + 1]
  if (v == null) return fallback
  return v
}

function getBoolArg(name, fallback = false) {
  const v = process.argv.includes(name)
  return v ? true : fallback
}

function waitForEnter(promptText) {
  return new Promise((resolve) => {
    // Resume stdin so Node can receive input in some shells.
    if (process.stdin.isPaused()) process.stdin.resume()
    process.stdout.write(promptText)
    process.stdin.once("data", () => resolve())
  })
}

async function waitForNotCloudflareChallenge(page, timeoutMs, pollMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const bodyText = normalizeSpace(await page.locator("body").innerText().catch(() => ""))
    if (!isCloudflareChallenge(bodyText)) return true
    await sleep(pollMs)
  }
  return false
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function normalizeSpace(s) {
  return String(s || "").replace(/\s+/g, " ").trim()
}

function resolveUrl(maybeRelative, baseUrl) {
  try {
    return new URL(maybeRelative, baseUrl).toString()
  } catch {
    return null
  }
}

function extractModelFromTitle(title) {
  const t = normalizeSpace(title)
  if (!t) return "Unknown model"

  // Exemples:
  // - "Problèmes avec le Honda Civic"
  // - "Problèmes avec la Subaru Outback"
  const m1 = t.match(/Problèmes?\s+avec\s+(?:le|la|l')\s+(.+)$/i)
  if (m1?.[1]) return m1[1].trim()

  // Autre variante possible
  const m2 = t.match(/Problèmes?\s+avec\s+(.+)$/i)
  if (m2?.[1]) return m2[1].trim()

  return t
}

function uniq(arr) {
  return Array.from(new Set(arr))
}

function normalizeEngineToken(raw) {
  let s = normalizeSpace(raw)
  if (!s) return null

  // Normalisations courantes
  s = s.replace(/d[-\s]?ci/i, "dCi")
  s = s.replace(/td[i]?/gi, "TDI")
  s = s.replace(/ts[i]?/gi, "TSI")
  s = s.replace(/hdi/gi, "HDI")
  s = s.replace(/cdti/gi, "CDTi")
  s = s.replace(/tdc[i]?/gi, "TDCi")
  s = s.replace(/i[-–—]?\s*VTEC/gi, "i-VTEC")
  s = s.replace(/pure[-\s]?tech/gi, "PureTech")
  s = s.replace(/ecoboost/gi, "EcoBoost")
  s = s.replace(/blue[-\s]?hdi/gi, "BlueHDi")
  s = s.replace(/électrique|electric/gi, "Électrique")
  s = s.replace(/hybride\s+rechargeable|plug[-\s]?in\s+hybrid|phev/gi, "Hybride rechargeable")
  s = s.replace(/hybride/gi, "Hybride")

  // Uniformise l’espace: "2 .0" -> "2.0" etc.
  s = s.replace(/(\d)\s+\.\s+(\d)/g, "$1.$2")
  s = s.replace(/\s+/g, " ").trim()
  return s || null
}

function extractEnginesFromText(text) {
  const t = normalizeSpace(text)
  if (!t) return []

  const tokens = []

  // 1) Moteurs avec cylindrée + code (ex: "1.5 dCi", "2.0 TDI", "1.6 TSI")
  const withDisplacement = t.matchAll(/\b(\d+(?:[.,]\d+)?)\s?(dCi|TDI|TSI|HDI|CDTi|TDCi|i[-–—]?\s*VTEC|PureTech|EcoBoost|BlueHDi)\b/gi)
  for (const m of withDisplacement) {
    const disp = m[1]
    const code = m[2]
    tokens.push(`${disp.replace(",", ".")} ${code}`)
  }

  // 2) Moteurs sans cylindrée (électrique / hybride)
  if (/\b(hybride rechargeable|plug[-\s]?in\s+hybrid|phev)\b/i.test(t)) tokens.push("Hybride rechargeable")
  if (/\b(électrique|electric vehicle|electrique)\b/i.test(t)) tokens.push("Électrique")
  if (/\b(hybride)\b/i.test(t)) tokens.push("Hybride")

  return uniq(tokens.map(normalizeEngineToken).filter(Boolean))
}

function getArticleExcerptFromPage(page) {
  // Extrait volontairement court: on essaie plusieurs conteneurs.
  const pick = async (selector) => {
    const ps = await page.locator(selector).allTextContents().catch(() => [])
    return ps.map(normalizeSpace).filter(Boolean)
  }

  return pick("article p")
    .then((ps) => (ps.length ? ps.slice(0, 3) : pick("main p").then((ps2) => (ps2.length ? ps2.slice(0, 3) : []))))
}

function isCloudflareChallenge(text) {
  return (
    /Just a moment|Enable JavaScript|cookies to continue|vérifier que vous n'êtes pas un robot/i.test(text) ||
    /cloudflare|cf-browser-verification/i.test(text)
  )
}

function isValidArticleUrl(url) {
  try {
    const u = new URL(url)
    // Ex: https://www.auto-doc.fr/info/problemes-avec-le-jaguar-xe
    return u.pathname.startsWith("/info/problemes-avec-")
  } catch {
    return false
  }
}

async function extractEnSavoirPlusHrefs(page) {
  // Extraction robuste: on cherche un élément contenant le texte puis on remonte au lien le plus proche.
  // (souvent le texte est dans un bouton/span; le vrai href est dans un <a href="..."> quelque part autour)
  const hrefs = await page
    .locator('a:has-text("En savoir plus")')
    .evaluateAll((els) => els.map((a) => a.getAttribute("href")).filter(Boolean))
    .catch(() => [])

  if (hrefs.length > 0) return hrefs

  // Fallback #1: XPath + href direct
  const xpHrefs = await page
    .evaluate(() => {
      const out = []
      const snapshot = document.evaluate(
        "//a[contains(normalize-space(.),'En savoir plus') and @href]",
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      )
      for (let i = 0; i < snapshot.snapshotLength; i++) {
        const node = snapshot.snapshotItem(i)
        if (node && node.getAttribute) out.push(node.getAttribute("href"))
      }
      return out
    })
    .catch(() => [])

  if (Array.isArray(xpHrefs) && xpHrefs.length > 0) return xpHrefs.filter(Boolean)

  // Fallback #2: chercher n'importe quel élément contenant le texte puis remonter au 'closest a[href]' ou chercher dans le container
  const generalHrefs = await page
    .evaluate(() => {
      const out = []
      const els = Array.from(document.querySelectorAll("a,button,span,div"))
      const norm = (s) => String(s || "").replace(/\\s+/g, " ").trim().toLowerCase()
      for (const el of els) {
        const text = norm(el.textContent)
        if (!text) continue
        if (!text.includes("en savoir plus")) continue

        const closestA = el.closest ? el.closest("a[href]") : null
        if (closestA && closestA.getAttribute) {
          const href = closestA.getAttribute("href")
          if (href) out.push(href)
          continue
        }

        const innerA = el.querySelector ? el.querySelector("a[href]") : null
        if (innerA && innerA.getAttribute) {
          const href = innerA.getAttribute("href")
          if (href) out.push(href)
          continue
        }

        if (el.parentElement) {
          const maybe = el.parentElement.querySelector?.("a[href]")
          if (maybe && maybe.getAttribute) {
            const href = maybe.getAttribute("href")
            if (href) out.push(href)
          }
        }
      }
      return out
    })
    .catch(() => [])

  return Array.isArray(generalHrefs) ? generalHrefs.filter(Boolean) : []
}

async function getArticleTitle(page) {
  const h1Texts = await page.locator("h1").allTextContents().catch(() => [])
  const cleaned = h1Texts.map(normalizeSpace).filter(Boolean)
  const best =
    cleaned.find((t) => /Problèmes?\s+avec/i.test(t)) ||
    cleaned.find((t) => !/www\\.auto-doc\\.fr/i.test(t) && t.length > 6) ||
    cleaned[0] ||
    ""
  return best
}

function modelFromUrl(url) {
  try {
    const u = new URL(url)
    const path = u.pathname
    // https://www.auto-doc.fr/info/problemes-avec-le-honda-civic
    const m = path.match(/\/info\/problemes-avec-(le|la|l|l'-)?(.+)$/i)
    if (!m?.[2]) return "Unknown model"
    const slug = m[2]
    return slug
      .split("-")
      .map((x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x))
      .join(" ")
      .replace(/\b(Lh|L')/g, "")
  } catch {
    return "Unknown model"
  }
}

function isParasiteTitle(t) {
  return /www\.auto-doc\.fr/i.test(t || "")
}

function extractParagraphsFromText(text, maxParagraphs = 3) {
  const t = normalizeSpace(text)
  if (!t) return []
  const paras = t
    .split(/\n\s*\n/g)
    .map((p) => normalizeSpace(p))
    .filter(Boolean)
  if (paras.length) return paras.slice(0, maxParagraphs)
  const sentences = t.split(/(?<=[.!?])\s+/).map((s) => normalizeSpace(s)).filter(Boolean)
  return sentences.slice(0, maxParagraphs)
}

async function waitForNonEmptyArticleTitle(page, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const title = await getArticleTitle(page)
    if (title && !isParasiteTitle(title)) return title
    await sleep(500)
  }
  return await getArticleTitle(page)
}

async function waitForCategoryLinksOrChallenge(page, opts) {
  const { timeoutMs, pollMs } = opts
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const bodyText = normalizeSpace(await page.locator("body").innerText().catch(() => ""))
    const challenged = isCloudflareChallenge(bodyText)

    const hrefs = await extractEnSavoirPlusHrefs(page).catch(() => [])
    const linkCount = Array.isArray(hrefs) ? hrefs.length : 0
    if (linkCount > 0) return { ready: true, linkCount, challenged: false }
    if (!challenged) return { ready: false, linkCount, challenged: false }

    await sleep(pollMs)
  }
  return { ready: false, linkCount: 0, challenged: true }
}

async function main() {
  const outPath = getArg("--out", OUT_PATH_DEFAULT)
  const cachePath = getArg("--cache", CACHE_PATH_DEFAULT)
  const fresh = getBoolArg("--fresh", false)
  const headed = getBoolArg("--headed", false)
  const keepOpen = getBoolArg("--keepOpen", false)
  const pauseOnChallenge = getBoolArg("--pauseOnChallenge", true)
  const maxPagesArg = getArg("--maxPages", "")
  const maxPages = maxPagesArg ? Number(maxPagesArg) : Infinity
  const delayMs = Number(getArg("--delayMs", "900"))
  const challengeTimeoutMs = Number(getArg("--challengeTimeoutMs", "180000")) // 3 minutes
  const pollMs = Number(getArg("--pollMs", "1500"))
  const manualSolveTimeoutMs = Number(getArg("--manualSolveTimeoutMs", "300000")) // 5 minutes
  const maxArticlesArg = getArg("--maxArticles", "")
  const maxArticles = maxArticlesArg ? Number(maxArticlesArg) : Infinity
  const userDataDir = getArg("--userDataDir", path.join(ROOT, ".cache", "playwright-autodoc"))
  const executablePath = getArg("--executablePath", "")

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })

  const existing = !fresh && fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : null
  const processedUrls = new Set(existing?.processedUrls ?? [])
  const initialCategoryPagesDone = existing?.categoryPagesDone ?? 0
  const byModel = existing?.byModel ?? {}

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: !headed,
    viewport: { width: 1366, height: 768 },
    ...(executablePath ? { executablePath } : {}),
  })

  try {
    // Phase A: collecter toutes les URLs depuis la pagination
    const articleUrls = new Set((existing?.articleUrls ?? []).filter(isValidArticleUrl))

    let categoryPagesDone = initialCategoryPagesDone
    for (let pageNum = Math.max(1, categoryPagesDone + 1); pageNum <= maxPages; pageNum++) {
      const url = `${CATEGORY_URL}?page=${pageNum}`
      const page = await context.newPage()
      console.log(`Collecte category page ${pageNum}: ${url}`)

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 })
      // Laisse un peu de temps au rendu JS (parfois les liens apparaissent après)
      await sleep(1500)

      const status = await waitForCategoryLinksOrChallenge(page, { timeoutMs: challengeTimeoutMs, pollMs })
      if (status.challenged && status.linkCount === 0) {
        console.log(
          `Cloudflare challenge toujours actif sur la page catégorie page=${pageNum} (timeout=${challengeTimeoutMs}ms). ` +
            "Tu peux résoudre manuellement dans la fenêtre Brave/Chrome, puis on relance l'extraction."
        )

        if (headed && pauseOnChallenge) {
          // Give user time to solve manually, then retry automatically.
          console.log(`Attente automatique: résolution manuelle dans la fenêtre puis challenge -> disparition (timeout=${manualSolveTimeoutMs}ms).`)
          const ok = await waitForNotCloudflareChallenge(page, manualSolveTimeoutMs, 1500)
          if (!ok) {
            await page.close()
            break
          }

          const hrefsRetry = await extractEnSavoirPlusHrefs(page).catch(() => [])
          const resolvedRetry = hrefsRetry
            .map((h) => (h ? resolveUrl(h, "https://www.auto-doc.fr") : null))
            .filter((x) => typeof x === "string" && x.length > 0)
            .filter(isValidArticleUrl)
          if (resolvedRetry.length > 0) {
            for (const u of resolvedRetry) articleUrls.add(u)
            await page.close()
            categoryPagesDone = pageNum
            continue
          }
        }

        await page.close()
        break
      }
      const hrefs = await extractEnSavoirPlusHrefs(page)
      const resolved = hrefs
        .map((h) => (h ? resolveUrl(h, "https://www.auto-doc.fr") : null))
        .filter((x) => typeof x === "string" && x.length > 0)
        .filter(isValidArticleUrl)

      if (resolved.length === 0) {
        // Cas normal: plus de page (ou challenge)
        console.log(`Stop collecte: aucune entrée "En savoir plus" détectée sur page ${pageNum}.`)
        await page.close()
        break
      }

      for (const u of resolved) articleUrls.add(u)

      await page.close()
      await sleep(delayMs)

      fs.writeFileSync(
        cachePath,
        JSON.stringify(
          {
            processedUrls: Array.from(processedUrls),
            articleUrls: Array.from(articleUrls),
            byModel,
            categoryPagesDone: pageNum,
          },
          null,
          2
        ),
        "utf8"
      )
      categoryPagesDone = pageNum
    }

    // Phase B: traiter les articles
    let allUrls = Array.from(articleUrls).filter(isValidArticleUrl)
    if (Number.isFinite(maxArticles) && maxArticles > 0) {
      allUrls = allUrls.slice(0, maxArticles)
    }
    console.log(`Articles à traiter: ${allUrls.length} (déjà faits: ${processedUrls.size})`)

    for (let i = 0; i < allUrls.length; i++) {
      const articleUrl = allUrls[i]
      if (processedUrls.has(articleUrl)) continue

      const page = await context.newPage()
      console.log(`Traitement [${i + 1}/${allUrls.length}] ${articleUrl}`)

      await page.goto(articleUrl, { waitUntil: "domcontentloaded", timeout: 60_000 })
      // Détection "challenge"
      let bodyText = normalizeSpace(await page.locator("body").innerText().catch(() => ""))
      if (isCloudflareChallenge(bodyText)) {
        console.log("Challenge anti-bot détecté sur la page article.")
        if (headed && pauseOnChallenge) {
          console.log(`Attente automatique du challenge sur l'article (timeout=${manualSolveTimeoutMs}ms).`)
          const ok = await waitForNotCloudflareChallenge(page, manualSolveTimeoutMs, 1500)
          if (ok) {
            bodyText = normalizeSpace(await page.locator("body").innerText().catch(() => ""))
          }
        }
      }

      if (isCloudflareChallenge(bodyText)) {
        console.log("Challenge toujours actif: on saute cet article.")
        await page.close()
        continue
      }

      let title = ""
      let model = ""
      let articleText = ""
      let detectedEngines = []
      let excerpt = ""
      let extractionOk = false

      try {
        title = normalizeSpace(await waitForNonEmptyArticleTitle(page, 15_000))
        if (!title || isParasiteTitle(title)) {
          title = ""
          model = modelFromUrl(articleUrl)
        } else {
          model = extractModelFromTitle(title)
        }
        if (!model || /www\.auto-doc\.fr/i.test(model)) model = modelFromUrl(articleUrl)

        // Récupère texte principal
        articleText =
          normalizeSpace(await page.locator("article").innerText().catch(() => "")) ||
          normalizeSpace(await page.locator("main").innerText().catch(() => "")) ||
          bodyText

        const engines = extractEnginesFromText(title + " " + articleText)
        detectedEngines = engines.length ? engines : ["_unknown"]

        // Extrait: d’abord via selectors, sinon fallback sur texte principal
        try {
          const excerptParagraphs = await getArticleExcerptFromPage(page)
          excerpt = excerptParagraphs.join("\n\n")
        } catch {
          excerpt = ""
        }

        if (!excerpt) {
          const paras = extractParagraphsFromText(articleText, 2)
          excerpt = paras.join("\n\n")
        }

        extractionOk = true
      } catch (e) {
        extractionOk = false
        console.log(`Extraction impossible pour ${articleUrl}: ${e instanceof Error ? e.message : String(e)}`)
      }

      if (!extractionOk) {
        await page.close()
        continue
      }

      for (const engine of detectedEngines) {
        if (!byModel[model]) byModel[model] = { engines: {} }
        if (!byModel[model].engines[engine]) byModel[model].engines[engine] = []

        byModel[model].engines[engine].push({
          url: articleUrl,
          title,
          excerpt,
          text: undefined,
        })
      }

      processedUrls.add(articleUrl)

      fs.writeFileSync(
        cachePath,
        JSON.stringify(
          {
            processedUrls: Array.from(processedUrls),
            articleUrls: Array.from(articleUrls),
            byModel,
            categoryPagesDone,
            lastArticleProcessedAt: new Date().toISOString(),
          },
          null,
          2
        ),
        "utf8"
      )

      await page.close()
      await sleep(delayMs)
    }

    // Export final propre
    const final = {
      generatedAt: new Date().toISOString(),
      source: {
        site: "auto-doc.fr",
        categoryUrl: CATEGORY_URL,
      },
      byModel,
    }

    fs.writeFileSync(outPath, JSON.stringify(final, null, 2), "utf8")
    console.log(`Export terminé: ${outPath}`)
  } finally {
    if (!keepOpen) await context.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

