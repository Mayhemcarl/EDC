import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const FIREBASE_CONFIG = {
 apiKey: "AIzaSyCdp2xekXWXGorVDXtGwzC73N-F4_Ig4gU",
  authDomain: "elemental-dojo-curico.firebaseapp.com",
  projectId: "elemental-dojo-curico",
  storageBucket: "elemental-dojo-curico.firebasestorage.app",
  messagingSenderId: "39532293146",
  appId: "1:39532293146:web:0c44ace849aeed5f5335a3"
};

let firebaseDb = null;

// Nodos esperados en Firebase Realtime Database:
// - students/{id} (id, uid, name, discipline, plan, paymentStatus, phone, email, paymentDue, accessCode, weeklyLimitOverride)
// - weekly_enrollments/{weekKey} (enrollments)
// - trial_requests/{id} (id, nombre, disciplina, telefono, email, fecha)
// - meta/system (id, lastWeeklyReset, lastPaymentResetMonth, lastPaymentOverdueMonth)

const ADMIN_USER = "EDC2019";
const ADMIN_CODE = "EDC2057";

const scheduleData = [
  { id: 1, day: "Lunes", time: "18:30", class: "Jiu Jitsu", instructor: "Prof. Carlos G", capacity: 25, enrolled: [] },
  { id: 2, day: "Lunes", time: "20:15", class: "Jiu Jitsu", instructor: "Prof. Carlos G", capacity: 25, enrolled: [] },
  { id: 3, day: "Lunes", time: "19:00", class: "Judo", instructor: "Sensei Pablo R", capacity: 25, enrolled: [] },
  { id: 4, day: "Lunes", time: "21:00", class: "Kick Boxing", instructor: "Coach Anibal R", capacity: 25, enrolled: [] },
  { id: 5, day: "Martes", time: "18:30", class: "Jiu Jitsu", instructor: "Prof. Carlos G", capacity: 25, enrolled: [] },
  { id: 6, day: "Martes", time: "20:15", class: "Jiu Jitsu", instructor: "Prof. Carlos G", capacity: 25, enrolled: [] },
  { id: 7, day: "Miércoles", time: "18:30", class: "Jiu Jitsu", instructor: "Prof. Carlos G", capacity: 25, enrolled: [] },
  { id: 8, day: "Miércoles", time: "20:15", class: "Jiu Jitsu", instructor: "Prof. Carlos G", capacity: 25, enrolled: [] },
  { id: 9, day: "Miércoles", time: "21:00", class: "Kick Boxing", instructor: "Coach Anibal R", capacity: 25, enrolled: [] },
  { id: 10, day: "Jueves", time: "19:00", class: "Judo", instructor: "Sensei Pablo R", capacity: 25, enrolled: [] },
  { id: 11, day: "Jueves", time: "18:30", class: "Jiu Jitsu", instructor: "Prof. Carlos G", capacity: 25, enrolled: [] },
  { id: 12, day: "Jueves", time: "20:15", class: "Jiu Jitsu", instructor: "Prof. Carlos G", capacity: 25, enrolled: [] },
  { id: 13, day: "Jueves", time: "21:00", class: "Kick Boxing", instructor: "Coach Anibal R", capacity: 25, enrolled: [] },
  { id: 14, day: "Viernes", time: "18:30", class: "Jiu Jitsu", instructor: "Prof. Carlos G", capacity: 25, enrolled: [] },
  { id: 15, day: "Viernes", time: "20:15", class: "Jiu Jitsu", instructor: "Prof. Carlos G", capacity: 25, enrolled: [] },
  { id: 16, day: "Sabado", time: "10:30", class: "Jiu Jitsu Kid", instructor: "Prof. Sebastian B", capacity: 25, enrolled: [] },
  { id: 17, day: "Sabado", time: "11:30", class: "OpenMAT", instructor: "Equipo EDC", capacity: 40, enrolled: [], openMatOnly: true, countsTowardLimit: false }
];

const classesData = [
  {
    id: 1,
    name: "Jiu Jitsu",
    img: "https://drive.google.com/thumbnail?id=17klKk3vtmDp2x-RL5e7Q-VCSSA0NQdxh&sz=w1000",
    instructor: "Prof. Carlos G"
  },
  {
    id: 2,
    name: "Jiu Jitsu Kid",
    img: "https://drive.google.com/thumbnail?id=17klKk3vtmDp2x-RL5e7Q-VCSSA0NQdxh&sz=w1000",
    instructor: "Prof. Sebastian B"
  },
  {
    id: 3,
    name: "Kick Boxing",
    img: "https://drive.google.com/thumbnail?id=1FZThhq5kM1-CmAi4xlNUY-nrmPD5tzYW&sz=w1000",
    instructor: "Coach Anibal R"
  },
  {
    id: 4,
    name: "Judo",
    img: "https://drive.google.com/thumbnail?id=1Ls9eUpCTpi_B7EEyDi9q1DjefUryWWZO&sz=w1000",
    instructor: "Sensei Pablo R"
  }
];

const PLAN_CONFIG = {
  "JJ_STD": { label: "Plan estándar Jiu-Jitsu", weeklyLimit: 3 },
  "JJ_KID": { label: "Plan estándar Jiu-Jitsu", weeklyLimit: 1 },
  "JJ_FULL": { label: "Plan full Jiu-Jitsu", weeklyLimit: 10 },
  "JJ_REBAJA": { label: "Plan rebaja Jiu-Jitsu", weeklyLimit: 5 },
  "JJ_MUJERES": { label: "Plan mujeres Jiu-Jitsu", weeklyLimit: 3 },
  "JD_STD": { label: "Plan estándar Judo", weeklyLimit: 2 },
  "KB_STD": { label: "Plan estándar Kickboxing", weeklyLimit: 3 },
  "PRUEBA": { label: "Clase de prueba", weeklyLimit: 1 }
};

const DISCIPLINE_PLANS = {
  "Jiu Jitsu": ["JJ_STD", "JJ_FULL", "JJ_REBAJA", "JJ_MUJERES"],
  "Jiu Jitsu Kid": ["JJ_KID"],
  "Judo": ["JD_STD"],
  "Kick Boxing": ["KB_STD"]
};

const DAY_INDEX = {
  "Domingo": 0,
  "Lunes": 1,
  "Martes": 2,
  "Miércoles": 3,
  "Jueves": 4,
  "Viernes": 5,
  "Sabado": 6
};

const MIN_RESERVATION_NOTICE_MINUTES = 60;

const DEFAULT_STUDENTS = [
  { id: "s1", uid: "uid-s1", name: "Camila Soto", discipline: "Jiu Jitsu", plan: "JJ_FULL", paymentStatus: "pagado", phone: "", email: "", paymentDue: "2024-09-10", accessCode: "JJ-4821" },
  { id: "s2", uid: "uid-s2", name: "Ignacio Díaz", discipline: "Kick Boxing", plan: "KB_STD", paymentStatus: "pendiente", phone: "", email: "", paymentDue: "2024-09-05", accessCode: "KB-7395" },
  { id: "s3", uid: "uid-s3", name: "Valentina Ríos", discipline: "Judo", plan: "JD_STD", paymentStatus: "vencido", phone: "", email: "", paymentDue: "2024-08-28", accessCode: "JD-2051" },
  { id: "s4", uid: "uid-s4", name: "Sebastián Rojas", discipline: "Jiu Jitsu Kid", plan: "PRUEBA", paymentStatus: "pagado", phone: "", email: "", paymentDue: "2024-09-01", accessCode: "JK-1148" }
];

