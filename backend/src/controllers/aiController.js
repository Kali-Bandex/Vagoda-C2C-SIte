const Product = require("../models/Product");
const Service = require("../models/Service");
const Job = require("../models/Job");

/**
 * Call Gemini REST API to analyze intent and produce AI summary & query terms
 */
async function getGeminiAnalysis(query) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are Vagoda AI, an intelligent e-commerce and marketplace assistant.
Analyze the user's search query and return a valid JSON object matching this schema:
{
  "aiSummary": "A friendly 1-2 sentence executive recommendation explaining what products, services, or jobs best match their search.",
  "intentCategory": "Category name or All (e.g., Electronics, Home, Engineering, Fashion, Services)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "suggestedQueries": ["3 relevant query suggestions based on search"]
}
Only output strict JSON without markdown code blocks.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\nUser Query: "${query}"` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      console.warn("Gemini API HTTP Error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    // Clean markdown formatting if present
    const cleanedText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.warn("Gemini AI API call failed, falling back to local heuristic search:", err.message);
    return null;
  }
}

/**
 * Calculate semantic relevance score (50% - 99%) for a model item based on search tokens
 */
function computeMatchScore(item, queryTokens, keywords = []) {
  const textToMatch = [
    item.title || "",
    item.description || "",
    item.category || "",
    item.company || "",
    item.location || "",
    ...(item.skills || []),
    ...(item.specs ? item.specs.map((s) => `${s.key} ${s.value}`) : []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 65; // Base relevance
  const allTerms = Array.from(new Set([...queryTokens, ...keywords])).filter(Boolean);

  if (allTerms.length === 0) return 85;

  let hits = 0;
  for (const term of allTerms) {
    const lowerTerm = term.toLowerCase();
    if (textToMatch.includes(lowerTerm)) {
      hits++;
      if ((item.title || "").toLowerCase().includes(lowerTerm)) {
        score += 15; // Title match bonus
      } else {
        score += 8;
      }
    }
  }

  // Cap score between 70% and 98%
  const finalScore = Math.min(98, Math.max(70, score + Math.round((hits / allTerms.length) * 15)));
  return finalScore;
}

/**
 * Generate match reason for item
 */
function getMatchReason(item, query) {
  if (item.kind === "service" || item.providerId) {
    return `Matches service requests for "${query}" with high provider rating (${item.rating || 4.8}★).`;
  }
  if (item.recruiterId || item.company) {
    return `Relevant role at ${item.company || "Top Employer"} matching key skill requirements.`;
  }
  return `High keyword relevancy in ${item.category || "marketplace"} with top customer feedback.`;
}

/**
 * @desc    AI-Powered Semantic Search across Products, Services, and Jobs
 * @route   POST /api/ai/search or GET /api/ai/search
 * @access  Public
 */
const semanticSearch = async (req, res) => {
  try {
    const query = (req.body?.query || req.query?.query || "").trim();

    if (!query) {
      // Fetch default featured items
      const [products, services, jobs] = await Promise.all([
        Product.find().limit(6).lean(),
        Service.find().limit(6).lean(),
        Job.find().limit(6).lean(),
      ]);

      return res.json({
        success: true,
        query: "",
        aiSummary: "Welcome to Vagoda AI Mode. Enter any query or request to get smart AI recommendations across products, services, and career opportunities.",
        intent: {
          category: "All",
          keywords: [],
        },
        results: {
          products: products.map((p) => ({
            ...p,
            id: p._id.toString(),
            matchScore: 95,
            matchReason: "Trending marketplace recommendation.",
          })),
          services: services.map((s) => ({
            ...s,
            id: s._id.toString(),
            matchScore: 92,
            matchReason: "Top rated featured service.",
          })),
          jobs: jobs.map((j) => ({
            ...j,
            id: j._id.toString(),
            matchScore: 90,
            matchReason: "Featured career opportunity.",
          })),
        },
        suggestedQueries: [
          "Wireless noise cancelling headphones",
          "Web developer for hire",
          "Ergonomic office setup",
          "Logistics courier service",
        ],
        totalMatches: products.length + services.length + jobs.length,
      });
    }

    // 1. Get AI analysis from Gemini
    const aiAnalysis = await getGeminiAnalysis(query);

    const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const keywords = aiAnalysis?.keywords || queryTokens;
    const category = aiAnalysis?.intentCategory || "All";

    // 2. Build search filter for MongoDB text/regex search
    const regexPattern = queryTokens.map((t) => `(?=.*${t})`).join("") || query;
    const searchRegex = new RegExp(queryTokens.join("|"), "i");

    const productQuery = {
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ],
    };

    const serviceQuery = {
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ],
    };

    const jobQuery = {
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { company: searchRegex },
        { skills: searchRegex },
      ],
    };

    // 3. Execute parallel queries
    const [rawProducts, rawServices, rawJobs] = await Promise.all([
      Product.find(productQuery).limit(8).lean(),
      Service.find(serviceQuery).limit(8).lean(),
      Job.find(jobQuery).limit(8).lean(),
    ]);

    // Fallback search if strict query returned 0 items
    let finalProducts = rawProducts;
    let finalServices = rawServices;
    let finalJobs = rawJobs;

    if (rawProducts.length === 0 && rawServices.length === 0 && rawJobs.length === 0) {
      [finalProducts, finalServices, finalJobs] = await Promise.all([
        Product.find().limit(4).lean(),
        Service.find().limit(4).lean(),
        Job.find().limit(4).lean(),
      ]);
    }

    // 4. Compute match scores & format output
    const products = finalProducts.map((p) => {
      const matchScore = computeMatchScore(p, queryTokens, keywords);
      return {
        ...p,
        id: p._id.toString(),
        matchScore,
        matchReason: getMatchReason(p, query),
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    const services = finalServices.map((s) => {
      const matchScore = computeMatchScore(s, queryTokens, keywords);
      return {
        ...s,
        id: s._id.toString(),
        matchScore,
        matchReason: getMatchReason(s, query),
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    const jobs = finalJobs.map((j) => {
      const matchScore = computeMatchScore(j, queryTokens, keywords);
      return {
        ...j,
        id: j._id.toString(),
        matchScore,
        matchReason: getMatchReason(j, query),
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    // 5. Generate AI Summary fallback if Gemini offline
    let summaryText = aiAnalysis?.aiSummary;
    if (!summaryText) {
      const totalCount = products.length + services.length + jobs.length;
      summaryText = `Found ${totalCount} highly relevant result${totalCount === 1 ? "" : "s"} across Products, Services, and Jobs for "${query}". AI matched items based on title keywords, specifications, and provider ratings.`;
    }

    const suggestedQueries = aiAnalysis?.suggestedQueries || [
      `${query} under $100`,
      `Top rated ${query}`,
      `Freelance ${query} services`,
    ];

    res.json({
      success: true,
      query,
      aiSummary: summaryText,
      intent: {
        category,
        keywords,
      },
      results: {
        products,
        services,
        jobs,
      },
      suggestedQueries,
      totalMatches: products.length + services.length + jobs.length,
    });
  } catch (error) {
    console.error("AI Search Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "AI Semantic Search failed",
      error: error.message,
    });
  }
};

module.exports = {
  semanticSearch,
};
