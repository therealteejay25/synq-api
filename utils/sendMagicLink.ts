import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMagicLink = async (email: string, token: string) => {
  const link = `${process.env.CLIENT_URL}/onboarding/auth/verify?token=${token}`; 
  // Backwards compatibility: if a full URL is passed in, use it directly; else treat it as a raw token

  const preheader = "Secure one-click sign-in. This link expires in 15 minutes.";
  const brandColor = "#6C5CE7"; // Synq brand accent
  const textColor = "#0F172A"; // slate-900
  const mutedColor = "#475569"; // slate-600
  const borderColor = "#E2E8F0"; // slate-200
  const bgColor = "#F8FAFC"; // slate-50


  await transporter.sendMail({
    from: `"Synq" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your secure magic link to sign in",
    text: `Sign in to Synq: ${link}\n\nThis link expires in 15 minutes. If you didn’t request this, just ignore this email.`,
  });
};
