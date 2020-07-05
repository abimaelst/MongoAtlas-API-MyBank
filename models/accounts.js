import mongoose from 'mongoose';

// create model
const accountsSchema = mongoose.Schema({
  agencia: {
    type: Number,
    required: true,
  },
  conta: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    validate(value) {
      if (value < 0) {
        throw new Error('Valor não pode ser nagativo');
      }
    },
  },
});

const accountsModel = mongoose.model('accounts', accountsSchema);

export { accountsModel };
