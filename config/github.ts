import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import fs from 'fs'

dotenv.config();

const privateKey = fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH!, "utf8")

export const githubConfig = {
  appId: process.env.GITHUB_APP_ID!,
  privateKey: privateKey,
};

export const createAppJWT = () => {
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 600,
      iss: githubConfig.appId,
    },
    githubConfig.privateKey,
    { algorithm: "RS256" }
  )
};