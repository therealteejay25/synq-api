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
  const link = `http://synq-lime.vercel.app/onboard/set-workspace?token=${token}`; 
  await transporter.sendMail({
    from: `"Synq" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Magic Login Link",
    html: `my name is fawas {link} `

  });
};
