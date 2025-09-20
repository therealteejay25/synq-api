import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import ConnectDB from './config/db.ts'
import authRoutes from './routes/authRoutes.ts'
import gitHubRoutes from './routes/gitHubRoutes.ts'

dotenv.config();

const PORT = process.env.PORT

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

ConnectDB();

app.use('/auth', authRoutes);
app.use('/api/github', gitHubRoutes);

app.get('/ping', (req, res) => {
    res.json({ pong: true });
});

app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`)
})
