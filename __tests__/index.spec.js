const knex = require('knex');
const dotenv = require('dotenv');
const { attachPaginate } = require('../lib/index');

attachPaginate();

if (process.env.CI !== 'true') {
  dotenv.config('../.env');
}

const db = knex({
  client: 'mysql',
  connection: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  }
});


function getById(id) {
  return db('persons').where({ id }).first();
}

describe('paginate', () => {
  beforeAll(async () => {
    await db('persons').truncate();
    await db('persons').insert([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => ({
      id,
      name: `name-${id}`,
      email: `email-${id}`
    })));
  });

  afterAll(() => db.destroy());

  describe('validation', () => {
    ['perPage', 'currentPage'].forEach(param => {
      it(`should throw if ${param} is not a number`, () => {
        expect(() => db('persons').paginate({ [param]: 'x' }))
          .toThrowError(`Paginate error: ${param} must be a number.`);
      });
    });

    ['isFromStart', 'isLengthAware'].forEach(param => {
      it(`should throw if ${param} is not a boolean`, () => {
        expect(() => db('persons').paginate({ [param]: 'x' }))
          .toThrowError(`Paginate error: ${param} must be a boolean.`);
      });
    });
  });

  describe('behaviour', () => {
    it('should paginate the data', async () => {
      const result = await db('persons').paginate({ perPage: 2, currentPage: 2 });
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual(expect.objectContaining({
        currentPage: 2,
        perPage: 2,
        from: 2,
        to: 4
      }));
    });

    it('should paginate the data with correct values', async () => {
      const result = await db('persons').pluck('id').paginate({ perPage: 2, currentPage: 2 });
      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual(expect.arrayContaining([3, 4]));
    });

    describe('totals', () => {
      it('should query totals when length aware', async () => {
        const result = await db('persons').paginate({
          perPage: 2,
          currentPage: 2,
          isLengthAware: true
        });

        expect(result.pagination).toEqual(expect.objectContaining({
          currentPage: 2,
          perPage: 2,
          from: 2,
          to: 4,
          total: 10,
          lastPage: 5
        }));
      });

      it('should query totals when currentPage=1', async () => {
        const result = await db('persons').paginate({
          perPage: 2,
          currentPage: 1,
        });

        expect(result.pagination).toEqual(expect.objectContaining({
          currentPage: 1,
          perPage: 2,
          from: 0,
          to: 2,
          total: 10,
          lastPage: 5
        }));
      });

      it('should query totals when isFromStart=true', async () => {
        const result = await db('persons').paginate({
          perPage: 2,
          currentPage: 2,
          isFromStart: true
        });

        expect(result.data).toHaveLength(4);
        expect(result.pagination).toEqual(expect.objectContaining({
          currentPage: 2,
          perPage: 2,
          from: 0,
          to: 4,
          total: 10,
          lastPage: 5
        }));
      });

      it('should not query totals otherwise', async () => {
        const result = await db('persons').paginate({
          perPage: 2,
          currentPage: 2,
        });

        expect(result.pagination).not.toHaveProperty('total');
      });
    });

    describe('edge cases', () => {
      it('should paginate with the same query', async () => {
        const result = await db('persons').whereBetween('id', [3, 8]).paginate({
          perPage: 2,
          currentPage: 1
        });
        expect(result.data).toHaveLength(2);
        expect(result.pagination).toEqual(expect.objectContaining({
          total: 6
        }));
      });

      it('should paginate with default currentPage of 1', async () => {
        const result = await db('persons').paginate({
          perPage: 2,
        });
        expect(result.data).toHaveLength(2);
        expect(result.pagination).toEqual(expect.objectContaining({
          currentPage: 1
        }));
      });

      it('should count total with offset', async () => {
        const result = await db('persons').offset(2).paginate({
          perPage: 2,
        });
        expect(result.data).toHaveLength(2);
        expect(result.pagination).toEqual(expect.objectContaining({
          total: 10
        }));
      });
    });
  });
});
