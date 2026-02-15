import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHAQjn4sTuR9FiGF3ljRrFEMZQjsx-SHg",
  authDomain: "apni-duniya-b53d7.firebaseapp.com",
  databaseURL: "https://apni-duniya-b53d7-default-rtdb.firebaseio.com",
  projectId: "apni-duniya-b53d7",
  storageBucket: "apni-duniya-b53d7.firebasestorage.app",
  messagingSenderId: "178853058918",
  appId: "1:178853058918:web:91dfaa5c5e41446da290a7",
  measurementId: "G-SW5SH1V2BB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ===== ELEMENTS ===== */
const popup = document.getElementById("notifPopup");
const bell = document.getElementById("openNotif");
const notifCount = document.getElementById("notifCount");
const notifList = document.getElementById("notifList");
const newNotice = document.getElementById("newNotice");
const oldNotice = document.getElementById("oldNotice");

const dialog = document.getElementById("confirmDialog");
const clearBtn = document.getElementById("clearNotif");

const menu = document.getElementById("sideMenu");
const overlay = document.getElementById("menuOverlay");

/* ===== MENU DRAWER ===== */
document.querySelector(".menu-icon").onclick = () => {
  menu.classList.add("active");
  overlay.classList.add("active");
  popup.style.display = "none";
};

overlay.onclick = () => {
  menu.classList.remove("active");
  overlay.classList.remove("active");
};

/* ===== TIME ===== */
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff <= 0) return "Just now";
  if (diff == 1) return "1 min";
  return diff + " min";
}

/* ===== POPUP ===== */
bell.onclick = (e) => {
  e.stopPropagation();
  popup.style.display = "block";
  notifCount.innerText = "0";
  bell.classList.remove("bell-blink");
};

document.addEventListener("click", (e) => {
  if (!popup.contains(e.target) && !bell.contains(e.target)) {
    popup.style.display = "none";
  }
});

/* ===== CONFIRM DIALOG ===== */
clearBtn.onclick = () => dialog.style.display = "flex";

document.getElementById("cancelClear").onclick = () => {
  dialog.style.display = "none";
};

document.getElementById("confirmClear").onclick = () => {
  remove(ref(db, "notifications"));
  dialog.style.display = "none";
};

/* ===== NOTIFICATION LOAD ===== */
let lastCount = 0;

onValue(ref(db, "notifications"), snap => {
  
  notifList.innerHTML = "";
  let total = 0;
  
  if (!snap.exists()) {
    notifList.innerHTML = `<div class="empty-msg">
No notification has been uploaded by M. M Public School yet.
</div>`;
    notifCount.innerText = "0";
    return;
  }
  
  snap.forEach(c => {
    const d = c.val();
    total++;
    
    notifList.innerHTML =
      `<div class="notif-item ${d.type}">
      ${d.text}
      <div class="time">${timeAgo(d.time)}</div>
    </div>` + notifList.innerHTML;
  });
  
  notifCount.innerText = total > 9 ? "9+" : total;
  
  /* 🔔 TELEGRAM STYLE ANIMATION */
  if (total > lastCount) {
    bell.classList.add("bell-blink");
    
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }
  
  lastCount = total;
  
});

/* ===== NEW NOTICE ===== */
onValue(ref(db, "notice/new"), snap => {
  
  newNotice.innerHTML = "";
  
  if (!snap.exists()) {
    newNotice.innerHTML = `<div class="empty-msg">
No notice has been uploaded by M. M Public School yet.
</div>`;
    return;
  }
  
  snap.forEach(c => {
    const d = c.val();
    newNotice.innerHTML =
      `<li>${d.text}<span class="time">${timeAgo(d.time)}</span></li>` +
      newNotice.innerHTML;
  });
});

/* ===== OLD NOTICE ===== */
onValue(ref(db, "notice/old"), snap => {
  
  oldNotice.innerHTML = "";
  
  if (!snap.exists()) {
    oldNotice.innerHTML = `<div class="empty-msg">
No notice has been uploaded by M. M Public School yet.
</div>`;
    return;
  }
  
  snap.forEach(c => {
    const d = c.val();
    oldNotice.innerHTML =
      `<li>${d.text}<span class="time">${timeAgo(d.time)}</span></li>` +
      oldNotice.innerHTML;
  });
});
