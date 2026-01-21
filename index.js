/**
 * =========================================================
 * FIREBASE CLOUD FUNCTIONS – BACKEND
 * =========================================================
 * - Realtime Database
 * - Firebase Auth
 * - Firebase Cloud Messaging
 * - Sin DOM
 * - Sin frontend
 * =========================================================
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * Inicialización Firebase Admin
 */
admin.initializeApp();

/* =========================================================
   FUNCIÓN 1: RESET MENSUAL AUTOMÁTICO
   - Día 1 → Pendiente
   - Día 6 → Vencido (si no está pagado)
   - Se ejecuta todos los días a las 02:00 AM
========================================================= */
exports.resetMensualPagos = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("America/Santiago")
  .onRun(async () => {

    const hoy = new Date();
    const dia = hoy.getDate();

    const alumnosRef = admin.database().ref("alumnos");
    const snapshot = await alumnosRef.once("value");

    if (!snapshot.exists()) return null;

    const updates = {};

    snapshot.forEach(child => {
      const alumno = child.val();
      let estadoPago = alumno.estadoPago || "pendiente";

      if (dia === 1) {
        estadoPago = "pendiente";
      }

      if (dia >= 6 && estadoPago !== "pagado") {
        estadoPago = "vencido";
      }

      updates[`${child.key}/estadoPago`] = estadoPago;
    });

    await alumnosRef.update(updates);
    console.log("Estados de pago actualizados");

    return null;
  });

/* =========================================================
   FUNCIÓN 2: DESCONTAR CLASE AL AGENDAR
   Ruta: /reservas/{uid}/{claseId}
========================================================= */
exports.descontarClase = functions.database
  .ref("/reservas/{uid}/{claseId}")
  .onCreate(async (snapshot, context) => {

    const { uid } = context.params;
    const alumnoRef = admin.database().ref(`alumnos/${uid}`);

    const alumnoSnap = await alumnoRef.once("value");
    if (!alumnoSnap.exists()) return null;

    const alumno = alumnoSnap.val();

    if (alumno.estadoPago === "vencido") {
      await snapshot.ref.remove();
      console.log("Reserva eliminada: pago vencido");
      return null;
    }

    const clasesRestantes = Math.max(
      0,
      (alumno.clasesDisponibles || 0) - 1
    );

    await alumnoRef.update({
      clasesDisponibles: clasesRestantes
    });

    console.log(`Clase descontada a ${uid}`);
    return null;
  });

/* =========================================================
   FUNCIÓN 3: NOTIFICAR ADMIN AL INSCRIBIRSE
========================================================= */
exports.notificarAdminInscripcion = functions.database
  .ref("/reservas/{uid}/{claseId}")
  .onCreate(async (snapshot, context) => {

    const { uid, claseId } = context.params;

    const alumnoSnap = await admin.database()
      .ref(`alumnos/${uid}`)
      .once("value");

    const alumno = alumnoSnap.val() || {};
    const nombre = alumno.nombre || "Alumno";

    const adminsSnap = await admin.database()
      .ref("usuarios")
      .orderByChild("role")
      .equalTo("admin")
      .once("value");

    const tokens = [];

    adminsSnap.forEach(adminUser => {
      const data = adminUser.val();
      if (data?.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });

    if (!tokens.length) return null;

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "Nueva inscripción",
        body: `${nombre} se inscribió a una clase`
      },
      data: {
        type: "INSCRIPCION",
        uid,
        claseId
      }
    });

    console.log("Notificación enviada a admins");
    return null;
  });

/* =========================================================
   FUNCIÓN 4: BLOQUEAR INSCRIPCIÓN SI CLASES = 0
========================================================= */
exports.validarClasesDisponibles = functions.database
  .ref("/reservas/{uid}/{claseId}")
  .onCreate(async (snapshot, context) => {

    const { uid } = context.params;
    const alumnoRef = admin.database().ref(`alumnos/${uid}`);

    const alumnoSnap = await alumnoRef.once("value");
    if (!alumnoSnap.exists()) return null;

    const alumno = alumnoSnap.val();

    if ((alumno.clasesDisponibles || 0) <= 0) {
      await snapshot.ref.remove();
      console.log("Reserva cancelada: sin clases disponibles");
    }

    return null;
  });

