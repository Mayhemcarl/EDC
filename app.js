/*************************************************
 * FIREBASE IMPORTS (SDK MODULAR)
 *************************************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import {
  getMessaging,
  getToken
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging.js";

/*************************************************
 * FIREBASE CONFIG
 *************************************************/
const firebaseConfig = {
  apiKey: "AIzaSyCdp2xekXWXGorVDXtGwzC73N-F4_Ig4gU",
  authDomain: "elemental-dojo-curico.firebaseapp.com",
  projectId: "elemental-dojo-curico",
  storageBucket: "elemental-dojo-curico.firebasestorage.app",
  messagingSenderId: "39532293146",
  appId: "1:39532293146:web:0c44ace849aeed5f5335a3"
};

const VAPID_KEY = "el0gWPKwbMfQd_KnavjTjR9HK9H7UV1ZOUgtNRKYqLI";

/*************************************************
 * INIT
 *************************************************/
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const messaging = getMessaging(app);
import { getDatabase, ref, set } from "firebase/database";
function cargarPlanesIniciales() {
  const planes = {
    jiu_jitsu: {
      basico: { nombre: "Básico Jiu Jitsu", clasesSemanales: 3 },
      full: { nombre: "Full Jiu Jitsu", clasesSemanales: 10 },
      mujeres: { nombre: "Básico Jiu Jitsu", clasesSemanales: 3 },
      rebaja: { nombre: "Rebaja Jiu Jitsu", clasesSemanales: 5 },
      especial: { nombre: "Especial Jiu Jitsu", clasesSemanales: 3 }
    },
    judo: {
      basico: { nombre: " Judo", clasesSemanales: 2 }
    },
    kick_boxing: {
      basico: { nombre: "Básico Kick Boxing", clasesSemanales: 3 }
    }
  };

  set(ref(database, "planes"), planes);
}

/*************************************************
 * HELPERS
 *************************************************/
const $ = id => document.getElementById(id);
const log = (...a) => $("log") && ($("log").textContent += a.join(" ") + "\n");

let currentUser = null;
let currentProfile = null;
function resetMensual() {
  const hoy = new Date();
  const dia = hoy.getDate();

  if (dia !== 1) return;

  get(ref(db, "alumnos")).then(snapshot => {
    snapshot.forEach(child => {
      const alumno = child.val();

      update(ref(db, `alumnos/${child.key}`), {
        estadoPago: "pendiente",
        clasesDisponibles: alumno.clasesDisponibles // se reasigna al pagar
      });
    });
  });
}
/*************************************************
 * AUTH
 *************************************************/
$("btnSignup")?.addEventListener("click", async () => {
  const email = $("email").value.trim();
  const pass = $("pass").value.trim();
  const name = $("name").value.trim() || "Alumno";

  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(cred.user, { displayName: name });

  await setDoc(doc(db, "users", cred.user.uid), {
    nombre: name,
    role: "student",
    estadoPago: "Pendiente",
    createdAt: serverTimestamp()
  });

  log("Cuenta creada:", cred.user.uid);
});

$("btnLogin")?.addEventListener("click", async () => {
  await signInWithEmailAndPassword(
    auth,
    $("email").value.trim(),
    $("pass").value.trim()
  );
});

$("btnLogout")?.addEventListener("click", async () => {
  await signOut(auth);
});

/*************************************************
 * AUTH STATE
 *************************************************/
onAuthStateChanged(auth, async user => {
  currentUser = user;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  currentProfile = snap.data();

  $("tabAdmin")?.classList.toggle("hidden", currentProfile.role !== "admin");

  await renderTodaySessions();
});

/*************************************************
 * VALIDACIÓN DE PAGO
 *************************************************/
async function puedeAgendar(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() && snap.data().estadoPago === "Pagado";
}

/*************************************************
 * CLASES / SESIONES
 *************************************************/
async function renderTodaySessions() {
  if (!currentUser) return;

  const now = new Date();
  const start = new Date(now.setHours(0,0,0,0));
  const end = new Date(now.setHours(23,59,59,999));

  const q = query(
    collection(db, "sessions"),
    where("startAt", ">=", Timestamp.fromDate(start)),
    where("startAt", "<=", Timestamp.fromDate(end)),
    orderBy("startAt")
  );

  const snap = await getDocs(q);
  $("todaySessions").innerHTML = "";

  snap.forEach(d => {
    const s = d.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <b>${s.classId}</b>
      <button>Inscribirme</button>
    `;

    card.querySelector("button").onclick = async () => {
      if (!(await puedeAgendar(currentUser.uid))) {
        alert("Estado de pago vencido.");
        return;
      }

      await setDoc(
        doc(db, "sessions", d.id, "enrollments", currentUser.uid),
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          createdAt: serverTimestamp()
        }
      );
      alert("Inscripción exitosa");
    };

    $("todaySessions").appendChild(card);
  });
}

/*************************************************
 * ADMIN – ALUMNOS
 *************************************************/

async function cargarAlumnosAdmin() {
  const snap = await getDocs(collection(db, "users"));
  const tbody = $("admin-alumnos-table");
  tbody.innerHTML = "";

  snap.forEach(d => {
    const u = d.data();
    tbody.innerHTML += `
      <tr>
        <td>${u.nombre}</td>
        <td>${u.role}</td>
        <td>
          <select data-id="${d.id}">
            <option ${u.estadoPago==="Pendiente"?"selected":""}>Pendiente</option>
            <option ${u.estadoPago==="Pagado"?"selected":""}>Pagado</option>
            <option ${u.estadoPago==="Vencido"?"selected":""}>Vencido</option>
          </select>
        </td>
      </tr>
    `;
  });

  tbody.querySelectorAll("select").forEach(sel => {
    sel.onchange = async () => {
      await updateDoc(doc(db, "users", sel.dataset.id), {
        estadoPago: sel.value
      });
    };
  });
}
function actualizarAlumno(uid, nuevoEstado, disciplina, planId) {

  const planRef = ref(db, `planes/${disciplina}/${planId}`);

  get(planRef).then(snapshot => {
    if (!snapshot.exists()) {
      alert("Plan no válido");
      return;
    }

    const plan = snapshot.val();

    update(ref(db, `alumnos/${uid}`), {
      estadoPago: nuevoEstado,
      disciplina: disciplina,
      planId: planId,
      clasesDisponibles: plan.clasesSemanales,
      ultimoPago: new Date().toISOString().slice(0, 10)
    });
  });
}
function puedeAgendar(uid, claseId) {
  return Promise.all([
    get(ref(db, `alumnos/${uid}`)),
    get(ref(db, `clases/${claseId}`))
  ]).then(([alumnoSnap, claseSnap]) => {

    const alumno = alumnoSnap.val();
    const clase = claseSnap.val();

    if (alumno.estadoPago === "vencido") return false;
    if (alumno.clasesDisponibles <= 0) return false;
    if (alumno.disciplina !== clase.disciplina) return false;

    return true;
  });
}
/*************************************************
 * ADMIN – PUSH
 *************************************************/
$("btnEnablePush")?.addEventListener("click", async () => {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return;

  const token = await getToken(messaging, { vapidKey: VAPID_KEY });
  await setDoc(doc(db, "users", currentUser.uid), {
    fcmToken: token
  }, { merge: true });

  alert("Notificaciones activadas");
});
