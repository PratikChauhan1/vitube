import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    subcriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    chennel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    }
  },
  { timestamps: true }
);

export default Subscription = mongoose.model(
  "Subscription",
  subscriptionSchema
);
