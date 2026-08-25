export class ApiClientError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function apiFetch<T>(
  caminho: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(caminho, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const corpoErro = await response.json().catch(() => null);
    throw new ApiClientError(
      corpoErro?.error ?? "Erro ao comunicar com o servidor",
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
