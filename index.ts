import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import ConnectDB from './config/db.ts'
import authRoutes from './routes/authRoutes.ts'
import ngrok from '@ngrok/ngrok'

dotenv.config();

const PORT = process.env.PORT

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

ConnectDB();

app.use('/auth', authRoutes);

app.get('/ping', (req, res) => {
    res.json({ pong: true });
});

app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`)
})

ngrok.connect({ addr: 9000, authtoken_from_env: true })
	.then(listener => console.log(`Ingress established at: ${listener.url()}`));