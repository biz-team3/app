export function createPageResponse({ content = [], page = 0, size = content.length, total = content.length } = {}) {
  const pageRequest = { page, size };
  const adjustedTotal =
    content.length > 0 && page * size + size > total
      ? page * size + content.length
      : total;
  const totalPages = size === 0 ? 1 : Math.ceil(adjustedTotal / size);

  return {
    content,
    pageRequest,
    total: adjustedTotal,
    hasNext: page + 1 < totalPages,
    totalPages,
  };
}

export function createPageResponseFromItems(items = [], { page = 0, size = items.length, mapItem = (item) => item } = {}) {
  const start = page * size;
  const content = items.slice(start, start + size).map(mapItem);
  return createPageResponse({ content, page, size, total: items.length });
}
