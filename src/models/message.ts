import mongoose, { Schema } from "mongoose";

interface IMessage extends Document {
  id: string;
  text: string;
  username: string;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMessage>("Message", MessageSchema);
