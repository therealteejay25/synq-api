import mongoose, { Schema, Document } from "mongoose";

export interface IIntegration extends Document {
  name: string; // e.g., "github"
  provider: string; // e.g., "github"
  providerAccountId: string; // GitHub user ID
  userId: string;
  orgId?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  scopes: string[];
  username?: string;
  avatar?: string;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    name: { type: String, required: true },
    provider: { type: String, required: true }, // "github"
    providerAccountId: { type: String, required: true }, // unique per provider
    userId: { type: String, required: true, ref: "User" }, 
    orgId: { type: String, required: false },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: false },
    expiresAt: { type: Date, required: false },
    createdAt: { type: Date, default: Date.now },
    scopes: [{ type: String }],
    username: { type: String },
    avatar: { type: String },
  },
  { timestamps: true }
);

// Each user can have multiple integrations, but only one per providerAccountId
IntegrationSchema.index({ userId: 1, provider: 1, providerAccountId: 1 }, { unique: true });

const Integration = mongoose.model<IIntegration>("Integration", IntegrationSchema);
export default Integration;
