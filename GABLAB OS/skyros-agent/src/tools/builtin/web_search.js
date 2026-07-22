/**
 * SKORTEX — Built-in Tool: web_search
 * Web search via Brave Search API (free tier).
 * Zero external dependencies — uses native fetch.
 */

export const webSearchTool = {
  name: 'web_search',
  description: 'Search the web using Brave Search API. Returns titles, URLs, and descriptions of top results. Use for researching technologies, finding documentation, checking latest versions, news, or any information not in local files.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query (max 400 chars)',
      },
      count: {
        type: 'number',
        description: 'Number of results to return (1-20, default: 5)',
      },
    },
    required: ['query'],
  },
  execute: async ({ query, count }) => {
    const numResults = Math.min(Math.max(count || 5, 1), 20);

    // Try Brave Search API first
    const braveKey = process.env.BRAVE_API_KEY || process.env.BRAVE_SEARCH_API_KEY;
    if (braveKey) {
      return searchBrave(query, numResults, braveKey);
    }

    // Fallback: use DuckDuckGo Instant Answer API (no key needed)
    return searchDuckDuckGo(query);
  },
};

/**
 * Brave Search API
 */
async function searchBrave(query, count, apiKey) {
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      return `Brave API error: ${response.status} ${response.statusText}`;
    }

    const data = await response.json();
    const results = data.web?.results || [];

    if (results.length === 0) {
      return `No results found for: "${query}"`;
    }

    return results.map((r, i) =>
      `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.description || '(no description)'}`
    ).join('\n\n');
  } catch (err) {
    return `Brave search error: ${err.message}`;
  }
}

/**
 * DuckDuckGo Instant Answer API (fallback, no key needed)
 */
async function searchDuckDuckGo(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(url);
    const data = await response.json();

    const parts = [];

    if (data.AbstractText) {
      parts.push(`**${data.Heading || 'Result'}**\n${data.AbstractText}\nSource: ${data.AbstractURL}`);
    }

    if (data.RelatedTopics?.length > 0) {
      const topics = data.RelatedTopics.slice(0, 5);
      for (const topic of topics) {
        if (topic.Text) {
          parts.push(`- ${topic.Text}\n  ${topic.FirstURL || ''}`);
        }
      }
    }

    if (parts.length === 0) {
      return `No instant answer for: "${query}". Try a more specific query or set BRAVE_API_KEY for full web search.`;
    }

    return parts.join('\n\n');
  } catch (err) {
    return `DuckDuckGo search error: ${err.message}`;
  }
}

export default webSearchTool;
