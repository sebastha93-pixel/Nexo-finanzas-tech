# ORIA — App nativa (iOS + Android) con Capacitor

ORIA se empaqueta para las tiendas con **Capacitor**, que envuelve la PWA de
`web/` en apps nativas reutilizando el 100% del código. Un solo código, dos
tiendas.

- **App ID:** `com.nexofinanzas.app`
- **App name:** ORIA
- **webDir:** `web/dist`
- Config: `web/capacitor.config.ts`

## Requisitos por plataforma
- **Android:** Android Studio + JDK 17. Se puede compilar en Windows/Mac/Linux.
- **iOS:** **Mac** con Xcode + CocoaPods (`sudo gem install cocoapods`). Obligatorio
  para compilar/subir a la App Store (no se puede desde Windows/Linux).

## Primer setup (una sola vez)
```bash
cd web
npm install
# Genera los proyectos nativos (crea las carpetas web/android y web/ios)
npx cap add android
npx cap add ios      # solo en Mac
```
> Decide si versionas `web/android` y `web/ios` en git (reproducible) o los
> ignoras y cada quien corre `cap add`. Para un equipo pequeño, versionarlos es
> lo más simple.

## Ciclo de build (cada cambio)
```bash
cd web
npm run cap:android   # build web + sync + abre Android Studio
npm run cap:ios       # build web + sync + abre Xcode (Mac)
# o solo sincronizar el bundle web ya construido:
npm run cap:sync
```
En Android Studio: **Build > Generate Signed Bundle/APK** (AAB para Play Store).
En Xcode: selecciona el equipo de firma y **Product > Archive** para App Store.

## ⚠️ Lo único que requiere adaptación de código: OAuth de Gmail
El flujo actual abre un **popup** (`window.open`) y recibe la respuesta por
`postMessage`. En un webview nativo eso no funciona. Hay que:

1. **Abrir el consentimiento en el navegador del sistema** con `@capacitor/browser`
   en vez de `window.open`, detectando plataforma con `Capacitor.isNativePlatform()`.
2. **Volver a la app por deep link**: registrar un esquema propio
   (`com.nexofinanzas.app://gmail-connected`) y escuchar con `@capacitor/app`:
   ```ts
   import { App } from '@capacitor/app';
   App.addListener('appUrlOpen', ({ url }) => {
     if (url.includes('gmail-connected')) {
       // marcar conectado y disparar el evento 'oria:gmail-connected'
     }
   });
   ```
3. **Backend**: cuando el flujo sea nativo, el callback
   (`/email-sync/auth/callback`) debe **redirigir** a
   `com.nexofinanzas.app://gmail-connected?...` en vez de servir el HTML con
   `postMessage`. Se puede señalizar el modo nativo dentro del `state` firmado.
4. Registrar el esquema en `web/ios/App/App/Info.plist` (CFBundleURLTypes) y en
   `web/android/app/src/main/AndroidManifest.xml` (intent-filter).

Mientras no se haga esto, **todo lo demás funciona en nativo** (registro manual
de movimientos, patrimonio, metas, chat IA, ajustes); solo la conexión de Gmail
queda pendiente de esta adaptación.

## Recomendado antes de publicar
- **Biometría** para desbloqueo: `@capacitor-community/biometric-auth` o
  `capacitor-native-biometric` (encaja con la pantalla de bloqueo existente).
- **Splash / status bar**: `@capacitor/splash-screen` y `@capacitor/status-bar`
  ya están en dependencias; inicialízalos en el arranque para el look nativo.
- **Íconos y splash**: usar `@capacitor/assets` para generar todos los tamaños
  desde un PNG 1024×1024.
- El auto-update por `version.json`/service worker es del mundo web; en nativo
  las actualizaciones van por la tienda (o Live Update de Capacitor/Appflow).

## Fichas de tienda
- **Play Store**: política de privacidad, sección Data Safety (declarar que se
  leen correos bancarios de solo lectura, no se venden datos), permiso de
  cuentas financieras.
- **App Store**: descripción del uso de Gmail (scope `gmail.readonly`), política
  de privacidad, y justificar que no es un "webview vacío" (tiene funciones
  nativas: biometría, notificaciones, deep links).
