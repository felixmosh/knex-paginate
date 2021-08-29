import { knex } from 'knex';
import { expectType, expectAssignable } from 'tsd';
import '../types';
import { ILengthAwarePagination, IBasePagination, IWithPagination } from '../types';

const db = knex({});

interface User {
  id: number;
  name: string;
  email: string;
}

(async () => {
  expectAssignable<IWithPagination<User[]>>(
    await db<User[]>('users').column('*').paginate({
      perPage: 10,
      currentPage: 1,
      isFromStart: true,
      isLengthAware: false,
    })
  );

  expectAssignable<IWithPagination<User[]>>(
    await db('users').select<User[]>('*').paginate({
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

  expectType<ILengthAwarePagination>(
    (
      await db<User[]>('users').select('*').paginate({
        perPage: 10,
        currentPage: 1,
        isLengthAware: true,
      })
    ).pagination
  );

  expectType<User[]>(
    (
      await db<User[]>('users').select('*').paginate({
        perPage: 10,
        currentPage: 1,
        isLengthAware: true,
      })
    ).data
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
