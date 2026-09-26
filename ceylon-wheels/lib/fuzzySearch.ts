/**
 * Damerau-Levenshtein distance calculation
 * Handles insertions, deletions, substitutions, and character transpositions.
 */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length
  const bl = b.length
  if (!al) return bl
  if (!bl) return al

  const matrix: number[][] = Array.from({ length: al + 1 }, () => Array(bl + 1).fill(0))

  for (let i = 0; i <= al; i++) matrix[i][0] = i
  for (let j = 0; j <= bl; j++) matrix[0][j] = j

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1) // transposition
      }
    }
  }

  return matrix[al][bl]
}

/**
 * Common automotive terms (makes, models, popular trims and generations in Sri Lanka)
 * Used to expand typo tolerance and auto-detect misspelled vehicle terms.
 */
export const COMMON_VEHICLE_TERMS: string[] = [
  // Makes
  'toyota', 'honda', 'nissan', 'suzuki', 'mitsubishi', 'mazda', 'hyundai',
  'kia', 'mercedes', 'benz', 'bmw', 'audi', 'lexus', 'subaru', 'daihatsu',
  'ford', 'volkswagen', 'peugeot', 'renault', 'micro', 'tata', 'mahindra',
  'chery', 'byd', 'mg', 'isuzu', 'volvo', 'landrover', 'land', 'rover',
  
  // Popular Models & Trims
  'civic', 'corolla', 'premio', 'allion', 'axio', 'vezel', 'fit', 'grace',
  'aqua', 'prius', 'vitz', 'yaris', 'cr-v', 'crv', 'accord', 'insight',
  'shuttle', 'jade', 'freed', 'camry', 'raize', 'rush', 'ch-r', 'chr',
  'landcruiser', 'prado', 'hilux', 'harrier', 'hiace', 'rav4', 'passo',
  'tank', 'roomy', 'alto', 'wagon', 'wagonr', 'swift', 'spacia', 'hustler',
  'baleno', 'celerio', 'jimny', 'every', 'stingray', 'leaf', 'x-trail',
  'xtrail', 'patrol', 'march', 'sunny', 'dayz', 'serena', 'montero',
  'outlander', 'lancer', 'l200', 'eclipse', 'tucson', 'santafe', 'elantra',
  'sportage', 'sorento', 'picanto', 'stonic', 'axela', 'demio', 'cx-5',
  'cx5', 'cx-3', 'cx3',
  
  // Chassis & Trims (Civic generations, Premio/Allion packages, etc.)
  'fk6', 'fk7', 'fk8', 'fl1', 'fl5', 'fe1', 'fc1', 'fd1', 'fd2', 'ek3', 'ek4',
  'ek9', 'eg6', 'eg9', 'es1', 'es8', 'turbo', 'vtec', 'hybrid', 'sedan', 'suv',
  'hatchback', 'coupe', 'rs', 'type-r', 'typer', 'mugen', 'f-ex', 'g-superior'
]

export interface TypoMatchResult {
  match: boolean
  score: number
  typo: boolean
}

/**
 * Checks if a query token matches a target word either exactly,
 * via substring/prefix, or via typo tolerance (Damerau-Levenshtein distance).
 */
export function isTypoMatch(queryToken: string, targetToken: string): TypoMatchResult {
  const q = queryToken.toLowerCase().trim()
  const t = targetToken.toLowerCase().trim()

  if (!q || !t) return { match: false, score: 0, typo: false }

  // 1. Exact match
  if (q === t) return { match: true, score: 1.0, typo: false }

  // 2. Target contains or starts with query
  if (t.startsWith(q) || t.includes(q)) return { match: true, score: 0.95, typo: false }

  // 3. Query contains target (e.g. query is "hondacivic" and target is "civic")
  if (q.startsWith(t) || q.includes(t)) return { match: true, score: 0.9, typo: false }

  const len = Math.max(q.length, t.length)
  const minLen = Math.min(q.length, t.length)

  // Very short tokens (1-2 chars) must match exactly to avoid false positives
  if (minLen <= 2) return { match: false, score: 0, typo: false }

  // Allowed edit distance based on token length
  const maxDist = minLen <= 3 ? 1 : (minLen <= 7 ? 2 : 3)
  const dist = damerauLevenshtein(q, t)

  if (dist <= maxDist) {
    const similarity = 1 - (dist / len)
    // Threshold: at least 60% similarity for typos
    if (similarity >= 0.60) {
      return { match: true, score: 0.75 + similarity * 0.2, typo: true }
    }
  }

  return { match: false, score: 0, typo: false }
}

/**
 * Finds if a misspelled query word corresponds to a known automotive keyword.
 * e.g. "civivc" -> "civic", "toyoto" -> "toyota", "premeo" -> "premio"
 */
export function findSuggestedTerm(queryToken: string): string | null {
  const q = queryToken.toLowerCase().trim()
  if (!q || q.length < 3) return null

  // If already exact match in dictionary, no suggestion needed
  if (COMMON_VEHICLE_TERMS.includes(q)) return null

  let bestTerm: string | null = null
  let bestScore = 0

  for (const term of COMMON_VEHICLE_TERMS) {
    const res = isTypoMatch(q, term)
    if (res.match && res.typo && res.score > bestScore) {
      bestScore = res.score
      bestTerm = term
    }
  }

  return bestTerm
}

