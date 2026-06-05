/**
 * DraftManager.ts
 * Sistema inteligente para persistência automática de rascunhos de input (autosave),
 * excluindo campos de senha, integrado perfeitamente ao estado reativo do React.
 */

const DRAFT_PREFIX = 'lifeplena_draft_';

/**
 * Retorna uma chave única de armazenamento para o elemento de entrada,
 * prevenindo colisões combinando o caminho URL atual, ID do form (se houver) e o identificador do elemento.
 */
function getStorageKey(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string | null {
  // Ignora explicitamente campos de senha por segurança
  if (el.type === 'password' || el.getAttribute('type') === 'password') {
    return null;
  }

  // Ignora botões, submetedores e arquivos
  if (el.type === 'button' || el.type === 'submit' || el.type === 'file' || el.type === 'reset') {
    return null;
  }

  const fieldId = el.id || el.name;
  if (!fieldId) {
    return null;
  }

  // Identifica o form container pai para isolamento de contexto
  const form = el.closest('form');
  const formId = form ? (form.id || form.getAttribute('name') || 'form') : 'no_form';

  // Usa rota corrente para escopar o rascunho (evita misturar dados de diferentes telas)
  const path = window.location.pathname + (window.location.hash || '');

  return `${DRAFT_PREFIX}${path}::${formId}::${fieldId}`;
}

/**
 * Restaura o valor de um único elemento a partir do localStorage
 * garantindo compatibilidade com o ciclo de atualização de estado do React.
 */
function restoreElementValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  const key = getStorageKey(el);
  if (!key) return false;

  const savedValue = localStorage.getItem(key);
  if (savedValue === null) return false;

  // Evita re-restaurar valores que já foram ajustados e estão correspondentes
  if (el.value === savedValue) {
    el.dataset.draftRestored = 'true';
    return false;
  }

  // Se já foi restaurado nesta sessão de render, pulamos para evitar sobrepor digitação ativa
  if (el.dataset.draftRestored === 'true' && el.value !== '') {
    return false;
  }

  try {
    el.dataset.draftRestored = 'true';

    // Obtém o descritor de propriedade nativo do protótipo correspondente do browser,
    // essencial para que o React e outros frameworks fiquem sabendo sobre a alteração do input
    let setter: ((v: any) => void) | undefined;

    if (el instanceof HTMLInputElement) {
      setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    } else if (el instanceof HTMLTextAreaElement) {
      setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    } else if (el instanceof HTMLSelectElement) {
      setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
    }

    if (setter) {
      // Altera o valor diretamente burlará a blindagem interna do React
      setter.call(el, savedValue);
      
      // Despacha o evento adequado para forçar o React a sincronizar seus hooks de state
      const eventType = el instanceof HTMLSelectElement ? 'change' : 'input';
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      el.dispatchEvent(event);
    } else {
      // Fallback clássico se o browser não expuser o setter nativo
      el.value = savedValue;
    }
    
    return true;
  } catch (err) {
    console.error('[DraftManager] Erro ao restaurar campo:', el.id || el.name, err);
    return false;
  }
}

/**
 * Inicializa o gerenciador global de rascunhos.
 * Rastreia digitações em tempo real e inspeciona o DOM continuamente para restaurar novos inputs.
 */
export function initDraftManager(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Função para salvar o rascunho de um campo ao receber digitação
  const handleInputEvent = (e: Event) => {
    const target = e.target as any;
    if (
      target &&
      (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement)
    ) {
      const key = getStorageKey(target);
      if (key) {
        // Remove a marcação de restaurado pois está sob edição ativa do usuário
        delete target.dataset.draftRestored;
        localStorage.setItem(key, target.value);
      }
    }
  };

  // Função auxiliar para escanear e restaurar todos os campos visíveis no momento
  const scanAndRestore = () => {
    const elements = document.querySelectorAll('input, textarea, select');
    elements.forEach((el: any) => {
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        restoreElementValue(el);
      }
    });
  };

  // 1. Escuta eventos globais de alteração e entrada de dados nos campos usando Event Delegation
  window.addEventListener('input', handleInputEvent, true);
  window.addEventListener('change', handleInputEvent, true);

  // 2. Limpeza sob submissão do formulário:
  // Se o formulário é submetido, os rascunhos associados àquele formulário específico devem ser excluídos
  const handleSubmitEvent = (e: Event) => {
    const form = e.target as HTMLFormElement;
    if (form) {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach((el: any) => {
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          const key = getStorageKey(el);
          if (key) {
            localStorage.removeItem(key);
          }
        }
      });
    }
  };
  window.addEventListener('submit', handleSubmitEvent, true);

  // 3. Executa escaneamento inicial ao carregar a página
  setTimeout(scanAndRestore, 100);
  setTimeout(scanAndRestore, 500);

  // 4. Configura MutationObserver para responder imediatamente à montagem de novas views, modais e abas dinâmicas
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      scanAndRestore();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 5. Configura timer periódico de segurança de baixa frequência
  const intervalId = setInterval(scanAndRestore, 1500);

  // Retorna função de limpeza coletora de listeners
  return () => {
    window.removeEventListener('input', handleInputEvent, true);
    window.removeEventListener('change', handleInputEvent, true);
    window.removeEventListener('submit', handleSubmitEvent, true);
    observer.disconnect();
    clearInterval(intervalId);
  };
}

/**
 * Remove todos os rascunhos temporários salvos na máquina do usuário.
 * Chamado principalmente sob o fluxo de logout.
 */
export function clearAllDrafts(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(DRAFT_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
}
