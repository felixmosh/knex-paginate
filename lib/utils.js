function assertNumber(paramName, value) {
  if (isNaN(value)) {
    throw new Error(`Paginate error: ${paramName} must be a number.`);
  }
}

function assertBoolean(paramName, value) {
  if (typeof value !== 'boolean') {
    throw new Error(`Paginate error: ${paramName} must be a boolean.`);
  }
}

module.exports = {
  assertNumber,
  assertBoolean,
};
