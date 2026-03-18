// src/db/index.js
// import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";
// import dotenv from "dotenv";

// dotenv.config(); // load .env

// const connectDB = async () => {
//   try {
//     const connectionInstant = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     console.log(`MongoDB Connected: ${connectionInstant.connection.host}`);
//   } catch (error) {
//     console.error("Mongo DB connection FAILED:", error);
//     process.exit(1);
//   }
// };

// export default connectDB;










import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"
import dotenv from "dotenv"

dotenv.config({
    path:'./env'
}) 

const connectDB = async () =>{
    try {
       const connectionInstant = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       console.log(`\n MongoDB Connected !! DB HOST : ${connectionInstant.connection.host}`);
       
    } catch (error) {
        console.log("Mongo DB connection FAILED :",error);
        process.exit(1)  
    }
}

export default  connectDB