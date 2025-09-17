import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrg extends Document {
  name: string;
  slug: string;

  members: {
    user: Types.ObjectId;
    role: "owner" | "admin" | "member";
    joinedAt: Date;
  }[];

  ownedTools: Types.ObjectId[];

  createdAt: Date;
}

const orgSchema = new Schema<IOrg>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    ownedTools: [{ type: Schema.Types.ObjectId, ref: "Tool" }],

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Org = mongoose.model<IOrg>("Org", orgSchema);
export default Org;
