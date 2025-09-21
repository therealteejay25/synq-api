import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGitHub extends Document {
  userId: string;
  orgId?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gitHubSchema = new Schema<IGitHub>(
  {
    userId: {type: String,  required: true, unique: true, ref: 'User'}, 
    orgId: {type: String,  required: false},
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: false },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const GitHub = mongoose.model<IGitHub>(
  "GitHub",
  gitHubSchema
);

export default GitHub;
