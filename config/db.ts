import mongoose from 'mongoose'

export default function ConnectDB () {
    mongoose.connect(process.env.MONOG_URI as string)
.then(() => {
    console.log('Monog DB Connected')
})
.catch((err) => {
    console.error('MongoDB Error:', err)
});
}