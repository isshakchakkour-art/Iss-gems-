// ============================================================
// Story Hub - Firebase Database Configuration
// database.js
// ============================================================


// ============================================================
// 1. Firebase App
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";


// ============================================================
// 2. Firebase Authentication
// ============================================================

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ============================================================
// 3. Firestore
// ============================================================

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// 4. Realtime Database
// ============================================================

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";


// ============================================================
// ملاحظة: تم إلغاء استخدام Firebase Storage نهائيًا.
//
// منذ 3 فبراير 2026 غيّرت Google سياستها: أصبح Cloud Storage
// يتطلب خطة Blaze (بطاقة بنكية مربوطة) حتى ضمن الاستخدام
// المجاني. للبقاء على خطة Spark المجانية بالكامل، أكواد
// الألعاب (HTML/CSS/JS) تُخزَّن كنصوص مباشرة داخل Realtime
// Database، وصور الألعاب تُستخدم كروابط خارجية بدل رفعها.
// ============================================================


// ============================================================
// 5. Firebase Configuration
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyD_-VRqXhd-fjhJ0wf0h8EfjER8VfNMRmY",

    authDomain:
        "story-hub-1cd66.firebaseapp.com",

    databaseURL:
        "https://story-hub-1cd66-default-rtdb.europe-west1.firebasedatabase.app",

    projectId:
        "story-hub-1cd66",

    storageBucket:
        "story-hub-1cd66.firebasestorage.app",

    messagingSenderId:
        "500682553975",

    appId:
        "1:500682553975:web:eb633add13cdf93572e472",

    measurementId:
        "G-40N91V62JB"
};


// ============================================================
// 6. تشغيل Firebase
// ============================================================

const app =
    initializeApp(firebaseConfig);


// ============================================================
// 7. Authentication
// ============================================================

const auth =
    getAuth(app);


// ============================================================
// 8. Firestore
// ============================================================

const db =
    getFirestore(app);


// ============================================================
// 9. Realtime Database
// ============================================================

const database =
    getDatabase(app);


// ============================================================
// 10. اسم بديل للتوافق مع الملفات الجديدة
// ============================================================

const realtimeDatabase =
    database;


// ============================================================
// 11. UID المسؤول
// ============================================================

const ADMIN_UID =
    "T4quVWpCxzPHBHmAjD1lHJfs3cr1";


// ============================================================
// 12. التحقق من المسؤول
// ============================================================

function isAdmin(user) {

    if (!user) {
        return false;
    }

    return user.uid === ADMIN_UID;
}


// ============================================================
// 13. تصدير جميع الخدمات
// ============================================================
//
// database = Realtime Database
//
// db = Firestore
//
// auth = Firebase Authentication
//
// ============================================================

export {

    app,

    auth,

    db,

    database,

    realtimeDatabase,

    ADMIN_UID,

    isAdmin

};


// ============================================================
// 14. رسائل التشغيل
// ============================================================

console.log(
    "🔥 Story Hub: Firebase تم تشغيله بنجاح."
);

console.log(
    "🔥 Story Hub: Authentication جاهز."
);

console.log(
    "🔥 Story Hub: Firestore جاهز."
);

console.log(
    "🔥 Story Hub: Realtime Database جاهز."
);

console.log(
    "👑 Story Hub: نظام Admin جاهز."
);


// ============================================================
// نهاية database.js
// ============================================================