const META_ID = "system";

let currentUser = null;
let isAdmin = false;
let cachedStudents = [];
let cachedTrialRequests = [];
let cachedEnrollments = {};

function isFirebaseConfigured() {
  return Object.values(FIREBASE_CONFIG).every(value =>
    typeof value === "string" && value.trim() !== "" && !value.includes("your-")
  );
}

function getFirebaseDb() {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!firebaseDb) {
    const app = initializeApp(FIREBASE_CONFIG);
    firebaseDb = getDatabase(app);
  }
  return firebaseDb;
}

function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function openTrialModal() { openModal("trial-modal"); }
function openLoginModal() { openModal("login-modal"); }

async function loadStudents() {
  if (!isFirebaseConfigured()) {
    return [...DEFAULT_STUDENTS];
  }
  const db = getFirebaseDb();
  const snapshot = await get(ref(db, "students"));
  const data = snapshot.exists() ? snapshot.val() : null;
  if (!data || Object.keys(data).length === 0) {
    await saveStudents(DEFAULT_STUDENTS);
    return [...DEFAULT_STUDENTS];
  }
  const students = Object.values(data);
  const { normalized, updated } = ensureStudentUids(students);
  if (updated) {
    await saveStudents(normalized);
  }
  return normalized;
}

async function saveStudents(students) {
  if (!isFirebaseConfigured()) {
    cachedStudents = [...students];
    return;
  }
  const db = getFirebaseDb();
  const normalizedStudents = students.reduce((acc, student) => {
    acc[student.id] = student;
    return acc;
  }, {});
  await set(ref(db, "students"), normalizedStudents);
  cachedStudents = [...students];
}

async function loadTrialRequests() {
  if (!isFirebaseConfigured()) {
    return [];
  }
  const db = getFirebaseDb();
  const snapshot = await get(ref(db, "trial_requests"));
  if (!snapshot.exists()) {
    return [];
  }
  return Object.values(snapshot.val());
}

async function saveTrialRequests(requests) {
  if (!isFirebaseConfigured()) {
    cachedTrialRequests = [...requests];
    return;
  }
  const db = getFirebaseDb();
  const normalizedRequests = requests.reduce((acc, request) => {
    acc[request.id] = request;
    return acc;
  }, {});
  await set(ref(db, "trial_requests"), normalizedRequests);
  cachedTrialRequests = [...requests];
}

function generateAccessCode(student) {
  if (student?.accessCode) return student.accessCode;
  const prefix = (student?.discipline || "EDC").split(" ")[0].substring(0, 2).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
}

function buildAccessMessage(student) {
  const username = student?.name || "Alumno";
  const accessKey = student?.accessCode || student?.name || "pendiente";
  return `Hola ${username}, tu usuario es ${username} y tu clave de acceso es ${accessKey}.`;
}

function notifyStudentAccess(student) {
  const message = buildAccessMessage(student);
  const phone = (student?.phone || "").replace(/\s+/g, "");
  const email = (student?.email || "").trim();

  if (phone) {
    const smsUrl = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, "_blank", "noopener");
    showToast("Mensaje de acceso listo para enviar por SMS.");
    return;
  }

  if (email) {
    const subject = "Acceso Elemental Dojo";
    const mailUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailUrl, "_blank", "noopener");
    showToast("Mensaje de acceso listo para enviar por correo.");
    return;
  }

  showToast("No hay teléfono ni correo para enviar el acceso.");
}

