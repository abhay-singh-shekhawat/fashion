/* Two windows: a look suggested inside the lookback window is set aside so the
   app doesn't repeat itself, and records are kept a little longer than that so
   the history can still explain the picks it replaced. */
export const RECOMMENDATION_LOOKBACK_DAYS = 3;
export const RECOMMENDATION_RETENTION_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export const lookbackCutoff = (now = new Date()) =>
  new Date(now.getTime() - RECOMMENDATION_LOOKBACK_DAYS * DAY_MS);

/** Same pieces, same look — order-independent, so two days can be compared. */
export const outfitKey = (pieces = []) =>
  pieces
    .map((piece) => String(piece?._id ?? piece?.id ?? piece))
    .sort()
    .join("|");

/** "16 Sep" — history notes are read as prose, not timestamps. */
export const formatSuggestedDay = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
