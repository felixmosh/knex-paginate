const Knex = require('knex');

module.exports.attachPaginate = function attachPaginate() {
  Knex.QueryBuilder.extend('paginate', function paginate({
    perPage = 10,
    currentPage = 1,
    isFromStart = false,
    isLengthAware = false,
  }) {
    if (isNaN(perPage)) {
      throw new Error('Paginate error: perPage must be a number.');
    }

    if (isNaN(currentPage)) {
      throw new Error('Paginate error: currentPage must be a number.');
    }

    if (typeof isFromStart !== 'boolean') {
      throw new Error('Paginate error: isFromStart must be a boolean.');
    }

    if (typeof isLengthAware !== 'boolean') {
      throw new Error('Paginate error: isLengthAware must be a boolean.');
    }

    const shouldFetchTotals = isLengthAware || currentPage === 1 || isFromStart;
    let pagination = {};

    if (currentPage < 1) {
      currentPage = 1;
    }

    const offset = isFromStart ? 0 : (currentPage - 1) * perPage;
    const limit = isFromStart ? perPage * currentPage : perPage;

    // This will paginate the data itself
    this.offset(offset).limit(limit);

    return this.client.transaction(async trx => {
      const result = await this.transacting(trx);

      if (shouldFetchTotals) {
        const groupStmt = this._statements.find(stmt => stmt.grouping === 'group');

        const countQuery = await this.clone()
          .clearSelect()
          .clearOrder()
          .clearHaving()
          .modify(qb => {
            qb._clearGrouping('group');

            if (groupStmt) {
              qb.count(`${groupStmt.value[0]} as total`, { distinct: true });
            } else {
              qb.count('* as total');
            }
          })
          .offset(0)
          .first()
          .transacting(trx);

        const total = countQuery.total;

        pagination = {
          ...pagination,
          total,
          lastPage: Math.ceil(total / perPage),
        };
      }

      // Add pagination data to paginator object
      pagination = {
        ...pagination,
        perPage,
        currentPage,
        from: offset,
        to: offset + result.length,
      };

      return { data: result, pagination };
    });
  });
};
