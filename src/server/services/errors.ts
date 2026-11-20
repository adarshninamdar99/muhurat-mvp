/** An error whose message is safe and useful to show the user. */
export class UserError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export class NotFoundError extends UserError {
  constructor(what: string) {
    super(`${what} not found`, 404);
  }
}
