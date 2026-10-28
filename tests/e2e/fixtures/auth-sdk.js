// Test-only module transformed by the local Vite dev server. Never part of a
// release entry point. The calling tests enforce loopback demo-emulator traffic.
export { auth } from '../../../src/boot/firebase.js'
export {
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithCredential,
  signInWithCredential,
} from 'firebase/auth'
