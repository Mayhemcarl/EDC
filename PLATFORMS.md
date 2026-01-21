# Inicialización de Firebase para Web, iOS y Android

Este proyecto usa Firebase Realtime Database para gestionar alumnos, clases agendadas y estados de pago. Para habilitar la misma base en web, iOS y Android, sigue estos pasos.
## Uso de Cloud Firestore (escritura y lectura)

## Uso de Cloud Firestore (escritura y lectura)

En Cloud Firestore trabajas con **colecciones** y **documentos**. Cada documento contiene campos con sus valores.

**Escribir datos:**
- `add()` agrega un nuevo documento a una colección.
- `set()` define el contenido de un documento específico (o lo crea si no existe).
- `update()` actualiza campos existentes en un documento.

**Leer datos:**
- `get()` obtiene un documento puntual por su ID.
- Para consultar colecciones o subconjuntos de documentos puedes usar `where()` para filtrar y `orderBy()` para ordenar.
- Puedes hacer lecturas únicas o configurar *listeners* en tiempo real para recibir cambios cuando los datos se actualicen.

## 1) Configurar el proyecto en Firebase

1. Ingresa a la consola de Firebase y crea (o selecciona) el proyecto.
2. Habilita **Realtime Database** y ajusta las reglas de seguridad.
3. Registra las aplicaciones para cada plataforma:
   - **Web:** añade el dominio correspondiente y copia la configuración del SDK.
   - **Android:** registra el `applicationId` y descarga `google-services.json`.
   - **iOS:** registra el `bundleId` y descarga `GoogleService-Info.plist`.

## 2) Web

1. Actualiza la configuración de Firebase dentro de `app.js` con los datos de tu proyecto.
2. En la consola de Firebase, habilita **Realtime Database** con el modo de producción y ajusta las reglas.
3. La estructura esperada en Realtime Database es:
   - `students/{id}`
   - `weekly_enrollments/{weekKey}`
   - `trial_requests/{id}`
   - `meta/system`
4. Publica la web con Firebase Hosting:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy
   ```

## 3) Android

1. Instala el SDK de Firebase siguiendo la guía oficial.
2. Coloca `google-services.json` en `android/app/`.
3. Agrega el plugin de Google Services y sincroniza Gradle.
4. Usa el mismo esquema de datos (`students`, `enrollments`, `trialRequests`, `meta`) para mantener consistencia con la web.

## 4) iOS

1. Instala el SDK de Firebase con Swift Package Manager o CocoaPods.
2. Coloca `GoogleService-Info.plist` en tu target.
3. Inicializa Firebase en `AppDelegate` o `@main` según tu configuración.
4. Usa el mismo esquema de datos (`students`, `enrollments`, `trialRequests`, `meta`).

## 5) Mantenimiento semanal y mensual

El frontend aplica reglas de mantenimiento:
- **Domingos:** limpia las clases agendadas de la semana actual.
- **Día 1 de cada mes:** reinicia el estado de pago a `pendiente`.
- **Desde el día 6:** marca como `vencido` los pagos aún pendientes.

Para automatizarlo sin depender del uso de la web, se recomienda crear una Cloud Function programada (cron) que ejecute las mismas reglas sobre la base de datos.
