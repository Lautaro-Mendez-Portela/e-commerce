const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value) => {
  const date = toDate(value);

  return date ? dateFormatter.format(date) : "Fecha no disponible";
};

export const formatDateTime = (value) => {
  const date = toDate(value);

  return date ? dateTimeFormatter.format(date) : "Fecha no disponible";
};

export const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
};
