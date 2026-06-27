export function createValidationError(message, code = "VALIDATION_ERROR") {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = code;
  return error;
}

export function requireText(value, fieldName, options = {}) {
  const minLength = options.minLength ?? 1;
  const maxLength = options.maxLength ?? 255;

  if (typeof value !== "string") {
    throw createValidationError(`${fieldName} is required.`);
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    throw createValidationError(`${fieldName} is required.`);
  }

  if (trimmed.length > maxLength) {
    throw createValidationError(`${fieldName} must be ${maxLength} characters or less.`);
  }

  return trimmed;
}

export function optionalText(value, fieldName, options = {}) {
  const maxLength = options.maxLength ?? 255;

  if (typeof value === "undefined" || value === null) {
    return options.defaultValue ?? "";
  }

  if (typeof value !== "string") {
    throw createValidationError(`${fieldName} must be text.`);
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    throw createValidationError(`${fieldName} must be ${maxLength} characters or less.`);
  }

  return trimmed;
}

export function optionalBoolean(value, fieldName, defaultValue = false) {
  if (typeof value === "undefined" || value === null) {
    return defaultValue;
  }

  if (typeof value !== "boolean") {
    throw createValidationError(`${fieldName} must be true or false.`);
  }

  return value;
}

export function optionalInteger(value, fieldName, options = {}) {
  if (typeof value === "undefined" || value === null || value === "") {
    return options.defaultValue ?? null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw createValidationError(`${fieldName} must be an integer.`);
  }

  if (typeof options.min === "number" && parsed < options.min) {
    throw createValidationError(`${fieldName} must be at least ${options.min}.`);
  }

  if (typeof options.max === "number" && parsed > options.max) {
    throw createValidationError(`${fieldName} must be at most ${options.max}.`);
  }

  return parsed;
}

// Validates a value against a fixed structural pattern (e.g. Aadhaar's 12
// digits, PAN's 5-letter/4-digit/1-letter format) — closes the gap where
// requireText alone only checked length, not actual shape.
export function requirePattern(value, fieldName, pattern, hint) {
  const trimmed = requireText(value, fieldName, { maxLength: 64 });

  if (!pattern.test(trimmed)) {
    throw createValidationError(`${fieldName} ${hint || "is not in a valid format"}.`);
  }

  return trimmed;
}