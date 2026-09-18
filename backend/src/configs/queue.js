import {Queue} from "bullmq"
import {bullMqConnection} from "./redis.js"

/* BullMQ namespaces every Redis key by prefix. Queues AND Workers must agree on
   it: with a mismatch the queue writes to `stylesence:outfit-scan:*` while the
   worker listens on the default `bull:outfit-scan:*`, so jobs sit in `:wait`
   forever and are never processed. */
export const QUEUE_PREFIX = "stylesence"

const connection = {
    connection: bullMqConnection,
    prefix: QUEUE_PREFIX
}

export const scanQueue = new Queue(`outfit-scan`,connection)
export const scanQueuelite = new Queue(`outfit-scan-lite`,connection)
export const skinToneQueue = new Queue(`skintone-scan`,connection)
export const ratingCleanupQueue = new Queue(`rating-cleanup`,connection)

/** Shared Worker options. Spread into every `new Worker(...)` call so workers
 *  can never drift from the queue prefix again. */
export const workerOptions = {
    connection: bullMqConnection,
    prefix: QUEUE_PREFIX,
    attempts: 3,
    backoff: { type: `exponential`, delay: 5000 }
}

export default {scanQueue, skinToneQueue, ratingCleanupQueue}
