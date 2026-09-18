import { Worker } from "bullmq"
import { workerOptions, ratingCleanupQueue } from "../configs/queue.js"
import { sweepExpiredRatings, RETENTION_DAYS } from "../utils/ratingRetention.js"

/* Nightly at 03:00. The schedule lives in Redis, so it survives restarts and
   re-registering on every boot doesn't stack up duplicate sweeps. */
const SWEEP_PATTERN = "0 3 * * *"

const ratingCleanupWorker = new Worker(`rating-cleanup`, async () => {
    const summary = await sweepExpiredRatings();
    console.log(`[Rating Retention] Removed ${summary.deleted} rating(s) older than ${RETENTION_DAYS} days and ${summary.imagesRemoved} photo(s)`);
    return summary;
}, workerOptions)

ratingCleanupQueue
    .upsertJobScheduler(
        `rating-retention`,
        { pattern: SWEEP_PATTERN },
        { name: `sweep`, opts: { removeOnComplete: true, removeOnFail: 10 } }
    )
    .catch((error) => {
        /* A missing schedule only delays cleanup; the next boot retries. */
        console.warn(`[Rating Retention] Could not schedule the sweep: ${error.message}`);
    });

console.log('Rating cleanup worker started');

export default ratingCleanupWorker;
