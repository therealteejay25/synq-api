import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMagicLink = async (email: string, token: string) => {
  const link = `${process.env.CLIENT_URL}/onboarding/auth/verify?token=${token}`;

  await resend.emails.send({
    from: "sandbox@resend.dev", // Resend’s default verified sender
    to: email,
    subject: "Your secure magic link to sign in",
    html: `
      <h1>Sign in to Synq</h1>
      <p>Click the link below to sign in. This link expires in 15 minutes.</p>
      <a href="${link}" style="color: #6B48FF">${link}</a>
    `,
  });
};
