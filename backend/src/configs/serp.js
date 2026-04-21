import axios from "axios";

const SERP_API_KEY = process.env.SERP_API_KEY;

export const fetchProducts = async (query) => {
  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_shopping",
        q: query,
        api_key: SERP_API_KEY
      }
    });

    const results = response.data.shopping_results || [];

    return results.slice(0, 5).map(item => ({
      title: item.title,
      price: item.price,
      link: item.link,
      image: item.thumbnail
    }));

  } catch (err) {
    console.log("Search API error:", err.message);
    return [];
  }
};