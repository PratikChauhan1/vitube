import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
// import { ApiError } from "./ApiError";

    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
var response

const unloadOnCloudinary = async (localfilePath)=> {
    try {
        if(!localfilePath) return null

        // Upload file on cloudinary
      response =await cloudinary.uploader.upload(localfilePath,{
            resource_type: "auto"
        })
        // file upload successfully 
        console.log(`File is Uploaded Successfully in Cloudinary ${response.url} `);
        return response
    } catch (error) {
        fs.unlinkSync(localfilePath) // remove the locally saved temporary file as the upload operation got failed
        return null
    }
}

const deleteOnCloudinary = async (cloudinaryURL) => {
    if (!cloudinaryURL) {
        return null
    }

    try {
        const result = await cloudinary.uploader.destroy(cloudinaryURL);

        if (result.result !== "ok") {
            throw new ApiError(500, "Failed to delete file");
        }

        return result;
    } catch (error) {
        throw new ApiError(500, error.message || "Deletion error");
    }
};


export {unloadOnCloudinary,deleteOnCloudinary}