export interface SearchListingItem {
  listingId: string
  title: string
  make: string
  model: string
  year?: number | string
  type?: string
  [key: string]: any
}

export interface ScoredListingResult<T> {
  item: T
  score: number
  matched: boolean
  coverageRatio: number
  matchedTokens: string[]
  detectedCorrection?: string | null
}

/**
 * Calculates match score for a single listing against the user's query.
 */
export function scoreListing<T extends SearchListingItem>(
  listing: T,
  query: string
): ScoredListingResult<T> {
  const cleanQ = query.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, ' ')
  const rawTokens = cleanQ.split(/[\s-]+/).filter(Boolean)

  if (rawTokens.length === 0) {
    return {
      item: listing,
      score: 1,
      matched: true,
      coverageRatio: 1.0,
      matchedTokens: [],
      detectedCorrection: null,
    }
  }

  // Pre-calculate dictionary suggestions for typos
  const queryTokens = rawTokens.map((t) => {
    const suggested = findSuggestedTerm(t)
    return { token: t, suggested }
  })

  const titleWords = (listing.title || '').toLowerCase().split(/[\s-]+/).filter(Boolean)
  const makeWords = (listing.make || '').toLowerCase().split(/[\s-]+/).filter(Boolean)
  const modelWords = (listing.model || '').toLowerCase().split(/[\s-]+/).filter(Boolean)
  const yearWord = String(listing.year || '')
  const typeWord = (listing.type || '').toLowerCase()

  const allTargetTokens = Array.from(
    new Set([...titleWords, ...makeWords, ...modelWords, yearWord, typeWord])
  )
  const fullText = `${listing.make} ${listing.model} ${listing.title} ${listing.year} ${listing.type || ''}`.toLowerCase()

  let matchedTokensCount = 0
  let totalTokenScore = 0
  let hasExactModelOrMakeMatch = false
  const matchedTokens: string[] = []
  let detectedCorrection: string | null = null

  for (const { token, suggested } of queryTokens) {
    let bestMatchForToken = 0

    // Compare with listing's individual words
    for (const target of allTargetTokens) {
      const res = isTypoMatch(token, target)
      if (res.match && res.score > bestMatchForToken) {
        bestMatchForToken = res.score
        if (!res.typo) hasExactModelOrMakeMatch = true
        if (res.typo && !detectedCorrection) {
          detectedCorrection = target
        }
      }

      // Check if suggested automotive term matches listing word (e.g. civivc -> civic)
      if (suggested && suggested !== token) {
        const suggRes = isTypoMatch(suggested, target)
        if (suggRes.match && suggRes.score * 0.95 > bestMatchForToken) {
          bestMatchForToken = suggRes.score * 0.95
          hasExactModelOrMakeMatch = true
          detectedCorrection = suggested
        }
      }
    }

    // Direct substring check in full text if not yet matched
    if (bestMatchForToken === 0) {
      if (fullText.includes(token)) {
        bestMatchForToken = 0.85
      } else if (suggested && fullText.includes(suggested)) {
        bestMatchForToken = 0.80
        detectedCorrection = suggested
      }
    }

    if (bestMatchForToken > 0) {
      matchedTokensCount++
      totalTokenScore += bestMatchForToken
      matchedTokens.push(token)
    }
  }

  if (matchedTokensCount === 0) {
    return {
      item: listing,
      score: 0,
      matched: false,
      coverageRatio: 0,
      matchedTokens: [],
      detectedCorrection: null,
    }
  }

  const coverageRatio = matchedTokensCount / queryTokens.length
  let score = coverageRatio * 100 + (totalTokenScore / queryTokens.length) * 50

  // 100% token coverage bonus
  if (matchedTokensCount === queryTokens.length) {
    score += 100
  }
  // Make or model match bonus
  if (hasExactModelOrMakeMatch) {
    score += 30
  }
  // Full phrase occurrence bonus
  if (fullText.includes(cleanQ)) {
    score += 50
  }

  // Matched if:
  // - single token query: that token matched
  // - multi-token query: at least 50% of tokens matched (e.g. "civic fk7" matches "honda civic")
  const matched =
    (queryTokens.length === 1 && matchedTokensCount === 1) ||
    (queryTokens.length > 1 && coverageRatio >= 0.5)

  return {
    item: listing,
    score,
    matched,
    coverageRatio,
    matchedTokens,
    detectedCorrection,
  }
}

/**
 * Filters and ranks listings by query relevance with typo tolerance.
 */
export function searchListings<T extends SearchListingItem>(
  listings: T[],
  query: string
): { results: T[]; detectedCorrection: string | null } {
  if (!query || !query.trim()) {
    return { results: listings, detectedCorrection: null }
  }

  const scored = listings.map((l) => scoreListing(l, query))
  const matchedListings = scored.filter((r) => r.matched)

  if (matchedListings.length === 0) {
    return { results: [], detectedCorrection: null }
  }

  const maxCoverage = Math.max(...matchedListings.map((r) => r.coverageRatio))
  const firstCorrection = matchedListings.find((r) => r.detectedCorrection)?.detectedCorrection || null

  const filtered = matchedListings
    .filter((r) =>
      maxCoverage >= 1.0 ? r.coverageRatio >= 1.0 : r.coverageRatio >= maxCoverage * 0.7
    )
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item)

  return { results: filtered, detectedCorrection: firstCorrection }
}
