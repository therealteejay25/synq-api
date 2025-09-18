import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGitHub extends Document {
    username: string;
    avatar?: string;
    bio?: string;
    plan: "free" | "pro" | "team";
    planDue: Date;

    user: Types.ObjectId;
    connectedUsers: Types.ObjectId[];

    accessToken: string;
    refreshToken?: string;
    scopes: string[];

    lastSynced?: Date;
    reposFetchedAt?: Date;
    PRsFetchedAt?: Date;

    webhooks: {
        repoName: string;
        webhooksId: string;
        events: string[];
    }[];

    createdAt: Date;
    updatedAt: Date;
};

const gitHubSchema = new Schema<IGitHub>(
    {
        username: { type: String, required: true },
    avatar: { type: String },
    bio: { type: String },
    plan: { type: String, enum: ["free", "pro"], default: "free" },

    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    connectedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],

    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    scopes: [{ type: String }],

    lastSynced: { type: Date },
    reposFetchedAt: { type: Date },
    PRsFetchedAt: { type: Date },

    webhooks: [
      {
        repoName: { type: String, required: true },
        webhookId: { type: Number, required: true },
        events: [{ type: String }],
      },
    ],
    },
    { timestamps: true }
);

const GitHub = mongoose.model<IGitHub>("GitHub", gitHubSchema);
export default GitHub;