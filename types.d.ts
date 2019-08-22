import { QueryBuilder as KnexQB } from 'knex';

interface IPaginateParams {
  perPage: number,
  currentPage: number,
  isFromStart?: boolean,
  isLengthAware?: boolean,
}

interface IWithPagination<T = any> {
  data: T;
  pagination: IPagination;
}

interface IPagination {
  total?: number;
  lastPage?: number;
  currentPage: number;
  perPage: number;
  from: number;
  to: number;
}

declare module 'knex' {
  interface QueryBuilder {
    paginate<TResult = any[]>(params: IPaginateParams): KnexQB<any, IWithPagination<TResult>>;
  }
}

export function attachPaginate(): void;
