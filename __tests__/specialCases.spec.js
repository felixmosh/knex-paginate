const knex = require('knex');
const { getTracker, MockClient } = require('knex-mock-client');
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

    tracker = getTracker();
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
});