function generateStudentUid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `uid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function ensureStudentUids(students) {
  let updated = false;
  const normalized = students.map(student => {
    if (student.uid) {
      return student;
    }
    updated = true;
    return { ...student, uid: generateStudentUid() };
  });
  return { normalized, updated };
}

function getWeekKey(date = new Date()) {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
  return `${temp.getUTCFullYear()}-W${weekNum}`;
}

function getClassStartDate(cls, now = new Date()) {
  const [hour, minute] = cls.time.split(":").map(Number);
  const classDate = new Date(now);
  classDate.setHours(hour, minute, 0, 0);

  const todayIndex = now.getDay();
  const targetIndex = DAY_INDEX[cls.day];
  let daysUntil = (targetIndex - todayIndex + 7) % 7;

  if (daysUntil === 0 && classDate < now) {
    return classDate;
  }

  classDate.setDate(classDate.getDate() + daysUntil);
  return classDate;
}

function isReservationClosed(cls, now = new Date()) {
  const classDate = getClassStartDate(cls, now);
  const diffMs = classDate - now;
  return diffMs <= MIN_RESERVATION_NOTICE_MINUTES * 60 * 1000;
}

async function getCurrentWeekEnrollments() {
  const weekKey = getWeekKey();
  if (!isFirebaseConfigured()) {
    return {};
  }
  const db = getFirebaseDb();
  const snapshot = await get(ref(db, `weekly_enrollments/${weekKey}`));
  if (!snapshot.exists()) {
    return {};
  }
  return snapshot.val().enrollments || {};
}

async function setCurrentWeekEnrollments(currentWeek) {
  const weekKey = getWeekKey();
  if (!isFirebaseConfigured()) {
    cachedEnrollments = currentWeek;
    return;
  }
  const db = getFirebaseDb();
  await set(ref(db, `weekly_enrollments/${weekKey}`), { enrollments: currentWeek });
  cachedEnrollments = currentWeek;
}

async function hydrateScheduleEnrollments() {
  const weekEnrollments = await getCurrentWeekEnrollments();
  applyEnrollmentsToSchedule(weekEnrollments);
}

function applyEnrollmentsToSchedule(weekEnrollments) {
  cachedEnrollments = weekEnrollments;
  scheduleData.forEach(cls => {
    cls.enrolled = weekEnrollments[cls.id] || [];
  });
}

function renderCards() {
  const container = document.getElementById("classes-grid");
  container.innerHTML = "";
  classesData.forEach(cls => {
    container.innerHTML += `
      <div class="class-card" onclick="openPublicSchedule('${cls.name}')">
        <div class="card-img" style="background-image: url('${cls.img}')">
          <div class="card-overlay"><h3 class="card-title">${cls.name}</h3></div>
        </div>
        <div class="card-content">
          <div style="color:#555; font-weight:600;">Profesor: ${cls.instructor}</div>
          <div class="click-hint">Ver Horarios <i class="fas fa-chevron-down"></i></div>
        </div>
      </div>
    `;
  });
}

function openPublicSchedule(disciplineName) {
  const tbody = document.getElementById("public-schedule-table");
  document.getElementById("public-schedule-title").innerText = `Horarios: ${disciplineName}`;
  tbody.innerHTML = "";

  const filteredSchedule = scheduleData.filter(s => {
    if (disciplineName === "Jiu Jitsu") {
      return s.class === disciplineName || s.openMatOnly;
    }
    return s.class === disciplineName;
  });
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sabado"];

  const times = [...new Set(filteredSchedule.map(s => s.time))].sort();

  let headerRow = "<tr><th>Hora</th>";
  days.forEach(d => headerRow += `<th>${d}</th>`);
  headerRow += "</tr>";
  tbody.innerHTML = headerRow;

  times.forEach(time => {
    let row = `<tr><td><span class="tt-time">${time}</span></td>`;
    days.forEach(day => {
      const cls = filteredSchedule.find(s => s.day === day && s.time === time);
      if (cls) {
        const spots = cls.capacity - cls.enrolled.length;
        const classLabel = cls.openMatOnly ? "Open Mat" : cls.class;
        row += `
          <td>
            <span class="tt-header">${classLabel}</span>
            <span class="tt-prof">${cls.instructor}</span>
            <span class="tt-spots">${spots} cupos</span>
          </td>
        `;
      } else {
        row += "<td>-</td>";
      }
    });
    row += "</tr>";
    tbody.innerHTML += row;
  });

  openModal("public-schedule-modal");
}

async function submitTrial(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-submit-trial");
  const originalText = btn.innerText;

  btn.innerText = "ENVIANDO...";
  btn.disabled = true;

  const data = {
    nombre: document.getElementById("t-name").value,
    disciplina: document.getElementById("t-disc").value,
    telefono: document.getElementById("t-phone").value,
    email: document.getElementById("t-email").value
  };

  try {
    const requests = cachedTrialRequests.length ? cachedTrialRequests : await loadTrialRequests();
    requests.unshift({
      id: `t${Date.now()}`,
      nombre: data.nombre,
      disciplina: data.disciplina,
      telefono: data.telefono,
      email: data.email,
      fecha: new Date().toISOString()
    });
    await saveTrialRequests(requests);
    showToast("Solicitud enviada correctamente");
    closeModal("trial-modal");
    document.querySelector("#trial-modal form").reset();
    if (isAdmin) {
      await cargarSolicitudesTrialAdmin();
    }
  } catch (error) {
    console.error("Error guardando solicitud:", error);
    showToast("No se pudo guardar la solicitud.");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

async function getStudentsByName(name) {
  const students = cachedStudents.length ? cachedStudents : await loadStudents();
  return students.filter(student => student.name.toLowerCase() === name.toLowerCase());
}

async function handleLogin(e) {
  e.preventDefault();
  const name = document.getElementById("user-name").value.trim();
  const code = document.getElementById("access-code").value.trim();

  if (name === ADMIN_USER && (code === ADMIN_CODE || code === name)) {
    isAdmin = true;
    currentUser = { name: "Administrador", role: "admin" };
    mostrarMenuUsuario();
    updatePublicButtons();
    closeModal("login-modal");
    showToast("Bienvenido, admin");
    return;
  }

  if (code === ADMIN_CODE || name === ADMIN_USER) {
    showToast("Credenciales de administrador incorrectas");
    return;
  }

  const matchingStudents = await getStudentsByName(name);
  if (matchingStudents.length === 0) {
    showToast("Alumno no encontrado. Verifica el nombre.");
    return;
  }

  const normalizedCode = code.toLowerCase();
  const nameKey = name.toLowerCase();
  const matchedStudent = matchingStudents.find(student => {
    const accessKey = (student.accessCode || "").toLowerCase();
    return normalizedCode === nameKey || (accessKey && normalizedCode === accessKey);
  });

  if (matchingStudents.length > 1 && normalizedCode === nameKey) {
    showToast("Hay alumnos con el mismo nombre. Usa tu clave de acceso para ingresar.");
    return;
  }

  if (!matchedStudent || !normalizedCode) {
    showToast("Clave incorrecta");
    return;
  }

  isAdmin = false;
  currentUser = { ...matchedStudent, role: "member" };
  mostrarMenuUsuario();
  updatePublicButtons();
  closeModal("login-modal");
  await abrirCalendario();
}

function isOpenMatEligible(user) {
  return Boolean(user && user.discipline === "Jiu Jitsu");
}

function getWeeklyLimitForStudent(student) {
  if (!student) return 0;
  if (typeof student.weeklyLimitOverride === "number") {
    return Math.max(0, student.weeklyLimitOverride);
  }
  return PLAN_CONFIG[student.plan]?.weeklyLimit || 0;
}

function isClassRelevantForUser(cls, user) {
  if (!user) return false;
  if (cls.openMatOnly) return isOpenMatEligible(user);
  return cls.class === user.discipline;
}

function updatePublicButtons() {
  const loginButton = document.getElementById("btn-login");
  const trialButton = document.getElementById("btn-trial");
  const shouldShow = !currentUser;
  if (loginButton) loginButton.classList.toggle("hidden", !shouldShow);
  if (trialButton) trialButton.classList.toggle("hidden", !shouldShow);
}

function getUserWeeklyCount(user) {
  if (!user) return 0;
  return scheduleData.filter(c =>
    c.countsTowardLimit !== false && c.enrolled.some(u => u.name === user.name)
  ).length;
}

function mostrarMenuUsuario() {
  const menu = document.getElementById("user-menu");
  menu.classList.remove("hidden");

  const btnPayment = document.getElementById("btnPaymentStatus");
  const btnProfile = document.getElementById("btnProfile");
  const btnMyClasses = document.getElementById("btnMyClasses");
  const btnSchedule = document.getElementById("btnSchedule");
  const btnAdminTrials = document.getElementById("btnAdminTrials");
  const btnAdminWeek = document.getElementById("btnAdminWeek");
  const btnAdminStudents = document.getElementById("btnAdminStudents");
  const btnAdminAddStudent = document.getElementById("btnAdminAddStudent");
  if (currentUser.role === "admin") {
    btnPayment.classList.add("hidden");
    btnProfile.classList.add("hidden");
    btnMyClasses.classList.add("hidden");
    btnSchedule.classList.add("hidden");
    btnAdminTrials.classList.remove("hidden");
    btnAdminWeek.classList.remove("hidden");
    btnAdminStudents.classList.remove("hidden");
    btnAdminAddStudent.classList.remove("hidden");
  } else {
    btnPayment.classList.remove("hidden");
    btnProfile.classList.remove("hidden");
    btnMyClasses.classList.remove("hidden");
    btnSchedule.classList.remove("hidden");
    btnAdminTrials.classList.add("hidden");
    btnAdminWeek.classList.add("hidden");
    btnAdminStudents.classList.add("hidden");
    btnAdminAddStudent.classList.add("hidden");
  }
}

function cerrarSesion() {
  currentUser = null;
  isAdmin = false;
  document.getElementById("user-menu").classList.add("hidden");
  updatePublicButtons();
  showToast("Sesión cerrada");
}

async function abrirCalendario() {
  document.getElementById("calendar-title").innerText =
    currentUser.role === "admin"
      ? "Calendario General"
      : `Agendar clases: ${currentUser.discipline}`;

  await renderCalendar();
  openModal("calendar-modal");
}

function abrirEstadoPago() {
  cargarEstadoPagoUsuario();
  openModal("payment-modal");
}

function abrirPerfil() {
  document.getElementById("profile-name").innerText = currentUser.name;
  document.getElementById("profile-plan").innerText = PLAN_CONFIG[currentUser.plan]?.label || currentUser.plan;
  document.getElementById("profile-discipline").innerText = currentUser.discipline || "-";
  document.getElementById("profile-payment").innerText = currentUser.paymentStatus || "-";
  document.getElementById("profile-access-code").innerText = currentUser.accessCode || currentUser.name;
  const form = document.getElementById("form-update-access-code");
  if (form) {
    form.reset();
  }
  openModal("profile-modal");
}

async function actualizarClaveAcceso(event) {
  event.preventDefault();
  if (!currentUser || currentUser.role !== "member") {
    showToast("Solo disponible para alumnos.");
    return;
  }

  const newCode = document.getElementById("new-access-code").value.trim();
  const confirmCode = document.getElementById("confirm-access-code").value.trim();

  if (!newCode || !confirmCode) {
    showToast("Completa ambos campos.");
    return;
  }

  if (newCode !== confirmCode) {
    showToast("Las claves no coinciden.");
    return;
  }

  const normalizedCode = newCode.toLowerCase();
  if (normalizedCode === ADMIN_CODE.toLowerCase() || normalizedCode === ADMIN_USER.toLowerCase()) {
    showToast("Esa clave está reservada. Usa otra.");
    return;
  }

  const students = cachedStudents.length ? cachedStudents : await loadStudents();
  const hasConflict = students.some(student =>
    student.id !== currentUser.id &&
    (student.accessCode || "").toLowerCase() === normalizedCode
  );

  if (hasConflict) {
    showToast("La clave ya está en uso. Elige otra.");
    return;
  }

  const updatedStudents = students.map(student =>
    student.id === currentUser.id ? { ...student, accessCode: newCode } : student
  );

  await saveStudents(updatedStudents);
  currentUser.accessCode = newCode;
  document.getElementById("profile-access-code").innerText = newCode;
  document.getElementById("form-update-access-code").reset();
  showToast("Clave actualizada correctamente.");
}

async function abrirMisClases() {
  await renderMisClases();
  openModal("my-classes-modal");
}

async function abrirClasesAgendadasAdmin() {
  await cargarClasesAgendadasAdmin();
  await cargarSolicitudesTrialAdmin();
  openModal("admin-trial-modal");
}

function abrirClasesSemanaAdmin() {
  const defaultDiscipline = "Jiu Jitsu";
  setAdminWeekDiscipline(defaultDiscipline);
  openModal("admin-weekly-plan-modal");
}

async function abrirAlumnosInscritosAdmin() {
  await cargarAlumnosAdmin();
  openModal("admin-students-modal");
}

function abrirAgregarAlumnoAdmin() {
  actualizarPlanesDisponibles();
  openModal("admin-add-student-modal");
}

function cargarEstadoPagoUsuario() {
  const card = document.getElementById("payment-status-card");
  if (!currentUser || currentUser.role !== "member") {
    card.innerHTML = '<p class="muted">Solo disponible para alumnos.</p>';
    return;
  }

  const status = currentUser.paymentStatus;
  const statusText = status === "pagado" ? "Pagado" : status === "pendiente" ? "Pendiente" : "Vencido";
  const statusClass = status === "pagado" ? "status-paid" : status === "pendiente" ? "status-pending" : "status-overdue";

  card.innerHTML = `
    <h3>Estado actual</h3>
    <p><span class="status-pill ${statusClass}">${statusText}</span></p>
    <p><strong>Próximo pago:</strong> ${currentUser.paymentDue || "Por definir"}</p>
    <p>${status === "pendiente" ? "Recuerda regularizar tu pago durante esta semana." : status === "vencido" ? "Tu pago está vencido. Debes regularizar para volver a reservar." : "¡Gracias por mantener tu pago al día!"}</p>
  `;
}

async function renderCalendar() {
  try {
    await hydrateScheduleEnrollments();
  } catch (error) {
    console.error("Error cargando clases para el calendario:", error);
    scheduleData.forEach(cls => {
      if (!Array.isArray(cls.enrolled)) {
        cls.enrolled = [];
      }
    });
  }
  const grid = document.getElementById("calendar-grid");
  const paymentBanner = document.getElementById("payment-banner");
  const limitInfo = document.getElementById("limit-info");
  grid.innerHTML = "";

  const dayOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sabado"];
  const days = isAdmin
    ? dayOrder
    : dayOrder.filter(day =>
      scheduleData.some(cls => cls.day === day && isClassRelevantForUser(cls, currentUser))
    );

  let userCount = 0;
  let planLimit = 0;

  if (!isAdmin && currentUser) {
    userCount = getUserWeeklyCount(currentUser);
    planLimit = getWeeklyLimitForStudent(currentUser);

    document.getElementById("classes-count").innerText = userCount;
    document.getElementById("max-classes").innerText = planLimit;
    const planLabel = PLAN_CONFIG[currentUser.plan]?.label || currentUser.plan;
    const overrideTag = typeof currentUser.weeklyLimitOverride === "number"
      ? " (límite ajustado por admin)"
      : "";
    document.getElementById("plan-name-display").innerText = `${planLabel}${overrideTag}`;

    if (planLimit > 0) {
      limitInfo.classList.remove("hidden");
    } else {
      limitInfo.classList.add("hidden");
    }

    if (currentUser.paymentStatus === "pendiente") {
      paymentBanner.classList.remove("hidden");
      paymentBanner.classList.remove("is-overdue");
      paymentBanner.innerText = "Recuerda regularizar tu pago pendiente para evitar bloqueos de reserva.";
    } else if (currentUser.paymentStatus === "vencido") {
      paymentBanner.classList.remove("hidden");
      paymentBanner.classList.add("is-overdue");
      paymentBanner.innerText = "Pago vencido: no podrás reservar hasta que el administrador confirme el pago.";
    } else {
      paymentBanner.classList.add("hidden");
    }
  } else {
    limitInfo.classList.add("hidden");
    paymentBanner.classList.add("hidden");
  }

  days.forEach(day => {
    let columnHTML = `<div class="day-column"><div class="day-header">${day}</div>`;
    const dayClasses = scheduleData.filter(s => s.day === day);
    const relevantClasses = isAdmin
      ? dayClasses
      : dayClasses.filter(c => isClassRelevantForUser(c, currentUser));

    relevantClasses.forEach(c => {
      const isEnrolled = currentUser && c.enrolled.some(u => u.name === currentUser.name);
      const isFull = c.enrolled.length >= c.capacity;
      const reservationClosed = !isEnrolled && !isAdmin && isReservationClosed(c);
      let btnClass = "cal-btn reserve";
      let btnText = "RESERVAR";
      let btnState = "";
      let canReserve = true;

      if (isAdmin) {
        canReserve = false;
      } else if (currentUser.paymentStatus === "vencido") {
        btnText = "PAGO VENCIDO";
        btnClass = "cal-btn disabled";
        canReserve = false;
      } else if (isEnrolled) {
        btnText = "CANCELAR";
        btnClass = "cal-btn cancel";
      } else if (reservationClosed) {
        btnText = "CERRADO";
        btnClass = "cal-btn disabled";
        canReserve = false;
      } else if (isFull) {
        btnText = "LLENO";
        btnClass = "cal-btn disabled";
        canReserve = false;
      } else if (c.countsTowardLimit !== false && planLimit > 0 && userCount >= planLimit) {
        btnText = "LÍMITE ALCANZADO";
        btnClass = "cal-btn disabled";
        canReserve = false;
      }

      if (!canReserve) btnState = "disabled";

      let namesList = c.enrolled.map(u => u.name).join(", ");
      if (!namesList) namesList = "Vacío";
      const adminCountLabel = isAdmin ? ` (${c.enrolled.length})` : "";

      columnHTML += `
        <div class="cal-card">
          <div class="cal-time">${c.time}</div>
          <div class="cal-class">${c.class}</div>
          <div class="cal-attendees">Alumnos${adminCountLabel}: ${namesList}</div>
          ${!isAdmin ? `<button class="${btnClass}" ${btnState} onclick="toggleReservation(${c.id})">${btnText}</button>` : ""}
        </div>
      `;
    });
    if (relevantClasses.length === 0) columnHTML += `<div style="color:#ccc; font-size:0.8rem; text-align:center; padding:10px;">-</div>`;
    columnHTML += "</div>";
    grid.innerHTML += columnHTML;
  });
}

async function renderMisClases() {
  const list = document.getElementById("my-classes-list");
  const paymentBanner = document.getElementById("my-classes-payment");
  list.innerHTML = "";
  try {
    await hydrateScheduleEnrollments();
  } catch (error) {
    console.error("Error cargando clases del alumno:", error);
    scheduleData.forEach(cls => {
      if (!Array.isArray(cls.enrolled)) {
        cls.enrolled = [];
      }
    });
  }

  if (!currentUser || currentUser.role !== "member") {
    list.innerHTML = '<p class="muted">Solo disponible para alumnos.</p>';
    return;
  }

  const userEnrollments = scheduleData.filter(c => c.enrolled.some(u => u.name === currentUser.name));
  const planLimit = getWeeklyLimitForStudent(currentUser);
  const limitInfo = document.querySelector("#my-classes-modal .plan-limit-info");

  document.getElementById("my-classes-count").innerText = getUserWeeklyCount(currentUser);
  document.getElementById("my-classes-max").innerText = planLimit;
  const planLabel = PLAN_CONFIG[currentUser.plan]?.label || currentUser.plan;
  const overrideTag = typeof currentUser.weeklyLimitOverride === "number"
    ? " (límite ajustado por admin)"
    : "";
  document.getElementById("my-plan-name").innerText = `${planLabel}${overrideTag}`;
  if (limitInfo) {
    limitInfo.classList.toggle("hidden", planLimit === 0);
  }

  if (currentUser.paymentStatus === "pendiente") {
    paymentBanner.classList.remove("hidden");
    paymentBanner.classList.remove("is-overdue");
    paymentBanner.innerText = "Tienes un pago pendiente. Regulariza para evitar bloqueos de reserva.";
  } else if (currentUser.paymentStatus === "vencido") {
    paymentBanner.classList.remove("hidden");
    paymentBanner.classList.add("is-overdue");
    paymentBanner.innerText = "Pago vencido: no podrás agendar nuevas clases hasta regularizar.";
  } else {
    paymentBanner.classList.add("hidden");
  }

  if (userEnrollments.length === 0) {
    list.innerHTML = '<p class="muted">Aún no tienes clases agendadas.</p>';
    return;
  }

  userEnrollments.forEach(cls => {
    const item = document.createElement("div");
    item.className = "info-card";
    item.style.marginBottom = "10px";
    item.innerHTML = `
      <h3>${cls.class}</h3>
      <p><strong>Día:</strong> ${cls.day}</p>
      <p><strong>Hora:</strong> ${cls.time}</p>
      <p class="muted">Instructor: ${cls.instructor}</p>
    `;
    list.appendChild(item);
  });
}

async function toggleReservation(classId) {
  const cls = scheduleData.find(c => c.id === classId);
  const planLimit = getWeeklyLimitForStudent(currentUser);
  const currentCount = getUserWeeklyCount(currentUser);

  if (cls.openMatOnly && !isOpenMatEligible(currentUser)) {
    showToast("Esta clase es exclusiva para alumnos de Jiu Jitsu.");
    return;
  }

  if (currentUser.paymentStatus === "vencido") {
    showToast("No puedes reservar con pago vencido.");
    return;
  }

  if (cls.enrolled.some(u => u.name === currentUser.name)) {
    cls.enrolled = cls.enrolled.filter(u => u.name !== currentUser.name);
    showToast(`Cancelaste tu asistencia a ${cls.class}`);
  } else {
    if (isReservationClosed(cls)) {
      showToast("Reservas cerradas: debes agendar con al menos 1 hora de anticipación.");
      return;
    }
    if (cls.countsTowardLimit !== false && planLimit > 0 && currentCount >= planLimit) {
      showToast(`¡Límite alcanzado! Tu plan permite ${planLimit} clases por semana.`);
      return;
    }
    if (cls.enrolled.length >= cls.capacity) {
      showToast("La clase está llena.");
      return;
    }
    cls.enrolled.push({ name: currentUser.name, plan: currentUser.plan });
    showToast(`¡Reservado para ${cls.class}!`);
  }

  const currentWeek = cachedEnrollments;
  currentWeek[cls.id] = cls.enrolled;
  await setCurrentWeekEnrollments(currentWeek);
  await renderCalendar();
}

async function cargarResumenAdmin() {
  const totalAlumnos = document.getElementById("total-alumnos");
  if (!totalAlumnos) {
    return;
  }

  const students = cachedStudents.length ? cachedStudents : await loadStudents();
  totalAlumnos.innerText = students.length;
  document.getElementById("total-pendiente").innerText = students.filter(s => s.paymentStatus === "pendiente").length;
  document.getElementById("total-vencido").innerText = students.filter(s => s.paymentStatus === "vencido").length;
  document.getElementById("total-pagados").innerText = students.filter(s => s.paymentStatus === "pagado").length;

  const counts = students.reduce((acc, s) => {
    acc[s.discipline] = (acc[s.discipline] || 0) + 1;
    return acc;
  }, {});

  const list = document.getElementById("disciplinas-count");
  list.innerHTML = "";
  Object.entries(counts).forEach(([disc, count]) => {
    const li = document.createElement("li");
    li.innerText = `${disc}: ${count}`;
    list.appendChild(li);
  });
}

async function cargarSolicitudesTrialAdmin() {
  const container = document.getElementById("admin-trial-list");
  const requests = cachedTrialRequests.length ? cachedTrialRequests : await loadTrialRequests();
  container.innerHTML = "";

  if (requests.length === 0) {
    container.innerHTML = '<p class="muted">No hay solicitudes registradas.</p>';
    return;
  }

  requests.forEach(req => {
    const item = document.createElement("div");
    const formattedDate = req.fecha ? new Date(req.fecha).toLocaleString("es-CL") : "Sin fecha";
    const planOptions = getPlanOptionsForDiscipline(req.disciplina);
    item.className = "info-card";
    item.style.marginBottom = "10px";
    item.innerHTML = `
      <h3>${req.nombre}</h3>
      <p><strong>Disciplina:</strong> ${req.disciplina || "-"}</p>
      <p><strong>Teléfono:</strong> ${req.telefono || "-"}</p>
      <p><strong>Email:</strong> ${req.email || "-"}</p>
      <p class="muted">Registrado: ${formattedDate}</p>
      <div class="form-group" style="margin-top:10px;">
        <label>Plan a asignar</label>
        <select id="trial-plan-${req.id}" class="form-control">
          <option value="">Seleccionar plan</option>
          ${planOptions}
        </select>
      </div>
      <button class="btn-submit" style="margin-top:6px;" onclick="agregarAlumnoDesdeTrial('${req.id}')">Agregar alumno</button>
    `;
    container.appendChild(item);
  });
}

async function cargarClasesAgendadasAdmin() {
  const container = document.getElementById("admin-classes-list");
  if (!container) {
    return;
  }

  await hydrateScheduleEnrollments();
  container.innerHTML = "";

  const dayOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sabado"];
  const scheduled = scheduleData.filter(cls => cls.enrolled.length > 0);

  if (scheduled.length === 0) {
    container.innerHTML = '<p class="muted">No hay clases agendadas esta semana.</p>';
    return;
  }

  const grid = document.createElement("div");
  grid.className = "admin-weekly-grid";

  dayOrder.forEach(day => {
    const dayClasses = scheduled.filter(cls => cls.day === day);
    if (dayClasses.length === 0) {
      return;
    }
    const dayCard = document.createElement("div");
    dayCard.className = "admin-day-card";
    dayCard.innerHTML = `<h4>${day}</h4>`;

    dayClasses.forEach(cls => {
      const attendees = cls.enrolled.map(u => u.name).join(", ") || "Sin alumnos";
      const attendeeCount = cls.enrolled.length;
      const item = document.createElement("div");
      item.className = "admin-class-item";
      item.innerHTML = `
        <strong>${cls.time} - ${cls.class}</strong>
        <span class="muted">${cls.instructor}</span><br>
        <span>Alumnos (${attendeeCount}): ${attendees}</span>
      `;
      dayCard.appendChild(item);
    });

    grid.appendChild(dayCard);
  });

  container.appendChild(grid);
}

async function agregarAlumnoDesdeTrial(requestId) {
  const requests = cachedTrialRequests.length ? cachedTrialRequests : await loadTrialRequests();
  const request = requests.find(req => req.id === requestId);
  if (!request) {
    showToast("Solicitud no encontrada.");
    return;
  }

  const planSelect = document.getElementById(`trial-plan-${requestId}`);
  const planValue = planSelect ? planSelect.value : "";
  if (!planValue) {
    showToast("Selecciona un plan para continuar.");
    return;
  }

  const students = cachedStudents.length ? cachedStudents : await loadStudents();
  const discipline = request.disciplina || "Sin disciplina";
  const accessCode = generateAccessCode({ discipline });
  const newStudent = {
    id: `s${Date.now()}`,
    uid: generateStudentUid(),
    name: request.nombre,
    discipline,
    plan: planValue,
    paymentStatus: "pendiente",
    phone: request.telefono || "",
    email: request.email || "",
    paymentDue: new Date().toISOString().split("T")[0],
    accessCode
  };

  students.push(newStudent);
  await saveStudents(students);
  await saveTrialRequests(requests.filter(req => req.id !== requestId));
  showToast(`Alumno ${newStudent.name} agregado.`);
  notifyStudentAccess(newStudent);
  await cargarSolicitudesTrialAdmin();
  await cargarAlumnosAdmin();
}

async function cargarPlanClasesAdmin(discipline) {
  await hydrateScheduleEnrollments();
  const container = document.getElementById("admin-weekly-plan");
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sabado"];
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "admin-weekly-grid";

  days.forEach(day => {
    const dayCard = document.createElement("div");
    dayCard.className = "admin-day-card";
    dayCard.innerHTML = `<h4>${day}</h4>`;

    const dayClasses = scheduleData.filter(cls => {
      if (cls.day !== day) return false;
      if (discipline === "OpenMAT") return cls.openMatOnly;
      if (discipline === "Jiu Jitsu") return cls.class === discipline || cls.openMatOnly;
      return cls.class === discipline;
    });
    if (dayClasses.length === 0) {
      dayCard.innerHTML += '<p class="muted">Sin clases</p>';
    } else {
      dayClasses.forEach(cls => {
        const attendees = cls.enrolled.map(u => u.name).join(", ") || "Sin alumnos";
        const attendeeCount = cls.enrolled.length;
        const item = document.createElement("div");
        item.className = "admin-class-item";
        item.innerHTML = `
          <strong>${cls.time} - ${cls.class}</strong>
          <span class="muted">${cls.instructor}</span><br>
          <span>Alumnos (${attendeeCount}): ${attendees}</span>
        `;
        dayCard.appendChild(item);
      });
    }

    grid.appendChild(dayCard);
  });

  container.appendChild(grid);
}

function setAdminWeekDiscipline(discipline) {
  const title = document.querySelector("#admin-weekly-plan-modal .modal-header h3");
  if (title) {
    title.innerText = `Plan Semanal: ${discipline}`;
  }
  cargarPlanClasesAdmin(discipline);
}

function getPlanOptionsForDiscipline(discipline) {
  const plans = DISCIPLINE_PLANS[discipline] || [];
  if (plans.length === 0) {
    return '<option value="PRUEBA">Clase de prueba</option>';
  }
  return plans.map(planKey => `<option value="${planKey}">${PLAN_CONFIG[planKey]?.label || planKey}</option>`).join("");
}

async function cargarClasesPorDisciplinaAdmin() {
  await hydrateScheduleEnrollments();
  const container = document.getElementById("admin-disciplines-classes");
  const counts = scheduleData.reduce((acc, cls) => {
    acc[cls.class] = (acc[cls.class] || 0) + cls.enrolled.length;
    return acc;
  }, {});

  container.innerHTML = "";
  Object.entries(counts).forEach(([disc, count]) => {
    const row = document.createElement("div");
    row.innerHTML = `<strong>${disc}</strong>: ${count} alumnos agendados`;
    row.style.marginBottom = "6px";
    container.appendChild(row);
  });
}

async function cargarAlumnosNoPagadosAdmin() {
  const students = cachedStudents.length ? cachedStudents : await loadStudents();
  const container = document.getElementById("admin-unpaid-list");
  const total = document.getElementById("admin-unpaid-total");
  if (!container || !total) {
    return;
  }
  const unpaid = students.filter(student => student.paymentStatus !== "pagado");
  const paid = students.filter(student => student.paymentStatus === "pagado");

  document.getElementById("admin-total-students").innerText = students.length;
  document.getElementById("admin-paid-total").innerText = paid.length;

  total.innerText = unpaid.length;
  container.innerHTML = "";

  if (unpaid.length === 0) {
    container.innerHTML = '<p class="muted">Sin alumnos pendientes o vencidos.</p>';
    return;
  }

  unpaid.forEach(student => {
    const statusText = student.paymentStatus === "pendiente" ? "Pendiente" : "Vencido";
    const statusClass = student.paymentStatus === "pendiente" ? "status-pending" : "status-overdue";
    const card = document.createElement("div");
    card.className = "info-card";
    card.style.marginBottom = "10px";
    card.innerHTML = `
      <h3>${student.name}</h3>
      <p><strong>Disciplina:</strong> ${student.discipline}</p>
      <p><strong>Plan:</strong> ${PLAN_CONFIG[student.plan]?.label || student.plan}</p>
      <p><span class="status-pill ${statusClass}">${statusText}</span></p>
      <button class="btn-paid" style="margin-top:8px;" onclick="actualizarPago('${student.id}', 'pagado')">Marcar como Pagado</button>
    `;
    container.appendChild(card);
  });
}

function createAdminStudentsTableHead() {
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Nombre</th>
      <th>Disciplina</th>
      <th>Plan</th>
      <th>Clave</th>
      <th>Clases Semana</th>
      <th>Límite semanal</th>
      <th>Estado Pago</th>
      <th>Acción</th>
    </tr>
  `;
  return thead;
}

