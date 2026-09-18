/* The vision model's only numeric output is a per-item confidence, so nothing
   downstream ever checked that the photo held a garment at all: an event poster
   was analysed like any outfit and came back with a confident 57/100.
   This module is the single place that decides "is this actually clothing?" —
   both the wardrobe scanner and the rating worker use it. */

export const FASHION_IMAGE_RULES = `First decide whether this image is really wearable fashion.
        Set "isFashionImage" to false — and leave "detectedItems" empty — when it is not clothing:
        posters, flyers, invitations, banners, logos, memes, screenshots, documents, receipts, charts,
        interiors, food, animals, landscapes, portraits with no visible garments or plain graphics.
        Set it to true only when you can name real garments: worn by a person, held up, on a hanger or
        laid flat. Shoes, bags, jewellery and watches count when they are the subject of the photo.
        Whenever "isFashionImage" is false, put a short reason in "rejectionReason".`;

export const NOT_FASHION_MESSAGE =
  "That doesn't look like a clothing or outfit photo — I couldn't find a piece to score. Try a photo of the actual clothes.";

/**
 * Normalise a vision response so callers get real garments or a clear refusal.
 *
 * An empty `detectedItems` is treated as a refusal too: a response with nothing
 * in it cannot produce a meaningful score, and the scorer only ever invented one
 * from missing data.
 */
export const readOutfitAnalysis = (analysis) => {
  const items = Array.isArray(analysis?.detectedItems)
    ? analysis.detectedItems.filter((item) => item && typeof item === 'object')
    : [];
  /* JSON mode usually honours the boolean, but a stringified "false" has shown
     up in model replies often enough to be worth catching. */
  const flagged = analysis?.isFashionImage === false || analysis?.isFashionImage === 'false';

  return {
    items,
    isFashionImage: !flagged && items.length > 0,
    rejectionReason:
      typeof analysis?.rejectionReason === 'string' ? analysis.rejectionReason : null,
  };
};
