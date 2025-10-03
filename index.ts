import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import ConnectDB from './config/db.ts'
import authRoutes from './routes/authRoutes.ts'
import gitHubRoutes from './routes/gitHubRoutes.ts'
import cookieParser from 'cookie-parser'

dotenv.config();

const PORT = process.env.PORT;
const CLIENT_URL ="http://localhost:3000"; // frontend url

const app = express();

// --- MIDDLEWARE ---
const allowedOrigins = [
  "http://localhost:3000",
  "https://synq-lime.vercel.app",
  "https://miniature-spoon-wr54g96jp4wqf599q.github.dev",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// --- DATABASE ---
ConnectDB();

// --- ROUTES ---
app.use('/auth', authRoutes);
app.use('/api/github', gitHubRoutes);

app.get('/ping', (req, res) => {
  res.json({ pong: true });
});

// Test route to check authentication
app.get('/test-auth', (req, res) => {
  res.json({ 
    message: "Auth test route",
    cookies: req.cookies,
    hasAccessToken: !!req.cookies.accessToken
  });
});

// --- SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
