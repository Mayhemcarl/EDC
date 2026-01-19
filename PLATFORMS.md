# Inicialización de Firebase para Web, iOS y Android

Este proyecto usa Firebase Realtime Database para gestionar alumnos, clases agendadas y estados de pago. Para habilitar la misma base en web, iOS y Android, sigue estos pasos.

## 1) Configurar el proyecto en Firebase

1. Ingresa a la consola de Firebase y crea (o selecciona) el proyecto.
2. Habilita **Realtime Database** y ajusta las reglas de seguridad.
3. Registra las aplicaciones para cada plataforma:
   - **Web:** añade el dominio correspondiente y copia la configuración del SDK.
   - **Android:** registra el `applicationId` y descarga `google-services.json`.
   - **iOS:** registra el `bundleId` y descarga `GoogleService-Info.plist`.

## 2) Web

1. Actualiza la configuración de Firebase dentro de `app.js` con los datos de tu proyecto.
2. Publica la web en un hosting compatible (Firebase Hosting o similar).

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
