import { asyncHandler } from "../utils/asyncHandler.js";

const regesterUser = asyncHandler( async(req,res)=>{
    console.log("API HIT")
        res.status(200).json({
            success:true,
            message:"Set Up Done "
        })
} )

export  {regesterUser}