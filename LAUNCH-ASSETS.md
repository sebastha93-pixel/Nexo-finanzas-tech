# ORIA — Assets de lanzamiento (Google OAuth + tiendas)

Textos listos para copiar en los formularios de verificación de Google y en las
fichas de App Store / Google Play. Ajusta lo que esté entre corchetes.

---

## B) Verificación de Google OAuth (scope `gmail.readonly`)

### Requisitos previos (en Google Cloud Console)
- **Dominio autorizado:** `oriafintech.com` verificado en Google Search Console.
- **Homepage:** `https://oriafintech.com` (debe describir la app y enlazar la política).
- **Política de privacidad:** `https://oriafintech.com/privacy.html`
- **Logo** de la app (cuadrado, fondo sólido).
- **Justificación por scope** (abajo).
- **Video demo** (YouTube "no listado").
- Para scopes **restringidos** (`gmail.readonly`): **evaluación de seguridad CASA** (Tier 2) por un asesor autorizado.

### Justificación del scope (pega esto en el formulario)
> ORIA es una aplicación de finanzas personales. Utiliza el permiso
> `gmail.readonly` exclusivamente para leer los correos de **alerta
> transaccional** que los bancos del usuario (Bancolombia, Davivienda, Nequi)
> envían a su Gmail, con el fin de extraer automáticamente el monto, la fecha,
> el comercio y el tipo de cada movimiento y registrarlos dentro de la app sin
> que el usuario los digite manualmente. El acceso es **de solo lectura**: ORIA
> nunca envía, modifica ni elimina correos, aplica filtros para procesar
> únicamente los correos de alerta bancaria, no utiliza los datos para
> publicidad y no los vende. Esta es la funcionalidad central del producto
> (importación automática de movimientos), y no puede ofrecerse sin este
> permiso; las alternativas (reenvío manual de correos o carga de extractos)
> degradan sustancialmente la experiencia principal.

### Guion del video demo (lo que Google exige mostrar)
1. Muestra la URL `https://oriafintech.com` (homepage) y el enlace a la política de privacidad.
2. Abre la app e inicia sesión.
3. Ve a **Ajustes → "Conectar Gmail"**.
4. **Graba la pantalla de consentimiento de Google** mostrando claramente el permiso `gmail.readonly` solicitado y el **OAuth Client ID** (debe coincidir con el que verificas).
5. Otorga el acceso.
6. Regresa a la app y muestra que **se importaron movimientos** a partir de los correos de alerta bancaria (el uso real del dato).
7. Menciona/enseña que ORIA solo procesa alertas bancarias, no otros correos.
8. Sube el video a **YouTube como "No listado"** y pega el enlace en el formulario.

---

## C) Fichas de tienda

### App Store (Apple)
- **Nombre (≤30):** `ORIA`
- **Subtítulo (≤30):** `Tus finanzas, en automático`
- **Categoría:** Finanzas
- **Palabras clave (≤100):** `finanzas,gastos,ahorro,presupuesto,bancolombia,nequi,davivienda,IA,patrimonio,dinero`
- **Descripción:**
> ORIA es tu asesora financiera con inteligencia artificial. Conecta tu Gmail y
> ORIA registra tus movimientos automáticamente leyendo las alertas de tu banco
> (Bancolombia, Davivienda, Nequi) — sin teclear nada.
>
> • Importación automática de movimientos
> • Patrimonio neto: activos, deudas y cuentas en un solo lugar
> • Metas de ahorro con seguimiento
> • Asesora con IA que entiende tus finanzas y te da recomendaciones
> • Bloqueo con Face ID / huella y datos cifrados
>
> ORIA nunca accede a tus contraseñas bancarias, no mueve tu dinero y nunca
> vende tus datos. Solo lectura de tus correos de alerta, siempre bajo tu
> control.
>
> Entiende tu dinero. Construye tu futuro.

- **Novedades (what's new):** `Más seguridad, importación más precisa y desbloqueo con biometría.`
- **URL de privacidad:** `https://oriafintech.com/privacy.html`
- **App Privacy (declaración):** ver sección Data Safety abajo.

### Google Play
- **Título (≤30):** `ORIA — Finanzas con IA`
- **Descripción corta (≤80):** `Tus finanzas se registran solas y una asesora con IA te ayuda a decidir.`
- **Categoría:** Finanzas
- **Descripción larga (≤4000):**
> ORIA es tu asesora financiera personal con inteligencia artificial, hecha para
> Colombia y Latinoamérica.
>
> La diferencia: no tienes que registrar tus gastos a mano. Conecta tu Gmail y
> ORIA lee automáticamente las alertas de tu banco (Bancolombia, Davivienda,
> Nequi) para registrar cada movimiento por ti.
>
> ✔ Importación automática de ingresos y gastos
> ✔ Patrimonio neto: cuentas, tarjetas, activos y deudas en un solo lugar
> ✔ Metas de ahorro con seguimiento visual
> ✔ Asesora con IA que conoce tu contexto y te da recomendaciones concretas
> ✔ Informes mensuales y categorización inteligente
> ✔ Seguridad: desbloqueo con biometría, tokens cifrados y aislamiento de datos
>
> Privacidad primero: ORIA accede a tus correos de alerta en SOLO LECTURA, nunca
> a tus contraseñas bancarias, no puede mover tu dinero y nunca vende tus datos.
> Puedes desconectar Gmail o eliminar tu cuenta cuando quieras.
>
> Entiende tu dinero. Construye tu futuro.

- **URL de privacidad:** `https://oriafintech.com/privacy.html`
- **Eliminación de datos (URL):** `https://oriafintech.com/eliminar-cuenta.html`

---

## Data Safety (Google Play) / App Privacy (Apple) — declaración
Datos recopilados y su uso (declara esto en ambos formularios):
- **Correo electrónico** — funcionamiento de la app, cuenta. (Vinculado al usuario.)
- **Nombre** — cuenta. (Vinculado.)
- **Información financiera del usuario** (movimientos, saldos, metas) — funcionalidad de la app. (Vinculado.)
- **Correos (solo alertas bancarias, vía Gmail read-only)** — funcionalidad de la app. NO se comparte con terceros para publicidad. (Vinculado.)
- **Identificadores/diagnóstico** — seguridad y prevención de fraude.

Declaraciones clave (marca en ambos formularios):
- Los datos **se cifran en tránsito**. ✔
- El usuario **puede solicitar la eliminación** de sus datos. ✔
- **No** se venden datos ni se usan para publicidad de terceros. ✔

> Nota: revisa estas declaraciones con tu equipo legal para que coincidan
> exactamente con tus prácticas antes de enviarlas.
