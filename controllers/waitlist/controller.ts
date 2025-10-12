import { Request, Response } from "express";
import Waitlist from "../../models/Waitlist.ts";


export const addToWaitlist = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }
    const existingEntry = await Waitlist.findOne({ email });
    if (existingEntry) {
        throw new Error("User is already on the waitlist.");
    }       
    const newEntry = new Waitlist({ email });
    await newEntry.save();
    return res.status(200).json({ message: "Successfully added to the waitlist." });
}

export const getWaitlist = async (req: Request, res: Response) => {
    const waitlist = await Waitlist.find();
    return res.status(200).json(waitlist);
}