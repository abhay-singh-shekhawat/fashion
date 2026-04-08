import redis from "../configs/redis.js"

const defaultTtl = 300

export const setCache = async(key,data,ttl=defaultTtl)=>{
    try {
        await redis.set(key,JSON.stringify(data),`EX`,ttl)
    } catch (error) {
        console.log("Error in setcache",error)
    }
}

export const getCache = async(key)=>{
    try {
        const data = await redis.get(key)
        return data ? JSON.parse(data) : null
    } catch (error) {
        console.log("Error in getCache",error)
    }
}

export const deleteCache = async(key)=>{
    try {
        await redis.del(key)
    } catch (error) {
        console.log("Error in deleteCache",error)
    }
}

export const generateCacheKey = (prefix,identifier)=>{
    return `${prefix}:${identifier}`
}