import express from 'express';
import mongoose from 'mongoose';
import accRouter from './routes/accountsRouter.js';

//Conectar ao MongoDB via Mongoose
const connection = async () => {
  await mongoose.connect(
    'mongodb+srv://abimael:NicDom3115@cluster0.lkbbg.mongodb.net/Bank?retryWrites=true&w=majority',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  console.log('Connected to MongoDB Atlas!!');
};
connection();

const app = express();
app.use(express.json());
app.use('/account', accRouter);

app.listen(3000, () => console.log('API iniciada!'));
