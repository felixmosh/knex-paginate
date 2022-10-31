const knex = require('knex');
const { attachPaginate } = require('../lib/index');
const { snakecase } = require('stringcase');

attachPaginate();

if (process.env.CI !== 'true') {
  const dotenv = require('dotenv');
  dotenv.config('../.env');
}

function isPagination({ perPage, currentPage, to }) {
  return perPage && currentPage && to;
}

function fakeOracleColumnNameMapping(obj) {
  if (!obj || ['boolean', 'number', 'string'].includes(typeof obj)) {
    return obj;
  }

  return Object.entries(obj).reduce((result, [key, value]) => {
    result[key === 'total' && !isPagination(obj) ? key.toUpperCase() : snakecase(key)] = value;
    return result;
  }, {});
}

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
  postProcessResponse: (result) =>
    Array.isArray(result)
      ? result.map((row) => fakeOracleColumnNameMapping(row))
      : fakeOracleColumnNameMapping(result),
});

async function regenerateTableDataWith(ids) {
  await db('persons').truncate();
  await db('person_details').truncate();

  await db('persons').insert(
    ids.map((id, i) => ({
      id,
      name: `name-${id}`,
      email: `email-${id}`,
      signup_date: new Date(1986, 3 + i, 26, 2, 20),
    }))
  );

  await db('person_details').insert(
    ids.reduce(
      (result, id) =>
        result.concat(
          id % 2 === 0
            ? [
                {
                  person_id: id,
                  city_id: 1,
                },
                {
                  person_id: id,
                  city_id: 2,
                },
              ]
            : []
        ),
      []
    )
  );
}

describe('paginate', () => {
  let total;

  beforeAll(async () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    total = ids.length;

    await regenerateTableDataWith(ids);
  });

  afterAll(() => db.destroy());

  describe('validation', () => {
    ['perPage', 'currentPage'].forEach((param) => {
      it(`should throw if ${param} is not a number`, () => {
        expect(() => db('persons').paginate({ [param]: 'x' })).toThrowError(
          `Paginate error: ${param} must be a number.`
        );
      });
    });

    ['isFromStart', 'isLengthAware'].forEach((param) => {
      it(`should throw if ${param} is not a boolean`, () => {
        expect(() => db('persons').paginate({ [param]: 'x' })).toThrowError(
          `Paginate error: ${param} must be a boolean.`
        );
      });
    });
  });

  describe('behaviour', () => {
    it('should paginate the data', async () => {
      const perPage = 2;
      const currentPage = 2;

      const result = await db('persons').paginate({ perPage, currentPage });

      expect(result.data).toHaveLength(perPage);
      expect(result.pagination).toMatchObject({
        current_page: currentPage,
        per_page: perPage,
        from: 2,
        to: 4,
      });
    });

    it('should paginate the data with correct values', async () => {
      const result = await db('persons').pluck('id').paginate({ perPage: 2, currentPage: 2 });

      expect(result.data).toEqual([3, 4]);
    });

    it('should apply postProcessResponse on pagination return object', async () => {
      const perPage = 2;
      const currentPage = 2;
      const result = await db('persons').paginate({ perPage, currentPage, isFromStart: true });

      expect(result.pagination).toMatchObject({
        current_page: currentPage,
        from: 0,
        per_page: perPage,
        to: 4,
        last_page: 5,
      });
    });

    describe('totals', () => {
      it('should query totals when length aware', async () => {
        const result = await db('persons').paginate({
          perPage: 2,
          currentPage: 2,
          isLengthAware: true,
        });

        expect(result.pagination).toMatchObject({
          current_page: 2,
          per_page: 2,
          from: 2,
          to: 4,
          total,
          last_page: 5,
        });
      });

      it('should query totals when currentPage=1', async () => {
        const result = await db('persons').paginate({
          perPage: 2,
          currentPage: 1,
        });

        expect(result.pagination).toMatchObject({
          current_page: 1,
          per_page: 2,
          from: 0,
          to: 2,
          total,
          last_page: 5,
        });
      });

      it('should query totals when isFromStart=true', async () => {
        const result = await db('persons').paginate({
          perPage: 2,
          currentPage: 2,
          isFromStart: true,
        });

        expect(result.data).toHaveLength(4);
        expect(result.pagination).toMatchObject({
          current_page: 2,
          per_page: 2,
          from: 0,
          to: 4,
          total,
          last_page: 5,
        });
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
          currentPage: 1,
        });

        expect(result.data).toHaveLength(2);
        expect(result.pagination).toMatchObject({
          total: 6,
        });
      });

      it('should paginate with default currentPage of 1', async () => {
        const result = await db('persons').paginate({
          perPage: 2,
        });

        expect(result.data).toHaveLength(2);
        expect(result.pagination).toMatchObject({
          current_page: 1,
        });
      });

      it('should count total with offset', async () => {
        const result = await db('persons').offset(2).paginate({
          perPage: 2,
        });
        expect(result.data).toHaveLength(2);
        expect(result.pagination).toMatchObject({
          total,
        });
      });

      it('should clear order on the count query (fixes #7)', async () => {
        const originalConsoleLog = console.log;
        console.log = jest.fn();
        await db('persons').orderBy('persons.id').debug(true).paginate({
          perPage: 2,
        });
        const logStr = console.log.mock.calls[1][0]
          .split('\n')
          .filter((line) => line.trim().startsWith('sql:'))
          .pop();
        console.log = originalConsoleLog;

        expect(logStr).not.toContain('order by');
      });

      describe('grouping', () => {
        it('should count total as distinct column when group is provided', async () => {
          const result = await db('persons')
            .column('persons.id')
            .leftJoin('person_details', 'persons.id', 'person_details.person_id')
            .where('persons.id', 2)
            .groupBy('persons.id')
            .paginate({
              perPage: 2,
            });

          expect(result.pagination.total).toEqual(1);
        });

        it('should count total when group has raw statement', async () => {
          const result = await db('persons')
            .column(db.raw('Year(signup_date)'))
            .groupBy(db.raw('Year(signup_date)'))
            .paginate({
              perPage: 2,
            });

          expect(result.pagination.total).toEqual(2);
        });
      });
    });
  });
});
