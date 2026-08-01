const asyncHandeler = (requestHandeler)=>{
    return(req,res,next)=>{
        return Promise.resolve(requestHandeler(req,res,next)).catch(error=>{
            if (typeof next === "function") { next(error) } else { throw error }
        })
    }
}

export default asyncHandeler ; 

