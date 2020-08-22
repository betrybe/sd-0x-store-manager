const frisby = require('frisby');
const { MongoClient } = require('mongodb');

const mongoDbUrl = 'mongodb://localhost:27017';
const url = 'http://localhost:3000';

describe('1 - Crie um endpoint para o cadastramento de produtos', () => {
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
    const myobj = { name: 'Martelo de Thor', quantity: 10 };
    await db.collection('products').insertOne(myobj);
  });

  afterEach(async () => {
    await db.collection('products').deleteMany({});
  });

  afterAll(async () => {
    await connection.close();
  });

  it('Validar se não consigo criar um produto com o nome menor que 5 caracteres', async () => {
    await frisby
      .post(`${url}/products/`, {
        name: 'Rai',
        quantity: 100,
      })
      .expect('status', 422)
      .then((res) => {
        let { body } = res;
        body = JSON.parse(body);
        expect(body.err.code).toEqual('invalid_data');
        expect(body.err.message).toEqual('"name" length must be at least 5 characters long');
      });
  });

  it('Validar se não consigo criar um produto com o mesmo nome', async () => {
    await frisby
      .post(`${url}/products/`, {
        name: 'Martelo de Thor',
        quantity: 100,
      })
      .expect('status', 422)
      .then((res) => {
        let { body } = res;
        body = JSON.parse(body);
        expect(body.err.code).toEqual('invalid_data');
        expect(body.err.message).toEqual('Product already exists');
      });
  });

  it('Validar se não consigo criar um produto com quantidade menor que zero', async () => {
    await frisby
      .post(`${url}/products`, {
        name: 'Produto do Batista',
        quantity: -1,
      })
      .expect('status', 422)
      .then((res) => {
        let { body } = res;
        body = JSON.parse(body);
        expect(body.err.code).toEqual('invalid_data');
        expect(body.err.message).toEqual('"quantity" must be larger than or equal to 1');
      });
  });

  it('Validar se não consigo criar um produto com quantidade igual a zero', async () => {
    await frisby
      .post(`${url}/products`, {
        name: 'Produto do Batista',
        quantity: 0,
      })
      .expect('status', 422)
      .then((res) => {
        let { body } = res;
        body = JSON.parse(body);
        expect(body.err.code).toEqual('invalid_data');
        expect(body.err.message).toEqual('"quantity" must be larger than or equal to 1');
      });
  });

  it('Validar se não consigo criar um produto com uma string no campo quantidade', async () => {
    await frisby
      .post(`${url}/products`, {
        name: 'Produto do Batista',
        quantity: 'string',
      })
      .expect('status', 422)
      .then((res) => {
        let { body } = res;
        body = JSON.parse(body);
        expect(body.err.code).toEqual('invalid_data');
        expect(body.err.message).toEqual('"quantity" must be a number');
      });
  });

  it('Validar se consigo criar um produto com sucesso', async () => {
    await frisby
      .post(`${url}/products`, {
        name: 'Arco do Gavião Arqueiro',
        quantity: 1,
      })
      .expect('status', 201)
      .then((res) => {
        let { body } = res;
        body = JSON.parse(body);
        expect(body.name).toEqual('Arco do Gavião Arqueiro');
        expect(body.quantity).toEqual(1);
      });
  });
});

describe('2 - Crie um endpoint para listar os produtos', () => {
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
  });

  afterAll(async () => {
    await connection.close();
  });

  it('Validar se todos produtos estão sendo retornados', async () => {
    await frisby
      .get(`${url}/products`)
      .expect('status', 200)
      .then((res) => {
        let { body } = res;
        body = JSON.parse(body);
        expect(body.products[0].name).toEqual('Martelo de Thor');
        expect(body.products[0].quantity).toEqual(10);
        expect(body.products[1].name).toEqual('Trage de encolhimento');
        expect(body.products[1].quantity).toEqual(20);
        expect(body.products[2].name).toEqual('Escudo do capitão américa');
        expect(body.products[2].quantity).toEqual(30);
      });
  });

  it('Validar se consigo listar um determinado produto', async () => {
    await frisby
      .post(`${url}/products`, {
        name: 'Armadura do Homem de Ferro',
        quantity: 40,
      })
      .expect('status', 201)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.get(`${url}/products/${result._id}`)
          .expect('status', 201)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.name).toEqual('Armadura do Homem de Ferro');
            expect(json.quantity).toEqual(40);
          });
      });
  });
});

