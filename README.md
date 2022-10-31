# Knex-paginate

[![npm](https://img.shields.io/npm/v/knex-paginate.svg)](https://www.npmjs.com/package/knex-paginate)
[![CI](https://github.com/felixmosh/knex-paginate/actions/workflows/ci.yml/badge.svg)](https://github.com/felixmosh/knex-paginate/actions/workflows/ci.yml)

Extension of Knex's query builder with `paginate` method that will help with your pagination tasks.

## How to set up

To use this lib, first you will have to install it:

```
npm i knex-paginate --save
// or
yarn add knex-paginate
```

Then, add the following lines to your Knex set up:

```javascript
const knex = require('knex')(config);

const { attachPaginate } = require('knex-paginate');
attachPaginate();
```

## Function definition

```typescript
.paginate(params: IPaginateParams): Knex.QueryBuilder<any, IWithPagination<TResult>>;

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
```

## How to use

### Example
```javascript
const result = await knex('persons')
   .paginate({ perPage: 10, currentPage: 2 });
// result.data - will hold persons data
// result.pagination - will hold pagination object
```

## `pagination` object
| Key | Value |
| --- | --- |
| perPage  | Items per page. |
| currentPage | Current page number. |
| from | Counting ID of the first item of the current page. |
| to | Counting ID of the last item of the current page. |

**Returned if `isLengthAware == true` or `currentPage == 1` or `isFromStart == true`:**

| Key | Value |
| --- | --- |
| total | Total items that the full query contains. |
| lastPage | Last page number. |


This lib got inspiration from [`knex-paginator`](https://github.com/cannblw/knex-paginator).
