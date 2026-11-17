const PREFIXO_CHAVE = "smartlocker:pin:";

export const PREFIXO_ARMAZENAMENTO_SMARTLOCKER = "smartlocker:";

export interface PinLocal {
  pin: string;
  pinExpiraEm: string | null;
}

export function salvarPinLocal(usoId: string, dados: PinLocal) {
  try {
    window.localStorage.setItem(PREFIXO_CHAVE + usoId, JSON.stringify(dados));
  } catch {
    return;
  }
}

export function lerPinLocal(usoId: string): PinLocal | null {
  try {
    const salvo = window.localStorage.getItem(PREFIXO_CHAVE + usoId);
    if (!salvo) return null;
    const dados = JSON.parse(salvo) as PinLocal;
    if (dados.pinExpiraEm && new Date(dados.pinExpiraEm).getTime() < Date.now()) {
      window.localStorage.removeItem(PREFIXO_CHAVE + usoId);
      return null;
    }
    return dados;
  } catch {
    return null;
  }
}

export function limparDadosLocaisSmartLocker() {
  try {
    Object.keys(window.localStorage)
      .filter((chave) => chave.startsWith(PREFIXO_ARMAZENAMENTO_SMARTLOCKER))
      .forEach((chave) => window.localStorage.removeItem(chave));
  } catch {
    return;
  }
}
