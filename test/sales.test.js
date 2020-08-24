const frisby = require('frisby');
const { MongoClient } = require('mongodb');

const mongoDbUrl = 'mongodb://localhost:27017';
const url = 'http://localhost:3000';

describe('5 - Crie um endpoint para cadastrar vendas', () => {
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

  it('Validar se não é possível cadastrar compras com quantidade menor que zero', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.post(`${url}/sales/`,
          [
            {
              productId: result.products[0]._id,
              quantity: -1,
            },
          ])
          .expect('status', 422)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.err.code).toBe('invalid_data');
            expect(json.err.message).toBe('Wrong product ID or invalid quantity');
          });
      });
  }, 30000);

  it('Validar se não é possível cadastrar compras com quantidade igual a zero', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.post(`${url}/sales/`,
          [
            {
              productId: result.products[0]._id,
              quantity: 0,
            },
          ])
          .expect('status', 422)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.err.code).toBe('invalid_data');
            expect(json.err.message).toBe('Wrong product ID or invalid quantity');
          });
      });
  }, 30000);

  it('Validar se não é possível cadastrar compras com uma string no campo quantidade', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.post(`${url}/sales/`,
          [
            {
              productId: result.products[0]._id,
              quantity: 'String',
            },
          ])
          .expect('status', 422)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.err.code).toBe('invalid_data');
            expect(json.err.message).toBe('Wrong product ID or invalid quantity');
          });
      });
  }, 30000);

  it('Validar se é possível criar uma compra com sucesso', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.post(`${url}/sales/`,
          [
            {
              productId: result.products[0]._id,
              quantity: 2,
            },
          ])
          .expect('status', 200)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.itensSold[0].productId).toBe(result.products[0]._id);
            expect(json.itensSold[0].quantity).toBe(2);
          });
      });
  }, 30000);

  it('Validar se é possível criar várias compras com sucesso', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.post(`${url}/sales/`,
          [
            {
              productId: result.products[0]._id,
              quantity: 2,
            },
            {
              productId: result.products[1]._id,
              quantity: 6,
            },
          ])
          .expect('status', 200)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.itensSold[0].productId).toBe(result.products[0]._id);
            expect(json.itensSold[0].quantity).toBe(2);
            expect(json.itensSold[1].productId).toBe(result.products[1]._id);
            expect(json.itensSold[1].quantity).toBe(6);
          });
      });
  }, 30000);
});

describe('6 - Crie um endpoint para listar as vendas', () => {
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

  it('Validar se todas as vendas estão sendo retornadas', async () => {
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
            {
              productId: result.products[1]._id,
              quantity: 6,
            },
          ])
          .expect('status', 200)
          .then((responseSales) => {
            const { body } = responseSales;
            resultSales = JSON.parse(body);
          });
      });
    await frisby.get(`${url}/sales/`)
      .expect('status', 200)
      .then((responseAll) => {
        const { body } = responseAll;
        const resultSalesAll = JSON.parse(body);
        expect(resultSalesAll.sales[0]._id).toBe(resultSales._id);
        expect(resultSalesAll.sales[0].itensSold[0].productId).toBe(result.products[0]._id);
        expect(resultSalesAll.sales[0].itensSold[0].quantity).toBe(2);
        expect(resultSalesAll.sales[0].itensSold[1].productId).toBe(result.products[1]._id);
        expect(resultSalesAll.sales[0].itensSold[1].quantity).toBe(6);
      });
  }, 30000);

  it('Validar se consigo listar uma determinada venda', async () => {
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
            {
              productId: result.products[1]._id,
              quantity: 6,
            },
          ])
          .expect('status', 200)
          .then((responseSales) => {
            const { body } = responseSales;
            resultSales = JSON.parse(body);
          });
      });

    await frisby.get(`${url}/sales/`)
      .expect('status', 200)
      .then((responseOne) => {
        const { body } = responseOne;
        const responseAll = JSON.parse(body);
        expect(responseAll.sales[0]._id).toBe(resultSales._id);
        expect(responseAll.sales[0].itensSold[0].productId).toBe(result.products[0]._id);
        expect(responseAll.sales[0].itensSold[0].quantity).toBe(2);
        expect(responseAll.sales[0].itensSold[1].productId).toBe(result.products[1]._id);
        expect(responseAll.sales[0].itensSold[1].quantity).toBe(6);
      });
  }, 30000);
});

