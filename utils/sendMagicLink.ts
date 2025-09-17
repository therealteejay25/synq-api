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
  const link = `http://localhost:5173/auth/verify?token=${token}`; // frontend link
  await transporter.sendMail({
    from: `"Synq" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your magic login link",
    html: `<p>Click <a href="${link}">here</a> to log in. This link expires in 15 minutes.</p>`,
  });
};
