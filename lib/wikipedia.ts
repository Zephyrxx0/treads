/**
 * Wikipedia Action API integration for biological taxon verification
 * and plain-text lead extract retrieval with sentence indexing.
 * Per IDEN-04, FACT-01, and Decisions D-09, D-10.
 */

export interface WikipediaTaxonResult {
  verified: boolean;
  canonicalTitle: string;
  description?: string;
  pageId?: number;
}

export interface WikipediaLeadSentencesResult {
  sentences: Array<{ index: number; text: string }>;
  sourceUrl: string;
}

// In-memory LRU-style cache to avoid redundant network hits during active sessions
const taxonVerificationCache = new Map<string, WikipediaTaxonResult>();
const leadSentencesCache = new Map<string, WikipediaLeadSentencesResult>();

/**
 * Queries the Wikipedia Action API with `redirects=1` and `prop=categories|pageprops`
 * to verify biological legitimacy (species microformats, italic display title, taxonomic description).
 */
export async function verifyWikipediaTaxon(title: string): Promise<WikipediaTaxonResult> {
  const cacheKey = title.trim().toLowerCase();
  if (taxonVerificationCache.has(cacheKey)) {
    return taxonVerificationCache.get(cacheKey)!;
  }

  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      title
    )}&redirects=1&prop=categories|pageprops&format=json&origin=*`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TreadsApp/1.0 (https://github.com/zeph/treads; treads-companion@example.com)',
      },
      next: { revalidate: 86400 }, // Cache on Next.js server for 24h
    });

    if (!res.ok) {
      return { verified: false, canonicalTitle: title };
    }

    const data = await res.json();
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];

    // Missing page (pageId -1)
    if (!pageId || pageId === '-1') {
      const result: WikipediaTaxonResult = { verified: false, canonicalTitle: title };
      taxonVerificationCache.set(cacheKey, result);
      return result;
    }

    const page = pages[pageId];
    const canonicalTitle: string = page.title || title;
    const categories: Array<{ title: string }> = page.categories || [];
    const pageprops = page.pageprops || {};

    // 1. Biological category markers
    const hasSpeciesMicroformat = categories.some((c) => {
      const cat = c.title.toLowerCase();
      return (
        cat.includes('species') ||
        cat.includes('taxa') ||
        cat.includes('flora of') ||
        cat.includes('fauna of') ||
        cat.includes('plants') ||
        cat.includes('birds') ||
        cat.includes('insects') ||
        cat.includes('fungi') ||
        cat.includes('trees') ||
        cat.includes('mammals') ||
        cat.includes('reptiles') ||
        cat.includes('amphibians')
      );
    });

    // 2. Botanical/zoological convention: italicized binomial nomenclature in displaytitle
    const isItalicDisplay = (pageprops.displaytitle || '').includes('<i>');

    // 3. Short description taxonomic keywords
    const shortDesc = (pageprops['wikibase-shortdesc'] || '').toLowerCase();
    const hasTaxonDesc = [
      'species',
      'genus',
      'plant',
      'tree',
      'bird',
      'insect',
      'fungus',
      'animal',
      'organism',
      'wildflower',
      'mammal',
      'fern',
      'moss',
    ].some((kw) => shortDesc.includes(kw));

    const verified = hasSpeciesMicroformat || isItalicDisplay || hasTaxonDesc;

    const result: WikipediaTaxonResult = {
      verified,
      canonicalTitle,
      description: pageprops['wikibase-shortdesc'],
      pageId: Number(pageId),
    };

    taxonVerificationCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`[Wikipedia Taxon] Failed to verify title "${title}":`, err);
    return { verified: false, canonicalTitle: title };
  }
}

/**
 * Fetches plain-text intro extract for an organism and segments it into numbered sentences
 * using the native browser/Node Intl.Segmenter.
 */
export async function getWikipediaLeadSentences(title: string): Promise<WikipediaLeadSentencesResult> {
  const cacheKey = title.trim().toLowerCase();
  if (leadSentencesCache.has(cacheKey)) {
    return leadSentencesCache.get(cacheKey)!;
  }

  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
      title
    )}&redirects=1&format=json&origin=*`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TreadsApp/1.0 (https://github.com/zeph/treads; treads-companion@example.com)',
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return {
        sentences: [],
        sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      };
    }

    const data = await res.json();
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const extract: string = pages[pageId]?.extract || '';
    const canonicalTitle: string = pages[pageId]?.title || title;

    // Use Intl.Segmenter for boundary detection
    const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    const rawSentences = Array.from(segmenter.segment(extract), (s) => s.segment.trim()).filter(
      (s) => s.length > 10
    );

    const sentences = rawSentences.slice(0, 25).map((text, idx) => ({
      index: idx + 1,
      text,
    }));

    const result: WikipediaLeadSentencesResult = {
      sentences,
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(canonicalTitle.replace(/ /g, '_'))}`,
    };

    leadSentencesCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`[Wikipedia Extract] Failed to fetch extract for "${title}":`, err);
    return {
      sentences: [],
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  }
}