describe('7 - Crie um endpoint para atualizar uma venda', () => {
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

  it('Validar se não consigo atualizar vendas com quantidade menor que zero', async () => {
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

    await frisby.put(`${url}/sales/${resultSales._id}`,
      [
        {
          productId: result.products[0]._id,
          quantity: -1,
        },
      ])
      .expect('status', 422)
      .then((responseEdit) => {
        const { body } = responseEdit;
        const responseEditBody = JSON.parse(body);
        expect(responseEditBody.err.code).toBe('invalid_data');
        expect(responseEditBody.err.message).toBe('Wrong product ID or invalid quantity');
      });
  }, 30000);

  it('Validar se não consigo atualizar vendas com quantidade igual a zero', async () => {
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

    await frisby.put(`${url}/sales/${resultSales._id}`,
      [
        {
          productId: result.products[0]._id,
          quantity: 0,
        },
      ])
      .expect('status', 422)
      .then((responseEdit) => {
        const { body } = responseEdit;
        const responseEditBody = JSON.parse(body);
        expect(responseEditBody.err.code).toBe('invalid_data');
        expect(responseEditBody.err.message).toBe('Wrong product ID or invalid quantity');
      });
  }, 30000);

  it('Validar se não consigo atualizar vendas com uma string no campo quantidade', async () => {
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

    await frisby.put(`${url}/sales/${resultSales._id}`,
      [
        {
          productId: result.products[0]._id,
          quantity: 'String',
        },
      ])
      .expect('status', 422)
      .then((responseEdit) => {
        const { body } = responseEdit;
        const responseEditBody = JSON.parse(body);
        expect(responseEditBody.err.code).toBe('invalid_data');
        expect(responseEditBody.err.message).toBe('Wrong product ID or invalid quantity');
      });
  }, 30000);

  it('Validar se consigo atualizar uma venda com sucesso', async () => {
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

    await frisby.put(`${url}/sales/${resultSales._id}`,
      [
        {
          productId: result.products[0]._id,
          quantity: 5,
        },
      ])
      .expect('status', 200)
      .then((responseEdit) => {
        const { body } = responseEdit;
        const responseEditBody = JSON.parse(body);
        expect(responseEditBody._id).toBe(resultSales._id);
        expect(responseEditBody.itensSold[0].productId).toBe(resultSales.itensSold[0].productId);
        expect(responseEditBody.itensSold[0].quantity).toBe(5);
      });
  }, 30000);
});

describe('8 - Crie um endpoint para deletar uma venda', () => {
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

  it('Validar se consigo deletar uma venda com sucesso', async () => {
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

    await frisby.delete(`${url}/sales/${resultSales._id}`)
      .expect('status', 200);

    await frisby.get(`${url}/sales/${resultSales._id}`)
      .expect('status', 404)
      .expect((resultGet) => {
        const { body } = resultGet;
        const resultGetBody = JSON.parse(body);
        expect(resultGetBody.err.code).toBe('not_found');
        expect(resultGetBody.err.message).toBe('Sale not found');
      });
  }, 30000);

  it('Validar se não consigo deletar uma venda que não existe', async () => {
    await frisby.delete(`${url}/sales/99990`)
      .expect('status', 422)
      .expect((resultDelete) => {
        const { body } = resultDelete;
        const resultDeleteBody = JSON.parse(body);
        expect(resultDeleteBody.err.code).toBe('invalid_data');
        expect(resultDeleteBody.err.message).toBe('Wrong sale ID format');
      });
  }, 30000);
});

