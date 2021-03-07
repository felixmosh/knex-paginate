import { Knex } from 'knex';

interface IPaginateParams {
  perPage: number;
  currentPage: number;
  isFromStart?: boolean;
  isLengthAware?: boolean;
}

interface IWithPagination<Data, TParams = IPaginateParams> {
  data: Data;
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
}

declare module 'knex' {
  namespace Knex {
    interface QueryBuilder {
      paginate<TData = any[], TParams extends IPaginateParams = IPaginateParams>(
        params: Readonly<TParams>
      ): Knex.QueryBuilder<any, IWithPagination<TData, TParams>>;
    }
  }
}

export function attachPaginate(): void;
