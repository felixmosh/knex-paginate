const Knex = require('knex');
const { assertNumber, assertBoolean } = require('./utils');

module.exports.attachPaginate = function attachPaginate() {
  function paginate({
    perPage = 10,
    currentPage = 1,
    isFromStart = false,
    isLengthAware = false,
    disabled = false,
  }) {
    assertNumber('perPage', perPage);
    assertNumber('currentPage', currentPage);
    assertBoolean('isFromStart', isFromStart);
    assertBoolean('isLengthAware', isLengthAware);
    assertBoolean('disabled', disabled);

    if (currentPage < 1) {
      currentPage = 1;
    }

    const shouldFetchTotals = isLengthAware || currentPage === 1 || isFromStart;

    const offset = isFromStart ? 0 : (currentPage - 1) * perPage;
    const limit = isFromStart ? perPage * currentPage : perPage;

    let pagination = {
      perPage,
      currentPage: disabled ? 1 : currentPage,
      from: disabled ? 0 : offset,
      to: undefined, // will be assigned when we fetch the data
    };

    const postProcessResponse =
      typeof this.client.config.postProcessResponse === 'function'
        ? this.client.config.postProcessResponse
        : (key) => key;

    const originalQuery = shouldFetchTotals ? this.clone() : null;

    if (!disabled) {
      // This will paginate the data itself
      this.offset(offset).limit(limit);
    }

    return this.client.transaction(async (trx) => {
      const data = await this.transacting(trx);
      pagination.to = offset + data.length;

      if (shouldFetchTotals && !disabled) {
        const countResult = await new this.constructor(this.client)
          .count('* as total')
          .from(originalQuery.clear('offset').clearOrder().as('count__query__'))
          .first()
          .transacting(trx)
          .debug(this._debug);

        const total = +(countResult.TOTAL || countResult.total || 0);
        const lastPage = Math.ceil(total / perPage);
        pagination = {
          ...pagination,
          total,
          lastPage,
          prevPage: currentPage > 1 ? currentPage - 1 : null,
          nextPage: currentPage < lastPage ? currentPage + 1 : null,
        };
      } else if (disabled) {
        pagination.perPage = pagination.to = data.length;
      }

      return { data, pagination: postProcessResponse(pagination) };
    });
  }

  Knex.QueryBuilder.extend('paginate', paginate);
};