function createAdminStudentRow(student, enrollments) {
  const classCount = Object.values(enrollments).filter(list =>
    list.some(enrolled => enrolled.name === student.name)
  ).length;
  const planLimit = PLAN_CONFIG[student.plan]?.weeklyLimit || 0;
  const overrideValue = typeof student.weeklyLimitOverride === "number"
    ? student.weeklyLimitOverride
    : "";
  const statusClass = student.paymentStatus === "pagado"
    ? "status-paid"
    : student.paymentStatus === "pendiente"
      ? "status-pending"
      : "status-overdue";
  const statusText = student.paymentStatus === "pagado"
    ? "Pagado"
    : student.paymentStatus === "pendiente"
      ? "Pendiente"
      : "Vencido";
  const accessKey = student.accessCode || student.name;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${student.name}</td>
    <td>${student.discipline}</td>
    <td>${PLAN_CONFIG[student.plan]?.label || student.plan}</td>
    <td><span class="admin-key-pill">${accessKey}</span></td>
    <td>${classCount}</td>
    <td>
      <div class="admin-inline">
        <input type="number" min="0" class="form-control" id="limit-${student.id}" value="${overrideValue}">
        <button class="btn-login" onclick="actualizarLimiteSemanal('${student.id}')">Guardar</button>
      </div>
      <span class="admin-helper">Plan: ${planLimit} clases</span>
    </td>
    <td><span class="status-pill ${statusClass}">${statusText}</span></td>
    <td class="admin-actions">
      <button class="btn-paid" onclick="actualizarPago('${student.id}', 'pagado')">Pagado</button>
      <button class="btn-pending" onclick="actualizarPago('${student.id}', 'pendiente')">Pendiente</button>
      <button class="btn-overdue" onclick="actualizarPago('${student.id}', 'vencido')">Vencido</button>
      <button class="btn-overdue" onclick="eliminarAlumno('${student.id}')">Eliminar</button>
    </td>
  `;
  return row;
}

function buildAdminStudentsSection(title, students, enrollments) {
  const section = document.createElement("div");
  section.className = "admin-students-section";
  const heading = document.createElement("h4");
  heading.textContent = title;
  section.appendChild(heading);

  if (students.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-students-empty";
    empty.textContent = "Sin alumnos registrados.";
    section.appendChild(empty);
    return section;
  }

  const table = document.createElement("table");
  table.className = "admin-table";
  table.appendChild(createAdminStudentsTableHead());
  const tbody = document.createElement("tbody");
  students.forEach(student => {
    tbody.appendChild(createAdminStudentRow(student, enrollments));
  });
  table.appendChild(tbody);
  section.appendChild(table);
  return section;
}

async function cargarAlumnosAdmin() {
  const students = cachedStudents.length ? cachedStudents : await loadStudents();
  const enrollments = cachedEnrollments || await getCurrentWeekEnrollments();
  const container = document.getElementById("admin-alumnos-container");
  container.innerHTML = "";

  if (students.length === 0) {
    container.innerHTML = '<p class="muted">Sin alumnos registrados.</p>';
    return;
  }

  const disciplineLabels = {
    "Jiu Jitsu": "Jiu-Jitsu",
    "Kick Boxing": "Kickboxing",
    "Judo": "Judo"
  };
  const disciplineOrder = ["Jiu Jitsu", "Kick Boxing", "Judo"];
  const grouped = new Map();
  disciplineOrder.forEach(discipline => grouped.set(discipline, []));

  students.forEach(student => {
    const rawDiscipline = student.discipline?.trim() || "Otros";
    const key = grouped.has(rawDiscipline) ? rawDiscipline : rawDiscipline;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(student);
  });

  const extraDisciplines = Array.from(grouped.keys())
    .filter(key => !disciplineOrder.includes(key))
    .sort((a, b) => a.localeCompare(b));

  [...disciplineOrder, ...extraDisciplines].forEach(discipline => {
    const list = grouped.get(discipline) || [];
    const label = disciplineLabels[discipline] || discipline;
    const title = `Alumnos de ${label}`;
    container.appendChild(buildAdminStudentsSection(title, list, enrollments));
  });
}

async function actualizarLimiteSemanal(studentId) {
  const input = document.getElementById(`limit-${studentId}`);
  if (!input) {
    showToast("Campo de límite no encontrado.");
    return;
  }
  const rawValue = input.value.trim();
  const parsedValue = rawValue === "" ? null : Number(rawValue);
  if (parsedValue !== null && (!Number.isFinite(parsedValue) || parsedValue < 0)) {
    showToast("Ingresa un número válido.");
    return;
  }

  const students = cachedStudents.length ? cachedStudents : await loadStudents();
  const updated = students.map(student => {
    if (student.id !== studentId) return student;
    const nextData = { ...student };
    if (parsedValue === null) {
      delete nextData.weeklyLimitOverride;
    } else {
      nextData.weeklyLimitOverride = parsedValue;
    }
    return nextData;
  });
  await saveStudents(updated);
  if (currentUser && currentUser.id === studentId) {
    if (parsedValue === null) {
      delete currentUser.weeklyLimitOverride;
    } else {
      currentUser.weeklyLimitOverride = parsedValue;
    }
  }
  await cargarAlumnosAdmin();
  showToast("Límite semanal actualizado.");
}

async function eliminarAlumno(studentId) {
  const students = cachedStudents.length ? cachedStudents : await loadStudents();
  const student = students.find(item => item.id === studentId);
  if (!student) {
    showToast("Alumno no encontrado.");
    return;
  }
  if (!confirm(`¿Eliminar a ${student.name}?`)) {
    return;
  }
  const updated = students.filter(item => item.id !== studentId);
  await saveStudents(updated);
  await cargarResumenAdmin();
  await cargarAlumnosAdmin();
  await cargarAlumnosNoPagadosAdmin();
  showToast("Alumno eliminado.");
}

async function actualizarPago(studentId, status) {
  const students = cachedStudents.length ? cachedStudents : await loadStudents();
  const updated = students.map(student =>
    student.id === studentId ? { ...student, paymentStatus: status } : student
  );
  await saveStudents(updated);
  if (currentUser && currentUser.id === studentId) {
    currentUser.paymentStatus = status;
  }
  await cargarResumenAdmin();
  await cargarAlumnosAdmin();
  await cargarAlumnosNoPagadosAdmin();
  showToast("Estado de pago actualizado");
}

function actualizarPlanesDisponibles() {
  const discipline = document.getElementById("new-disciplina").value;
  const planSelect = document.getElementById("new-plan");
  const options = getPlanOptionsForDiscipline(discipline);
  planSelect.innerHTML = `<option value="">Seleccionar plan</option>${options}<option value="PRUEBA">Clase de prueba</option>`;
}

async function registrarNuevoAlumno(e) {
  e.preventDefault();
  const students = cachedStudents.length ? cachedStudents : await loadStudents();
  const discipline = document.getElementById("new-disciplina").value;
  const name = document.getElementById("new-nombre").value.trim();
  const accessCode = generateAccessCode({ discipline });
  const newStudent = {
    id: `s${Date.now()}`,
    uid: generateStudentUid(),
    name,
    discipline,
    plan: document.getElementById("new-plan").value,
    paymentStatus: "pendiente",
    phone: document.getElementById("new-telefono").value.trim(),
    email: document.getElementById("new-email").value.trim(),
    paymentDue: new Date().toISOString().split("T")[0],
    accessCode
  };

  students.push(newStudent);
  await saveStudents(students);
  document.getElementById("new-alumno-result").innerText = `Alumno ${newStudent.name} registrado. Clave de acceso: ${accessCode} (puedes usar el nombre como clave temporal).`;
  notifyStudentAccess(newStudent);
  document.getElementById("form-new-alumno").reset();
  await cargarResumenAdmin();
  await cargarAlumnosAdmin();
  await cargarAlumnosNoPagadosAdmin();
}

async function loadMeta() {
  if (!isFirebaseConfigured()) {
    return { id: META_ID };
  }
  const db = getFirebaseDb();
  const snapshot = await get(ref(db, `meta/${META_ID}`));
  if (!snapshot.exists()) {
    return { id: META_ID };
  }
  return snapshot.val();
}

async function saveMeta(meta) {
  if (!isFirebaseConfigured()) {
    return;
  }
  const db = getFirebaseDb();
  await set(ref(db, `meta/${META_ID}`), meta);
}

async function runWeeklyReset(meta) {
  const today = new Date();
  if (today.getDay() !== 0) {
    return meta;
  }
  const weekKey = getWeekKey(today);
  if (meta.lastWeeklyReset === weekKey) {
    return meta;
  }
  await setCurrentWeekEnrollments({});
  const updatedMeta = { ...meta, lastWeeklyReset: weekKey };
  await saveMeta(updatedMeta);
  cachedEnrollments = {};
  return updatedMeta;
}

async function runMonthlyPaymentReset(meta) {
  const today = new Date();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  if (today.getDate() === 1 && meta.lastPaymentResetMonth !== monthKey) {
    const students = await loadStudents();
    const resetStudents = students.map(student => ({
      ...student,
      paymentStatus: "pendiente",
      paymentDue: today.toISOString().split("T")[0]
    }));
    await saveStudents(resetStudents);
    meta.lastPaymentResetMonth = monthKey;
    await saveMeta({ ...meta, lastPaymentResetMonth: monthKey });
  }

  if (today.getDate() > 5 && meta.lastPaymentOverdueMonth !== monthKey) {
    const students = await loadStudents();
    const overdueStudents = students.map(student =>
      student.paymentStatus === "pendiente"
        ? { ...student, paymentStatus: "vencido" }
        : student
    );
    await saveStudents(overdueStudents);
    meta.lastPaymentOverdueMonth = monthKey;
    await saveMeta({ ...meta, lastPaymentOverdueMonth: monthKey });
  }

  return meta;
}

async function runMaintenance() {
  let meta = await loadMeta();
  meta = await runWeeklyReset(meta);
  await runMonthlyPaymentReset(meta);
}

function refreshCurrentUser(students) {
  if (!currentUser || currentUser.role !== "member") {
    return;
  }
  const updated = students.find(student => student.id === currentUser.id);
  if (updated) {
    currentUser = { ...currentUser, ...updated };
  }
}

function isModalOpen(id) {
  const modal = document.getElementById(id);
  return modal ? modal.classList.contains("open") : false;
}

function listenToRealtimeUpdates() {
  if (!isFirebaseConfigured()) {
    return;
  }
  const db = getFirebaseDb();
  const weekKey = getWeekKey();

  onValue(ref(db, "students"), async snapshot => {
    const data = snapshot.exists() ? snapshot.val() : {};
    const students = Object.values(data || {});
    const { normalized, updated } = ensureStudentUids(students);
    if (updated) {
      await saveStudents(normalized);
      return;
    }
    cachedStudents = normalized;
    refreshCurrentUser(normalized);
    if (isAdmin) {
      await cargarResumenAdmin();
      await cargarAlumnosAdmin();
      await cargarAlumnosNoPagadosAdmin();
    }
    if (isModalOpen("profile-modal")) {
      abrirPerfil();
    }
    if (isModalOpen("payment-modal")) {
      cargarEstadoPagoUsuario();
    }
    if (isModalOpen("calendar-modal")) {
      await renderCalendar();
    }
    if (isModalOpen("my-classes-modal")) {
      await renderMisClases();
    }
  });

  onValue(ref(db, "trial_requests"), async snapshot => {
    const data = snapshot.exists() ? snapshot.val() : {};
    cachedTrialRequests = Object.values(data || {});
    if (isAdmin && isModalOpen("admin-trial-modal")) {
      await cargarSolicitudesTrialAdmin();
    }
  });

  onValue(ref(db, `weekly_enrollments/${weekKey}`), async snapshot => {
    const enrollments = snapshot.exists() ? snapshot.val().enrollments || {} : {};
    applyEnrollmentsToSchedule(enrollments);
    if (isModalOpen("calendar-modal")) {
      await renderCalendar();
    }
    if (isModalOpen("my-classes-modal")) {
      await renderMisClases();
    }
    if (isAdmin) {
      await cargarClasesAgendadasAdmin();
      await cargarClasesPorDisciplinaAdmin();
      await cargarAlumnosAdmin();
    }
  });
}

async function init() {
  renderCards();
  updatePublicButtons();
  try {
    if (!isFirebaseConfigured()) {
      showToast("Configura Firebase para cargar datos reales.");
    }
    await runMaintenance();
    cachedStudents = await loadStudents();
    cachedTrialRequests = await loadTrialRequests();
    await hydrateScheduleEnrollments();
    listenToRealtimeUpdates();
  } catch (error) {
    console.error("Error cargando datos iniciales:", error);
    cachedStudents = cachedStudents.length ? cachedStudents : [...DEFAULT_STUDENTS];
    cachedTrialRequests = cachedTrialRequests.length ? cachedTrialRequests : [];
    scheduleData.forEach(cls => {
      if (!Array.isArray(cls.enrolled)) {
        cls.enrolled = [];
      }
    });
  }
  updatePublicButtons();

  const disciplineSelect = document.getElementById("new-disciplina");
  if (disciplineSelect) {
    disciplineSelect.addEventListener("change", actualizarPlanesDisponibles);
  }

  const newStudentForm = document.getElementById("form-new-alumno");
  if (newStudentForm) {
    newStudentForm.addEventListener("submit", registrarNuevoAlumno);
  }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.openTrialModal = openTrialModal;
window.openLoginModal = openLoginModal;
window.openPublicSchedule = openPublicSchedule;
window.submitTrial = submitTrial;
window.handleLogin = handleLogin;
window.abrirMisClases = abrirMisClases;
window.abrirCalendario = abrirCalendario;
window.abrirEstadoPago = abrirEstadoPago;
window.abrirPerfil = abrirPerfil;
window.abrirClasesAgendadasAdmin = abrirClasesAgendadasAdmin;
window.abrirClasesSemanaAdmin = abrirClasesSemanaAdmin;
window.abrirAlumnosInscritosAdmin = abrirAlumnosInscritosAdmin;
window.abrirAgregarAlumnoAdmin = abrirAgregarAlumnoAdmin;
window.cerrarSesion = cerrarSesion;
window.actualizarClaveAcceso = actualizarClaveAcceso;
window.setAdminWeekDiscipline = setAdminWeekDiscipline;
window.toggleReservation = toggleReservation;
window.actualizarPago = actualizarPago;
window.eliminarAlumno = eliminarAlumno;
window.actualizarLimiteSemanal = actualizarLimiteSemanal;
window.agregarAlumnoDesdeTrial = agregarAlumnoDesdeTrial;

init();
