import mongoose, { Schema, Document } from "mongoose";

export interface IVideo extends Document {
  title: string;
  path: string;
  thumbnail?: string;
  duration?: number;
  size?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true },
    path: { type: String, required: true, unique: true },
    thumbnail: { type: String },
    duration: { type: Number },
    size: { type: Number },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Video ||
  mongoose.model<IVideo>("Video", VideoSchema);
