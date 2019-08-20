class DomainError extends Error {
  constructor(message) {
    super(message);
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    // This clips the constructor invocation from the stack trace.
    // It's not absolutely essential, but it does make the stack trace a little nicer.
    //  @see Node.js reference (bottom)
    Error.captureStackTrace(this, this.constructor);
  }
}

class DataJsonValidationError extends DomainError {
  constructor(message, data, status) {
    super(message);
    this.data = { status_code: status, message, error: data };
  }
}


class HashGenerationError extends DomainError {
  constructor(message, status) {
    super(message);
    this.data = { status_code: status, message };
  }
}


class ResourceNotFoundError extends DomainError {
  constructor(resource, query) {
    super(`Resource ${resource} was not found.`);
    this.data = { resource, query };
  }
}

class InternalError extends DomainError {
  constructor(error, status) {
    super(error.message);
    this.data = { status_code: status, message: error.message };
  }
}

module.exports = {
  ResourceNotFoundError,
  InternalError,
  DataJsonValidationError,
  HashGenerationError
};