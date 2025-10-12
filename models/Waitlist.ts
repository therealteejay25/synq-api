import mongoose, { Document, Schema } from 'mongoose';

export interface IWaitlist extends Document {
  email: string;
};

const waitlistSchema = new Schema<IWaitlist>(
  {
    email: { type: String, required: true, unique: true },
});

const Waitlist = mongoose.model<IWaitlist>('Waitlist', waitlistSchema);
export default Waitlist;