import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js"
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is Running at port ${process.env.PORT}`)
    });

    app.on("error", (err) => {
      console.log(`Errrr : ${err}`);
      process.exit(1);
    });
  })

  .catch("error",(err) => {
    console.log(`MongoDB Connection Failed !!! ${err}`);
  });

import {route} from "./routes/users.routes.js"
app.use("/api/v1/users",route)

