const knex = require('knex');
const { createTracker, MockClient } = require('knex-mock-client');
const { attachPaginate } = require('../lib');
attachPaginate();

describe('special cases', () => {
  let db;
  let tracker;
  beforeAll(() => {
    db = knex({
      client: MockClient,
      dialect: 'mysql',
    });

    tracker = createTracker(db);
  });

  afterEach(() => {
    tracker.reset();
  });

  it('should support TOTAL as uppercase', async () => {
    const total = 10;
    tracker.on.select('select count(*) as `total` from').responseOnce({ TOTAL: `${total}` });
    tracker.on.select('select * from `tableName`').responseOnce([]);

    const data = await db('tableName').paginate({ isFromStart: true, perPage: 10 });

    expect(data).toMatchObject({
      pagination: {
        total,
      },
    });
  });

  it('should support TOTAL as uppercase with 0 value', async () => {
    const total = 0;
    tracker.on.select('select count(*) as `total` from').responseOnce({ TOTAL: total });
    tracker.on.select('select * from `tableName`').responseOnce([]);

    const data = await db('tableName').paginate({ isFromStart: true, perPage: 10 });

    expect(data).toMatchObject({
      pagination: {
        total,
      },
    });
  });

  it('should default current page to 1 if lower given', async () => {
    tracker.on.select('select count(*) as `total` from').responseOnce({ total: 0 });
    tracker.on.select('select * from `tableName`').responseOnce([]);

    await db('tableName').paginate({ currentPage: 0, perPage: 10 });

    expect(tracker.history.select).toHaveLength(2); // normalizes currentPage to 1 will make the totals query as well
  });
});
