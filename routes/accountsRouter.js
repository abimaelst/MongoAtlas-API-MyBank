import express from 'express';
import { accountsModel } from '../models/accounts.js';

const router = express.Router();

router.get('/', async (_, res) => {
  try {
    const accountsList = await accountsModel.find({});
    res.send(accountsList);
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

router.post('/', async (req, res) => {
  try {
    const newAccount = new accountsModel(req.body);
    await newAccount.save();
    res.send(newAccount);
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

router.patch('/deposit/:ag/:acc', async (req, res) => {
  const deposit = req.body;
  try {
    const account = await accountsModel.find({
      agencia: req.params.ag,
      conta: req.params.acc,
    });
    const newBalance = account[0].balance + deposit.balance;

    const updateAccount = await accountsModel.findOneAndUpdate(
      { agencia: req.params.ag, conta: req.params.acc },
      { balance: newBalance },
      { new: true }
    );
    !updateAccount
      ? res.status(404).send('Conta não encontrada')
      : res
          .status(200)
          .send(`Sr. ${account[0].name} seu novo saldo é ${newBalance}`);
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

router.patch('/withdrawal/:ag/:acc', async (req, res) => {
  const withdrawal = req.body;
  const fee = 1;
  try {
    const account = await accountsModel.find({
      agencia: req.params.ag,
      conta: req.params.acc,
    });
    const newBalance =
      account[0].balance >= withdrawal.balance
        ? account[0].balance - (withdrawal.balance + fee)
        : res.status(404).send('Sem saldo para realizar o saque');

    const updateAccount = await accountsModel.findOneAndUpdate(
      { agencia: req.params.ag, conta: req.params.acc },
      { balance: newBalance },
      { new: true }
    );
    !updateAccount
      ? res.status(404).send('Conta não encontrada')
      : res
          .status(200)
          .send(`Sr. ${account[0].name} seu novo saldo é ${newBalance}`);
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

router.get('/balance/:ag/:acc', async (req, res) => {
  const { ag, acc } = req.params;
  try {
    const account = await accountsModel.findOne({
      agencia: ag,
      conta: acc,
    });
    res.status(200).send({
      Msg: `Sr(a). ${account.name} seu saldo é R$ ${account.balance}`,
    });
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

router.delete('/remove/:ag/:acc', async (req, res) => {
  const { ag, acc } = req.params;
  try {
    const removeAccount = await accountsModel.findOneAndDelete({
      agencia: ag,
      conta: acc,
    });

    const countAccounts = await accountsModel.countDocuments({ agencia: ag });

    !removeAccount
      ? res.status(404).send('Conta não encontrada')
      : res.status(200).send({
          msg:
            'Conta Removida, total de contas restantes para Agência ' +
            ag +
            ': ' +
            countAccounts,
        });
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

router.patch('/transfer/:acco/:accd', async (req, res) => {
  const { acco, accd } = req.params;
  const transfer = req.body;

  try {
    const accountOrigin = await accountsModel.find({
      conta: acco,
    });

    const accountDestiny = await accountsModel.find({
      conta: accd,
    });

    const fee = accountOrigin[0].agencia !== accountDestiny[0].agencia ? 8 : 0;

    const newBalanceOrigin =
      accountOrigin[0].balance - (transfer.balance + fee);
    const newBalanceDestiny = accountDestiny[0].balance + transfer.balance;

    const updateAccOrigin = await accountsModel.findOneAndUpdate(
      { conta: acco },
      { balance: newBalanceOrigin },
      { new: true }
    );

    const updateAccDestiny = await accountsModel.findOneAndUpdate(
      { conta: accd },
      { balance: newBalanceDestiny },
      { new: true }
    );

    res
      .status(200)
      .send(
        `Sr. ${accountOrigin[0].name} seu novo saldo é ${newBalanceOrigin}`
      );
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

router.get('/avg/:ag', async (req, res) => {
  const { ag } = req.params;
  try {
    const averageAg = await accountsModel.aggregate([
      { $match: { agencia: Number(ag) } },
      { $group: { _id: null, average: { $avg: '$balance' } } },
    ]);
    res.status(200).send({
      Msg: `Saldo Médio da Agência ${ag} é R$ ${averageAg[0].average}`,
    });
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

router.get('/lowbalance/:qtd', async (req, res) => {
  const { qtd } = req.params;
  try {
    const clientsLowBalance = await accountsModel
      .find()
      .sort({ balance: 1, name: 1 })
      .limit(Number(qtd));
    res.status(200).send({
      Msg: clientsLowBalance,
    });
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

router.get('/highbalance/:qtd', async (req, res) => {
  const { qtd } = req.params;
  try {
    const clientsHighBalance = await accountsModel
      .find()
      .sort({ balance: -1, name: 1 })
      .limit(Number(qtd));
    res.status(200).send({
      Msg: clientsHighBalance,
    });
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

router.post('/privatebranch', async (req, res) => {
  try {
    const bankBranches = await accountsModel.distinct('agencia');

    for (let i = 0; i < bankBranches.length; i++) {
      const clientHighBalance = await accountsModel
        .find({ agencia: bankBranches[i] })
        .sort({ balance: -1, name: 1 })
        .limit(1);

      const transferPrivateAgency = await accountsModel.findOneAndUpdate(
        { conta: clientHighBalance[0].conta, nome: clientHighBalance[0].nome },
        { agencia: 99 },
        { new: true }
      );
    }

    const accountsPrivateAgency = await accountsModel.find({ agencia: 99 });

    res.status(200).send({ msg: accountsPrivateAgency });
  } catch (err) {
    res.status(500).send({ Error: err });
  }
});

export default router;
