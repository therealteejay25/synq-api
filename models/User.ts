import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  avatar?: string;
  magicLinkToken: string | null;
  magicLinkExpires: Date | null;
  magicLinkUsed: boolean;
  plan: "free" | "pro" | "team";
  planDue: Date;

  orgs: {
    org: Types.ObjectId;
    role: "owner" | "admin" | "member";
    joinedAt: Date;
  }[];

  settings: {
    theme: "light" | "dark" | "system";
    language: string;
    notifications: boolean;
  };

  preferences: Record<string, any>;

  ownedTools: Types.ObjectId[]; // Tools they personally created

  createdAt: Date;
  lastLogin?: Date;
  lastActive?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    magicLinkToken: { type: String, required: false },
    magicLinkExpires: { type: Date, required: false },
    magicLinkUsed: { type: Boolean, required: false },
    plan: { type: String, required: true, default: "free" },
    planDue: { type: Date, required: false },

    orgs: [
      {
        org: { type: Schema.Types.ObjectId, ref: "Org" },
        role: {
          type: String,
          enum: ["owner", "admin", "member"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    ownedTools: [{ type: Schema.Types.ObjectId }],

    settings: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      language: { type: String, default: "en" },
      notifications: { type: Boolean, default: true },
    },

    preferences: { type: Schema.Types.Mixed, default: {} },

    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    lastActive: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
