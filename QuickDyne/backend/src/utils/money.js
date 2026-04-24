export function assertPaise(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    const error = new Error(`${fieldName} must be a non-negative integer paise amount.`);
    error.statusCode = 400;
    throw error;
  }
}
