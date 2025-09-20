import jwt from "jsonwebtoken";
import axios from "axios";
import { githubConfig } from "../config/github.ts";

export function createAppJWT() {
  const now = Math.floor(Date.now() / 1000);

  const privateKey = githubConfig.privateKey.replace(/\\n/g, '\n');

  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 600, 
      iss: githubConfig.appId,
    },
    privateKey,
    { algorithm: "RS256" }
  );
}

export async function createInstallationAccessToken(installationId: number) {
  const appJWT = createAppJWT();

  const res = await axios.post(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {},
    {
      headers: {
        Authorization: `Bearer ${appJWT}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  return res.data; // includes token + expires_at
}
