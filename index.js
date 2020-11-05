const express = require('express');
const mongodb = require('mongodb');
const rescue = require('express-rescue');
const bodyParser = require('body-parser');

async function start() {
  const app = express();

  app.use(bodyParser.json());

  // não remova esse endpoint, e para o avaliador funcionar
  app.get('/', (request, response) => {
    response.send();
  });

  const db = await mongodb
    .connect(process.env.MONGO_DB_URL || 'mongodb://mongodb:27017/StoreManager', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((connection) => connection.db(process.env.DB_NAME || 'StoreManager'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });

  app.post(
    '/products',
    rescue(async (req, res) => {
      const { name, quantity } = req.body;

      const id = await db
        .collection('products')
        .insertOne({ name, quantity })
        .then(({ insertedId }) => insertedId);

      return res.status(201).json({ name, quantity, _id: id });
    }),
  );

  app.get(
    '/products',
    rescue(async (_req, res) => {
      const products = await db.collection('products').find().toArray();

      return res.status(200).json({ products });
    }),
  );

  app.get(
    '/products/:id',
    rescue(async (req, res) => {
      const { id } = req.params;

      if (!mongodb.ObjectId.isValid(id)) {
        return res.status(422).json({ err: { code: 'invalid_data', message: 'Wrong id format' } });
      }

      const product = await db.collection('products').findOne(mongodb.ObjectId(id));

      res.status(200).json(product);
    }),
  );

  const { PORT = 3000 } = process.env;

  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });
}

start();
