class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

class ValidationError extends AppError {
  constructor(fields) {
    super("validation failed", "VALIDATION_FAILED");
    this.fields = fields;
  }
}

class UnauthenticatedError extends AppError {
  constructor() {
    super("unauthenticated", "UNAUTHENTICATED");
  }
}

class ForbiddenError extends AppError {
  constructor() {
    super("forbidden", "FORBIDDEN");
  }
}

class NotFoundError extends AppError {
  constructor() {
    super("not found", "NOT_FOUND");
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
};

