export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    code: error.code || (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR")
  });
}
