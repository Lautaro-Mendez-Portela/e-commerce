const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

exports.getPaginationParams = (query = {}) => {
  const page = toPositiveInteger(query.page, DEFAULT_PAGE);
  const requestedLimit = toPositiveInteger(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

exports.buildPaginatedResponse = ({ data, total, page, limit }) => {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};
