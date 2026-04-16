import {Queue} from "bullmq"
import {bullMqConnection} from "./redis.js"

const connection = {
    connection: bullMqConnection,
    prefix: "stylesence"
}

export const scanQueue = new Queue(`outfit-scan`,connection)
export const scanQueuelite = new Queue(`outfit-scan`,connection)

export default {scanQueue}