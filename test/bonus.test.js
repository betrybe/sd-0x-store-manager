const frisby = require('frisby');
const { MongoClient } = require('mongodb');

const mongoDbUrl = 'mongodb://localhost:27017';
const url = 'http://localhost:3000';

describe('9 - Atualize a quantidade de produtos', () => {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await MongoClient.connect(mongoDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = connection.db('StorageManager');
    await db.collection('products').deleteMany({});
    await db.collection('sales').deleteMany({});
  });

  beforeEach(async () => {
    await db.collection('products').deleteMany({});
    await db.collection('sales').deleteMany({});
    const products = [{ name: 'Martelo de Thor', quantity: 10 },
      { name: 'Trage de encolhimento', quantity: 20 },
      { name: 'Escudo do capitão américa', quantity: 30 }];
    await db.collection('products').insertMany(products);
  });

  afterEach(async () => {
    await db.collection('products').deleteMany({});
    await db.collection('sales').deleteMany({});
  });

  afterAll(async () => {
    await connection.close();
  });

  it('Validar que a quantidade do produto atualize ao fazer uma compra', async () => {
    let result;

    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        result = JSON.parse(body);
        return frisby.post(`${url}/sales/`,
          [
            {
              productId: result.products[0]._id,
              quantity: 2,
            },
          ])
          .expect('status', 200);
      });

    await frisby.get(`${url}/products/${result.products[0]._id}`)
      .expect('status', 201)
      .expect((responseProducts) => {
        const { body } = responseProducts;
        const resultProducts = JSON.parse(body);
        expect(resultProducts.quantity).toBe(8);
      });
  }, 30000);

  it('Validar que a quantidade do produto atualize ao deletar uma compra', async () => {
    let result;
    let resultSales;

    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        result = JSON.parse(body);
        return frisby.post(`${url}/sales/`,
          [
            {
              productId: result.products[0]._id,
              quantity: 2,
            },
          ])
          .expect('status', 200)
          .then((responseSales) => {
            const { body } = responseSales;
            resultSales = JSON.parse(body);
          });
      });

    await frisby.delete(`${url}/sales/${resultSales._id}`).expect('status', 200);

    await frisby.get(`${url}/products/${result.products[0]._id}`)
      .expect('status', 201)
      .expect((responseProducts) => {
        const { body } = responseProducts;
        const resultProducts = JSON.parse(body);
        expect(resultProducts.quantity).toBe(10);
      });
  }, 30000);
});

describe('10 - Valide a quantidade de produtos', () => {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await MongoClient.connect(mongoDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = connection.db('StorageManager');
    await db.collection('products').deleteMany({});
    await db.collection('sales').deleteMany({});
  });

  beforeEach(async () => {
    await db.collection('products').deleteMany({});
    await db.collection('sales').deleteMany({});
    const products = [{ name: 'Martelo de Thor', quantity: 10 },
      { name: 'Trage de encolhimento', quantity: 20 },
      { name: 'Escudo do capitão américa', quantity: 30 }];
    await db.collection('products').insertMany(products);
  });

  afterEach(async () => {
    await db.collection('products').deleteMany({});
    await db.collection('sales').deleteMany({});
  });

  afterAll(async () => {
    await connection.close();
  });

  it('Validar que o estoque do produto nunca fique com a quantidade menor que zero', async () => {
    let result;

    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        result = JSON.parse(body);
        return frisby.post(`${url}/sales/`,
          [
            {
              productId: result.products[0]._id,
              quantity: 100,
            },
          ])
          .expect('status', 404)
          .then((responseSales) => {
            const { json } = responseSales;
            expect(json.err.code).toBe('stock_problem');
            expect(json.err.message).toBe('Such amount is not permitted to sell');
          });
      });
  }, 30000);
});
