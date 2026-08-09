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

## OAuth de Gmail en nativo — ✅ código implementado
La adaptación ya está en el código (usa el patrón probado navegador-del-sistema
+ deep link):

- **Frontend** (`SettingsScreen.connectGmail`): si `Capacitor.isNativePlatform()`,
  pide la URL con `?platform=native` y la abre con `@capacitor/browser`.
- **Retorno por deep link** (`App.tsx`): escucha `appUrlOpen` de `@capacitor/app`,
  captura `com.nexofinanzas.app://gmail-connected?email=…&count=…`, marca
  conectado, cierra el navegador y dispara el sync del backend.
- **Backend** (`/email-sync/auth/google` + `/callback`): el `platform` va firmado
  dentro del `state` HMAC; el callback redirige al deep link en nativo y sirve el
  HTML normal en web.

### Lo único que falta (en los proyectos nativos, tras `cap add`)
Registrar el esquema `com.nexofinanzas.app` para que el SO reabra la app:

**iOS — `web/ios/App/App/Info.plist`:**
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array><string>com.nexofinanzas.app</string></array>
  </dict>
</array>
```

**Android — `web/android/app/src/main/AndroidManifest.xml`** (dentro del
`<activity>` principal):
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="com.nexofinanzas.app" android:host="gmail-connected" />
</intent-filter>
```

> Nota: **no** hay que tocar Google Cloud. Google sigue redirigiendo al callback
> **web** del backend (`GOOGLE_REDIRECT_URI`, ya autorizado); ese callback es el
> que rebota al esquema `com.nexofinanzas.app://` para reabrir la app. El esquema
> no es un redirect URI de Google.

Todo lo demás ya funciona en nativo (registro manual, patrimonio, metas, chat
IA, ajustes).

## Biometría (Face ID / huella) — ✅ implementada
El desbloqueo con biometría ya está en la pantalla de bloqueo
(`@aparajita/capacitor-biometric-auth`, wrapper en `web/src/lib/biometric.ts`).
En un dispositivo nativo con biometría registrada, la pantalla de bloqueo
auto-solicita Face ID/huella y ofrece un botón "Usar biometría"; en web es no-op.

**Falta solo el permiso en iOS** — agrega a `web/ios/App/App/Info.plist`:
```xml
<key>NSFaceIDUsageDescription</key>
<string>ORIA usa Face ID para desbloquear tu información financiera.</string>
```
Android no requiere permiso extra (usa BiometricPrompt).

## Recomendado antes de publicar
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
