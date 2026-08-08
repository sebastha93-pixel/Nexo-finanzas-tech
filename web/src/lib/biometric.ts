import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

// Thin wrapper around native biometric identity verification (Face ID / Touch ID
// / fingerprint). No-op on web so the same code runs everywhere.

export async function biometricAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const info = await BiometricAuth.checkBiometry();
    return info.isAvailable;
  } catch {
    return false;
  }
}

/** Prompt the OS biometric check. Resolves true on success, false on cancel/fail. */
export async function biometricUnlock(reason = 'Desbloquea ORIA'): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Usar contraseña',
      allowDeviceCredential: false,
      androidTitle: 'Desbloquear ORIA',
      androidSubtitle: 'Verifica tu identidad',
      androidConfirmationRequired: false,
    });
    return true;
  } catch {
    // User cancelled or verification failed — fall back to password.
    return false;
  }
}
