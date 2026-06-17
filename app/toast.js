'use client'
// Toasts globais via window-event — mesmo padrão do 'timer-change' usado no app.
// Sem provider/prop-drilling: qualquer client component dispara, o <Toaster> escuta.

let seq = 0

function emit(detail) {
  try { window.dispatchEvent(new CustomEvent('toast', { detail })) } catch (e) {}
}

// toast simples (confirmação instantânea). type: 'success' | 'error' | 'info'
export function toast(msg, opts = {}) {
  const id = ++seq
  emit({ id, msg, type: opts.type || 'success', loading: false, duration: opts.duration })
  return id
}

// fluxo "skeleton → sucesso": mostra "Salvando…" enquanto a promise corre
// e, no MESMO toast, troca pra mensagem de sucesso (ou erro) quando resolve.
export async function toastSave(promise, opts = {}) {
  const { loading = 'Salvando…', success = 'Alteração salva com sucesso', error = 'Não consegui salvar' } = opts
  const id = ++seq
  emit({ id, msg: loading, type: 'loading', loading: true, duration: 0 })
  try {
    const r = await promise
    emit({ id, msg: typeof success === 'function' ? success(r) : success, type: 'success', loading: false })
    return r
  } catch (e) {
    emit({ id, msg: typeof error === 'function' ? error(e) : error, type: 'error', loading: false })
    throw e
  }
}
