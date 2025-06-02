export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
} 