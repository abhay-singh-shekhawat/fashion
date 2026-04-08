import {Queue} from "bullmq"
import redis from "./redis.js"
import { connection } from "mongoose"

const connection = {
    connection: redis,
    prefix: "stylesence"
}

export const scanQueue = new Queue(`outfit-scan`,connection)

export default {scanQueue}