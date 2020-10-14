export const isInteger = value =>
  typeof value === 'number' && isFinite(value) && Math.floor(value) === value
