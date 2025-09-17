import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET);
};
