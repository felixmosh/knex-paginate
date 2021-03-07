import { knex } from 'knex';
import { expectType } from 'tsd';
import '../types';
import { ILengthAwarePagination, IBasePagination, IWithPagination } from '../types';

const db = knex({});

interface User {
  id: number;
  name: string;
  email: string;
}

(async () => {
  expectType<IWithPagination<User[]>>(
    await db('users').select('*').paginate<User[]>({
      perPage: 10,
      currentPage: 1,
      isFromStart: true,
      isLengthAware: false,
    })
  );

  expectType<ILengthAwarePagination>(
    (
      await db('users').select('*').paginate({
        perPage: 10,
        currentPage: 1,
      })
    ).pagination
  );

  expectType<ILengthAwarePagination>(
    (
      await db('users').select('*').paginate({
        perPage: 10,
        currentPage: 2,
        isFromStart: true,
      })
    ).pagination
  );

  expectType<ILengthAwarePagination>(
    (
      await db('users').select('*').paginate({
        perPage: 10,
        currentPage: 2,
        isFromStart: false,
        isLengthAware: true,
      })
    ).pagination
  );

  expectType<IBasePagination>(
    (
      await db('users').select('*').paginate({
        perPage: 10,
        currentPage: 2,
      })
    ).pagination
  );
})();