describe('3 - Crie um endpoint para atualizar um produto', () => {
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
    const myobj = { name: 'Martelo de Thor', quantity: 10 };
    await db.collection('products').insertOne(myobj);
  });

  afterEach(async () => {
    await db.collection('products').deleteMany({});
  });

  afterAll(async () => {
    await connection.close();
  });

  it('Validar se não consigo atualizar um produto com o nome menor que 5 caracteres', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.put(`${url}/products/${result.products[0]._id}`,
          {
            name: 'Mar',
            quantity: 10,
          })
          .expect('status', 422)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.err.code).toEqual('invalid_data');
            expect(json.err.message).toEqual('"name" length must be at least 5 characters long');
          });
      });
  }, 30000);

  it('Validar se não consigo atualizar um produto com quantidade menor que zero', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.put(`${url}/products/${result.products[0]._id}`,
          {
            name: 'Martelo de Thor',
            quantity: -1,
          })
          .expect('status', 422)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.err.code).toEqual('invalid_data');
            expect(json.err.message).toEqual('"quantity" must be larger than or equal to 1');
          });
      });
  }, 30000);

  it('Validar se não consigo atualizar um produto com quantidade igual a zero', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.put(`${url}/products/${result.products[0]._id}`,
          {
            name: 'Martelo de Thor',
            quantity: 0,
          })
          .expect('status', 422)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.err.code).toEqual('invalid_data');
            expect(json.err.message).toEqual('"quantity" must be larger than or equal to 1');
          });
      });
  }, 30000);

  it('Validar se não consigo atualizar um produto com uma string no campo quantidade', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.put(`${url}/products/${result.products[0]._id}`,
          {
            name: 'Martelo de Thor',
            quantity: 'string',
          })
          .expect('status', 422)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.err.code).toEqual('invalid_data');
            expect(json.err.message).toEqual('"quantity" must be a number');
          });
      });
  }, 30000);

  it('Validar se consigo atualizar um produto com sucesso', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.put(`${url}/products/${result.products[0]._id}`,
          {
            name: 'Machado de Thor',
            quantity: 20,
          })
          .expect('status', 200)
          .then((secondResponse) => {
            const { json } = secondResponse;
            expect(json.name).toEqual('Machado de Thor');
            expect(json.quantity).toEqual(20);
          });
      });
  }, 30000);
});

describe('4 - Crie um endpoint para deletar um produto', () => {
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
    const myobj = { name: 'Martelo de Thor', quantity: 10 };
    await db.collection('products').insertOne(myobj);
  });

  afterEach(async () => {
    await db.collection('products').deleteMany({});
  });

  afterAll(async () => {
    await connection.close();
  });

  it('Validar se consigo deletar um produto com sucesso', async () => {
    await frisby
      .get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        return frisby.delete(`${url}/products/${result.products[0]._id}`)
          .expect('status', 200);
      });
    await frisby.get(`${url}/products/`)
      .expect('status', 200)
      .then((response) => {
        const { body } = response;
        const result = JSON.parse(body);
        expect(result.products.length).toBe(0);
      });
  }, 30000);

  it('Validar se não é possível deletar um produto inexistente', async () => {
    await frisby
      .delete(`${url}/products/99999`)
      .expect('status', 422)
      .then((secondResponse) => {
        const { json } = secondResponse;
        expect(json.err.code).toEqual('invalid_data');
        expect(json.err.message).toEqual('Wrong id format');
      });
  }, 30000);
});

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

  it('Validar e não é possível criar uma compra com sucesso', async () => {
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

  it('Validar se consigo listar uma determinada compra', async () => {
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

  it('Validar se não consigo atualizar compras com quantidade menor que zero', async () => {
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

  it('Validar se não consigo atualizar compras com quantidade igual a zero', async () => {
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

  it('Validar se não consigo atualizar compras com uma string no campo quantidade', async () => {
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

  it('Validar se consigo atualizar uma compra com sucesso', async () => {
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

  it('Validar se consigo deletar um produto com sucesso', async () => {
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

  it('Validar se não consigo deletar um produto inexistente', async () => {
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
