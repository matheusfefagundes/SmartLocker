export class ApiAuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}

export class ErroRegraDeNegocio extends Error {
  constructor(
    public codigo: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ErroRegraDeNegocio";
  }
}
