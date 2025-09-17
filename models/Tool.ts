import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITool extends Document {
  name: string;
  provider: string; // "slack" | "notion" | "figma" | "github"
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  scopes?: string[];
  connectedAt: Date;
  lastSynced?: Date;

  ownerUser?: Types.ObjectId;
  ownerOrg?: Types.ObjectId;
}

const toolSchema = new Schema<ITool>(
  {
    name: { type: String, required: true },
    provider: { type: String, required: true },
    accountId: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    scopes: [{ type: String }],
    connectedAt: { type: Date, default: Date.now },
    lastSynced: { type: Date },

    ownerUser: { type: Schema.Types.ObjectId, ref: "User" },
    ownerOrg: { type: Schema.Types.ObjectId, ref: "Org" },
  },
  { timestamps: true }
);

// Validate only one owner
toolSchema.pre("save", function (next) {
  if (this.ownerUser && this.ownerOrg) {
    return next(new Error("Tool can only have one owner: either user or org"));
  }
  next();
});

const Tool = mongoose.model<ITool>("Tool", toolSchema);
export default Tool;
