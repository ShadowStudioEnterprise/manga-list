const ERROR_MESSAGES = Object.freeze({
  'app/firebase-not-configured':
    'Firebase no está configurado. Revisa las variables de entorno de la aplicación.',
  'app/invalid-account': 'No se ha podido identificar la cuenta actual.',
  'app/invalid-manga': 'Los datos de la obra no son válidos.',
  'app/manual-chapter-required':
    'Este capítulo no se puede modificar automáticamente. Edítalo manualmente.',
  'app/reauthentication-required':
    'Por seguridad, vuelve a identificarte antes de eliminar la cuenta.',
  'auth/account-exists-with-different-credential':
    'Ya existe una cuenta con este correo y otro método de acceso.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico.',
  'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
  'auth/invalid-email': 'Introduce un correo electrónico válido.',
  'auth/missing-password': 'Introduce tu contraseña.',
  'auth/network-request-failed':
    'No se ha podido conectar. Comprueba tu conexión e inténtalo de nuevo.',
  'auth/popup-blocked': 'El navegador ha bloqueado la ventana de acceso con Google.',
  'auth/popup-closed-by-user': 'Se ha cerrado la ventana de acceso antes de terminar.',
  'auth/requires-recent-login':
    'Por seguridad, vuelve a iniciar sesión antes de realizar esta acción.',
  'auth/too-many-requests':
    'Se han realizado demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/user-mismatch': 'La cuenta seleccionada no coincide con la sesión actual.',
  'auth/user-not-found': 'No existe una cuenta con estos datos.',
  'auth/weak-password': 'La contraseña es demasiado débil. Utiliza al menos 6 caracteres.',
  'auth/wrong-password': 'La contraseña no es correcta.',
  'auth/web-storage-unsupported':
    'El navegador no permite mantener la sesión. Revisa sus ajustes de privacidad.',
  cancelled: 'La operación se ha cancelado.',
  'failed-precondition': 'No se puede completar esta operación en este momento.',
  'permission-denied': 'No tienes permiso para realizar esta acción.',
  unavailable: 'El servicio no está disponible temporalmente. Inténtalo de nuevo.',
})

const REAUTHENTICATION_CODES = new Set([
  'app/reauthentication-required',
  'auth/requires-recent-login',
])

export class AppError extends Error {
  constructor(code, message, options = {}) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.requiresReauthentication =
      options.requiresReauthentication ?? REAUTHENTICATION_CODES.has(code)

    if (options.cause) {
      this.cause = options.cause
    }
  }
}

export function getErrorCode(error) {
  return typeof error?.code === 'string' ? error.code : ''
}

export function getFirebaseErrorMessage(
  error,
  fallbackMessage = 'Ha ocurrido un error inesperado.',
) {
  if (error instanceof AppError) {
    return error.message
  }

  return ERROR_MESSAGES[getErrorCode(error)] ?? fallbackMessage
}

export function toAppError(error, fallbackMessage) {
  if (error instanceof AppError) {
    return error
  }

  const code = getErrorCode(error) || 'app/unknown'

  return new AppError(code, getFirebaseErrorMessage(error, fallbackMessage), {
    cause: error,
  })
}

export function createAppError(code, fallbackMessage, options = {}) {
  return new AppError(
    code,
    fallbackMessage ?? ERROR_MESSAGES[code] ?? 'Ha ocurrido un error inesperado.',
    options,
  )
}

export function isReauthenticationError(error) {
  return Boolean(error?.requiresReauthentication || REAUTHENTICATION_CODES.has(getErrorCode(error)))
}
