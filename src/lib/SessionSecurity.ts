/**
 * SessionSecurity.ts
 * Sistema de segurança para autenticação persistente bound ao dispositivo,
 * com assinaturas personalizadas, expiração e prevenção de sequestro de sessão.
 */

// Expiração padrão configurável da sessão (7 dias em minutos)
export const SESSION_EXPIRATION_DEFAULT_MINUTES = 7 * 24 * 60;

/**
 * Obtém ou gera um Fingerprint único para o dispositivo/navegador atual.
 * Baseia-se em um UUID randômico exclusivo do local storage, juntamente com características
 * físicas do browser (User Agent, Resolução de Tela, Idioma) para prevenir roubo de sessão.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server';

  let devId = localStorage.getItem('clinic_device_id');
  if (!devId) {
    // Gera um identificador randômico seguro para o dispositivo
    devId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('clinic_device_id', devId);
  }

  // Coleta dados físicos exclusivos da sessão do navegador
  const browserCharacteristics = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    navigator.language || 'pt-BR'
  ].join('|');

  // Algoritmo DJB2 simplificado para gerar um hash do browser
  let hash = 5381;
  for (let i = 0; i < browserCharacteristics.length; i++) {
    hash = ((hash << 5) + hash) + browserCharacteristics.charCodeAt(i);
  }

  return `${devId}_hash_${Math.abs(hash).toString(36)}`;
}

/**
 * Cria um token assinado e ofuscado contendo as credenciais de sessão (sem senha).
 */
export function createSecureToken(
  userId: string,
  role: string,
  userDetails: any,
  expirationMinutes: number = SESSION_EXPIRATION_DEFAULT_MINUTES
): string {
  const fingerprint = getDeviceFingerprint();
  const expiresAt = Date.now() + (expirationMinutes * 60 * 1000);

  // SANITIZAÇÃO CRÍTICA: senhas nunca são salvas no token ou em texto puro no navegador
  const safeUser = { ...userDetails };
  if (safeUser) {
    delete safeUser.password;
  }

  const payload = {
    userId,
    role,
    user: safeUser,
    fingerprint,
    expiresAt,
    createdAt: Date.now()
  };

  const payloadStr = JSON.stringify(payload);

  // Assinatura simples anti-tamper
  const secret = "LifePlenaSecureTokenSecretKey2026";
  const signStr = payloadStr + secret + fingerprint;
  
  let signature = 5381;
  for (let i = 0; i < signStr.length; i++) {
    signature = ((signature << 5) + signature) + signStr.charCodeAt(i);
  }

  const tokenContainer = {
    payload: btoa(unescape(encodeURIComponent(payloadStr))),
    sig: signature.toString(36)
  };

  return btoa(JSON.stringify(tokenContainer));
}

/**
 * Valida a integridade, expiração e correspondência de dispositivo do token.
 */
export function verifySecureToken(token: string | null): {
  success: boolean;
  role?: 'admin' | 'doctor' | 'attendant' | 'patient';
  user?: any;
  error?: string;
} {
  if (!token) {
    return { success: false, error: 'Token inexistente.' };
  }

  try {
    const rawContainer = atob(token);
    const container = JSON.parse(rawContainer);
    
    if (!container.payload || !container.sig) {
      return { success: false, error: 'Formato de token corrompido.' };
    }

    const payloadStr = decodeURIComponent(escape(atob(container.payload)));
    const payload = JSON.parse(payloadStr);

    const currentFingerprint = getDeviceFingerprint();

    // Re-calcula a assinatura para checar a integridade (impedir adulterações)
    const secret = "LifePlenaSecureTokenSecretKey2026";
    const signStr = payloadStr + secret + payload.fingerprint;
    
    let expectedSignature = 5381;
    for (let i = 0; i < signStr.length; i++) {
      expectedSignature = ((expectedSignature << 5) + expectedSignature) + signStr.charCodeAt(i);
    }

    if (container.sig !== expectedSignature.toString(36)) {
      return { success: false, error: 'Assinatura inválida. O token foi adulterado.' };
    }

    // Proteção rigorosa contra sequestro e roubo de sessão (mismatch de fingerprint de dispositivo)
    if (payload.fingerprint !== currentFingerprint) {
      return { success: false, error: 'Esta sessão pertence a outro dispositivo ou navegador de origem. Acesso negado por motivos de segurança.' };
    }

    // Validação de expiração temporal configurada
    if (Date.now() > payload.expiresAt) {
      return { success: false, error: 'Sessão expirada temporalmente.' };
    }

    return {
      success: true,
      role: payload.role,
      user: payload.user
    };
  } catch (err) {
    return { success: false, error: 'Token em formato inválido ou corrompido de decodificação.' };
  }
}
