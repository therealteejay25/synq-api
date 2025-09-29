import axios from "axios";
import { env } from "../config/env";

const SLACK_CLIENT_ID = env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = env.SLACK_CLIENT_SECRET;
const SLACK_REDIRECT_URI = env.SLACK_REDIRECT_URI;

export async function getSlackOAuthUrl(scopes: string[]) {
  const params = new URLSearchParams({
    client_id: SLACK_CLIENT_ID,
    user_scope: scopes.join(" "),
    redirect_uri: SLACK_REDIRECT_URI,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function getSlackToken(code: string) {
  const params = new URLSearchParams({
    client_id: SLACK_CLIENT_ID,
    client_secret: SLACK_CLIENT_SECRET,
    code,
    redirect_uri: SLACK_REDIRECT_URI,
  });
  const { data } = await axios.post(
    "https://slack.com/api/oauth.v2.access",
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  if (!data.ok) throw new Error(data.error);
  return data;
}
