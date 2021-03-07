import '../types';
import { knex } from 'knex';

const db = knex({});
db('table').select('*').paginate({
  perPage: 10,
  currentPage: 0,
  isFromStart: true,
  isLengthAware: false,
});
