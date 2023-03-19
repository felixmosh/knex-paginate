import { Knex } from 'knex';

interface IPaginateParams {
  perPage: number;
  currentPage: number;
  isFromStart?: boolean;
  isLengthAware?: boolean;
}

interface IWithPagination<Data, TParams = IPaginateParams> {
  data: Data[];
  pagination: IPagination<TParams>;
}

type IPagination<TParams> = TParams extends
  | { currentPage: 1 }
  | { isFromStart: true }
  | { isLengthAware: true }
  ? ILengthAwarePagination
  : IBasePagination;

interface IBasePagination {
  currentPage: number;
  perPage: number;
  from: number;
  to: number;
}

interface ILengthAwarePagination extends IBasePagination {
  total: number;
  lastPage: number;
  prevPage: number;
  nextPage: number;
}

declare module 'knex' {
  namespace Knex {
    interface QueryBuilder<TRecord extends {} = any, TResult = any> {
      paginate<TParams extends IPaginateParams = IPaginateParams>(
        params: Readonly<TParams>
      ): Knex.QueryBuilder<TRecord, IWithPagination<TRecord, TParams>>;
    }
  }
}

export function attachPaginate(): void;
