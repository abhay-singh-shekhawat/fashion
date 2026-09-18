import axios from "axios";

/* The `google_shopping` engine (and `tbm=shop`) stall for minutes on this
   account while the plain search engine answers in a couple of seconds and
   still returns the product carousel as `immersive_products`, so products are
   read from there. The timeout keeps a slow search from hanging the request
   that asked for it. */
const SEARCH_TIMEOUT_MS = 12000;
const MAX_PRODUCTS = 5;

/* Carousel entries carry no merchant URL, only a token for SerpAPI's own
   product page, so a missing link falls back to a Google Shopping search for
   that title. */
const productLink = (item) =>
  item.link ?? `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.title ?? "")}`;

export const fetchProducts = async (query) => {
  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google",
        q: query,
        /* Read at call time: this module is loaded while the server boots,
           before dotenv has put the key into process.env. A module-level copy
           was undefined, so every search answered 401 and returned nothing. */
        api_key: process.env.SERP_API_KEY,
        gl: "in",
        hl: "en"
      },
      timeout: SEARCH_TIMEOUT_MS
    });

    const results = response.data.immersive_products ?? response.data.shopping_results ?? [];

    return results.slice(0, MAX_PRODUCTS).map(item => ({
      title: item.title,
      price: item.price,
      source: item.source,
      image: item.thumbnail,
      link: productLink(item)
    }));

  } catch (err) {
    console.log("Search API error:", err.message);
    return [];
  }
};