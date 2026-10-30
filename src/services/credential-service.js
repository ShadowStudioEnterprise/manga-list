import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  reload,
  updatePassword,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'
import { auth, requireFirebase } from '@/boot/firebase'
import { createAppError, toAppError } from '@/utils/firebase-errors'
import { sparkBudget } from '@/utils/spark-budget'

let busy = false

function assertCurrent(user) {
  if (!user || auth.currentUser !== user) throw createAppError('app/invalid-account')
}

async function confirmedUser(password) {
  const user = auth.currentUser
  assertCurrent(user)
  const providers = user.providerData.map(({ providerId }) => providerId)
  sparkBudget.take('auth')
  if (providers.includes('password')) {
    if (!password) throw createAppError('auth/missing-password')
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
  } else if (providers.includes('google.com')) {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await reauthenticateWithPopup(user, provider)
  } else {
    throw createAppError('auth/requires-recent-login')
  }
  assertCurrent(user)
  return user
}

async function run(operation) {
  requireFirebase()
  if (busy) throw createAppError('app/credential-busy', 'Espera a que termine el cambio actual.')
  busy = true
  try {
    return await operation()
  } catch (error) {
    throw toAppError(sparkBudget.record(error), 'No se ha podido actualizar el acceso a tu cuenta.')
  } finally {
    busy = false
  }
}

function validPassword(value) {
  if (typeof value !== 'string' || value.length < 6) throw createAppError('auth/weak-password')
}

export function changeAccountPassword(currentPassword, newPassword) {
  return run(async () => {
    validPassword(newPassword)
    const user = await confirmedUser(currentPassword)
    if (!user.providerData.some(({ providerId }) => providerId === 'password')) {
      throw createAppError('auth/no-such-provider', 'Añade primero el acceso con contraseña.')
    }
    sparkBudget.take('auth')
    await updatePassword(user, newPassword)
    return user
  })
}

export function requestAccountEmailChange(currentPassword, newEmail) {
  return run(async () => {
    const email = typeof newEmail === 'string' ? newEmail.trim() : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createAppError('auth/invalid-email')
    const user = await confirmedUser(currentPassword)
    if (email.toLowerCase() === user.email?.toLowerCase()) {
      throw createAppError('app/unchanged-email', 'Introduce una dirección de correo diferente.')
    }
    sparkBudget.take('auth')
    await verifyBeforeUpdateEmail(user, email)
    // Sending the email does not change the current address. The hosted action
    // verifies the new address; never update the store optimistically.
    return user
  })
}

export function addPasswordAccess(currentPassword, newPassword) {
  return run(async () => {
    validPassword(newPassword)
    const user = await confirmedUser(currentPassword)
    if (!user.email) throw createAppError('auth/invalid-email')
    sparkBudget.take('auth')
    await linkWithCredential(user, EmailAuthProvider.credential(user.email, newPassword))
    assertCurrent(user)
    return user
  })
}

export function addGoogleAccess(currentPassword) {
  return run(async () => {
    const user = await confirmedUser(currentPassword)
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    sparkBudget.take('auth')
    // Firebase rejects credentials belonging to another UID. Do not sign in,
    // merge libraries or unlink an existing provider to resolve that conflict.
    await linkWithPopup(user, provider)
    assertCurrent(user)
    return user
  })
}

export function refreshAccountIdentity() {
  return run(async () => {
    const user = auth.currentUser
    assertCurrent(user)
    sparkBudget.take('auth')
    await reload(user)
    assertCurrent(user)
    return user
  })
}
