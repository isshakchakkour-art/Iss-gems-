/* =========================================================
   Story Hub
   Authentication System
   تسجيل الدخول + إنشاء الحساب + تحديد المسؤول
   ========================================================= */


/* =========================================================
   Firebase Authentication
   ========================================================= */

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


/* =========================================================
   Firebase Realtime Database
   ========================================================= */

import {
    ref,
    set,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";


/* =========================================================
   Story Hub Database
   ========================================================= */

import {
    auth,
    database,
    ADMIN_UID,
    isAdmin as checkAdminByUID
} from "./database.js";


/* =========================================================
   إعدادات المسؤول

   ملاحظة: ADMIN_UID لم يعد يُعرَّف هنا محليًا،
   بل يُستورد من database.js كمصدر وحيد للحقيقة
   (Single Source of Truth) حتى لا يحدث تعارض
   إن تغيّر UID المسؤول مستقبلًا.
   ========================================================= */


/* =========================================================
   عناصر الصفحة
   ========================================================= */

const authScreen =
    document.getElementById("authScreen");

const authForm =
    document.getElementById("authForm");

const authTitle =
    document.getElementById("authTitle");

const authSubtitle =
    document.getElementById("authSubtitle");

const authSubmit =
    document.getElementById("authSubmit");

const authSwitch =
    document.getElementById("authSwitch");

const authSwitchText =
    document.getElementById("authSwitchText");

const authMessage =
    document.getElementById("authMessage");

const usernameGroup =
    document.getElementById("usernameGroup");

const usernameInput =
    document.getElementById("username");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const mainContent =
    document.getElementById("mainContent");


/* =========================================================
   حالة النظام
   ========================================================= */

let isRegisterMode = false;

let currentUser = null;

let currentUserData = null;

let currentIsAdmin = false;


/* =========================================================
   إظهار رسالة
   ========================================================= */

function showMessage(
    message,
    type = "info"
) {

    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        message;

    authMessage.className =
        `auth-message ${type}`;
}


/* =========================================================
   مسح الرسالة
   ========================================================= */

function clearMessage() {

    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        "";

    authMessage.className =
        "auth-message";
}


/* =========================================================
   رسائل Firebase
   ========================================================= */

function getFirebaseErrorMessage(error) {

    if (!error) {
        return "حدث خطأ غير معروف.";
    }

    switch (error.code) {

        case "auth/invalid-credential":
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

        case "auth/user-not-found":
            return "لا يوجد حساب بهذا البريد الإلكتروني.";

        case "auth/wrong-password":
            return "كلمة المرور غير صحيحة.";

        case "auth/email-already-in-use":
            return "هذا البريد الإلكتروني مستخدم بالفعل.";

        case "auth/weak-password":
            return "كلمة المرور ضعيفة. استخدم كلمة مرور أقوى.";

        case "auth/invalid-email":
            return "البريد الإلكتروني غير صالح.";

        case "auth/network-request-failed":
            return "تأكد من اتصال الإنترنت.";

        case "auth/too-many-requests":
            return "تمت محاولات كثيرة. حاول لاحقًا.";

        case "auth/user-disabled":
            return "تم تعطيل هذا الحساب.";

        default:
            return error.message ||
                "حدث خطأ أثناء العملية.";
    }
}


/* =========================================================
   الانتقال إلى التطبيق
   ========================================================= */

function showApplication() {

    if (authScreen) {

        authScreen.style.display =
            "none";
    }

    if (mainContent) {

        mainContent.style.display =
            "block";
    }
}


/* =========================================================
   إظهار شاشة تسجيل الدخول
   ========================================================= */

function showAuthentication() {

    if (authScreen) {

        authScreen.style.display =
            "flex";
    }

    if (mainContent) {

        mainContent.style.display =
            "none";
    }
}


/* =========================================================
   قراءة بيانات المستخدم من Realtime Database
   ========================================================= */

async function getUserData(uid) {

    if (!uid) {
        return null;
    }

    try {

        const userRef =
            ref(
                database,
                "users/" + uid
            );

        const snapshot =
            await get(userRef);

        if (!snapshot.exists()) {

            console.log(
                "Story Hub: لا توجد بيانات للمستخدم في قاعدة البيانات."
            );

            return null;
        }

        return snapshot.val();

    } catch (error) {

        console.error(
            "❌ Story Hub: خطأ أثناء قراءة بيانات المستخدم:",
            error
        );

        return null;
    }
}


/* =========================================================
   تحديد هل المستخدم مسؤول
   ========================================================= */

async function checkAdminStatus(user) {

    if (!user) {

        currentIsAdmin =
            false;

        return false;
    }


    /* -------------------------------------------------------
       الطريقة الأولى:
       فحص UID المسؤول
       ------------------------------------------------------- */

    if (checkAdminByUID(user)) {

        currentIsAdmin =
            true;

        console.log(
            "👑 Story Hub: تم التعرف على المسؤول الرئيسي."
        );

        return true;
    }


    /* -------------------------------------------------------
       الطريقة الثانية:
       فحص بيانات المستخدم في Realtime Database
       ------------------------------------------------------- */

    const userData =
        await getUserData(
            user.uid
        );

    currentUserData =
        userData;


    if (
        userData &&
        (
            userData.role === "admin" ||
            userData.isAdmin === true ||
            userData.admin === true
        )
    ) {

        currentIsAdmin =
            true;

        console.log(
            "👑 Story Hub: تم التعرف على مسؤول من قاعدة البيانات."
        );

        return true;
    }


    currentIsAdmin =
        false;

    return false;
}


/* =========================================================
   حفظ / تحديث بيانات المستخدم
   ========================================================= */

async function saveUserData(
    user,
    username = ""
) {

    if (!user) {
        return false;
    }

    try {

        const admin =
            checkAdminByUID(user);


        const userRef =
            ref(
                database,
                "users/" + user.uid
            );


        const existingSnapshot =
            await get(userRef);


        const existingData =
            existingSnapshot.exists()
                ? existingSnapshot.val()
                : {};


        await set(
            userRef,
            {

                uid:
                    user.uid,

                email:
                    user.email || "",

                username:
                    username ||
                    existingData.username ||
                    "",

                role:
                    admin
                        ? "admin"
                        : (
                            existingData.role ||
                            "user"
                        ),

                isAdmin:
                    admin,

                banned:
                    existingData.banned ||
                    false,

                createdAt:
                    existingData.createdAt ||
                    Date.now(),

                updatedAt:
                    Date.now()

            }
        );


        console.log(
            "🔥 Story Hub: تم حفظ بيانات المستخدم."
        );


        return true;

    } catch (error) {

        console.error(
            "❌ Story Hub: خطأ أثناء حفظ بيانات المستخدم:",
            error
        );

        return false;
    }
}


/* =========================================================
   طباعة معلومات المستخدم
   ========================================================= */

function logUserInformation(
    user,
    admin
) {

    console.log(
        "========================================"
    );

    console.log(
        "🔥 Story Hub"
    );

    console.log(
        "👤 المستخدم مسجل الدخول"
    );

    console.log(
        "📧 البريد الإلكتروني:",
        user.email
    );

    console.log(
        "🆔 UID الخاص بالمستخدم:",
        user.uid
    );

    console.log(
        "👑 Admin:",
        admin
    );


    if (admin) {

        console.log(
            "👑 تم التعرف على المسؤول"
        );

    } else {

        console.log(
            "👤 تم التعرف على مستخدم عادي"
        );
    }


    console.log(
        "========================================"
    );
}


/* =========================================================
   إظهار واجهة المسؤول
   ========================================================= */

function showAdminInterface() {

    console.log(
        "👑 Story Hub: تفعيل واجهة المسؤول."
    );


    /* -------------------------------------------------------
       تفعيل العناصر الخاصة بالمسؤول
       ------------------------------------------------------- */

    const adminButtons =
        document.querySelectorAll(
            "[data-admin-only]"
        );


    adminButtons.forEach(
        button => {

            button.style.setProperty(
                "display", "flex", "important"
            );

            button.removeAttribute(
                "disabled"
            );
        }
    );


    /* -------------------------------------------------------
       إضافة زر لوحة المسؤول
       ------------------------------------------------------- */

    const navigation =
        document.querySelector(
            ".navigation"
        );


    if (
        navigation &&
        !document.querySelector(
            '[data-page="admin"]'
        )
    ) {

        const adminButton =
            document.createElement(
                "button"
            );


        adminButton.type =
            "button";


        adminButton.className =
            "nav-button admin-nav-button";


        adminButton.dataset.page =
            "admin";


        adminButton.innerHTML = `
            <span class="nav-icon">👑</span>
            <span class="nav-text">لوحة المسؤول</span>
        `;


        navigation.appendChild(
            adminButton
        );


        adminButton.addEventListener(
            "click",
            () => {

                openAdminPanel();

            }
        );
    }
}


/* =========================================================
   إخفاء واجهة المسؤول
   ========================================================= */

function hideAdminInterface() {

    const adminButtons =
        document.querySelectorAll(
            "[data-admin-only]"
        );


    adminButtons.forEach(
        button => {

            button.style.display =
                "none";
        }
    );


    const adminButton =
        document.querySelector(
            ".admin-nav-button"
        );


    if (adminButton) {

        adminButton.remove();
    }
}


/* =========================================================
   لوحة المسؤول
   ========================================================= */

function openAdminPanel() {

    if (!currentIsAdmin) {

        console.warn(
            "⚠️ محاولة فتح لوحة المسؤول بدون صلاحية."
        );

        return;
    }


    if (!mainContent) {
        return;
    }


    mainContent.innerHTML = `

        <section class="admin-section">

            <div class="admin-header">

                <div class="admin-icon">
                    👑
                </div>

                <div>

                    <h1>
                        لوحة المسؤول
                    </h1>

                    <p>
                        مرحبًا بك في لوحة إدارة Story Hub
                    </p>

                </div>

            </div>


            <div class="admin-cards">

                <button
                    type="button"
                    class="admin-card"
                    id="adminCardGames"
                >

                    <div class="admin-card-icon">
                        🎮
                    </div>

                    <h2>
                        إدارة الألعاب
                    </h2>

                    <p>
                        إضافة وتعديل وحذف الألعاب.
                    </p>

                </button>


                <button
                    type="button"
                    class="admin-card"
                    id="adminCardNews"
                >

                    <div class="admin-card-icon">
                        📰
                    </div>

                    <h2>
                        إدارة الأخبار
                    </h2>

                    <p>
                        إضافة وتعديل آخر الأخبار.
                    </p>

                </button>


                <button
                    type="button"
                    class="admin-card"
                    id="adminCardUpdates"
                >

                    <div class="admin-card-icon">
                        🔄
                    </div>

                    <h2>
                        التحديثات
                    </h2>

                    <p>
                        إدارة تحديثات الألعاب.
                    </p>

                </button>


                <button
                    type="button"
                    class="admin-card"
                    id="adminCardUsers"
                >

                    <div class="admin-card-icon">
                        👥
                    </div>

                    <h2>
                        المستخدمون
                    </h2>

                    <p>
                        إدارة حسابات المستخدمين.
                    </p>

                </button>

            </div>

        </section>

    `;


    const gamesCard =
        mainContent.querySelector("#adminCardGames");

    if (gamesCard && window.StoryHubGames) {

        gamesCard.addEventListener("click", () => {

            window.StoryHubGames.renderGamesPage(mainContent);
        });
    }


    const newsCard =
        mainContent.querySelector("#adminCardNews");

    if (newsCard && window.StoryHubNews) {

        newsCard.addEventListener("click", () => {

            window.StoryHubNews.renderNewsPage(mainContent);
        });
    }


    const updatesCard =
        mainContent.querySelector("#adminCardUpdates");

    if (updatesCard && window.StoryHubGames) {

        updatesCard.addEventListener("click", () => {

            window.StoryHubGames.renderGamesPage(mainContent);
        });
    }


    const usersCard =
        mainContent.querySelector("#adminCardUsers");

    if (usersCard && window.StoryHubUsers) {

        usersCard.addEventListener("click", () => {

            window.StoryHubUsers.renderUsersPage(mainContent);
        });
    }
}


/* =========================================================
   تسجيل الدخول
   ========================================================= */

async function loginUser(
    email,
    password
) {

    try {

        showMessage(
            "جاري تسجيل الدخول...",
            "info"
        );


        const result =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            result.user;


        currentUser =
            user;


        /* ---------------------------------------------------
           التحقق من الحظر
           --------------------------------------------------- */

        const profileSnapshot =
            await get(
                ref(database, "users/" + user.uid)
            );

        if (profileSnapshot.exists() &&
            profileSnapshot.val().banned === true) {

            await signOut(auth);

            currentUser =
                null;

            showMessage(
                "🚫 تم حظر هذا الحساب من استخدام الموقع.",
                "error"
            );

            return null;
        }


        /* ---------------------------------------------------
           التحقق من المسؤول
           --------------------------------------------------- */

        const admin =
            await checkAdminStatus(
                user
            );


        /* ---------------------------------------------------
           تحديث بيانات المستخدم
           --------------------------------------------------- */

        await saveUserData(
            user
        );


        /* ---------------------------------------------------
           تسجيل المعلومات
           --------------------------------------------------- */

        logUserInformation(
            user,
            admin
        );


        if (admin) {

            showMessage(
                "👑 تم تسجيل الدخول كمسؤول.",
                "success"
            );

            showAdminInterface();

        } else {

            showMessage(
                "تم تسجيل الدخول بنجاح.",
                "success"
            );

            hideAdminInterface();
        }


        showApplication();


        return user;

    } catch (error) {

        console.error(
            "❌ Story Hub Authentication Error:",
            error
        );


        showMessage(
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );


        return null;
    }
}


/* =========================================================
   إنشاء حساب جديد
   ========================================================= */

async function registerUser(
    username,
    email,
    password
) {

    try {

        showMessage(
            "جاري إنشاء الحساب...",
            "info"
        );


        const result =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            result.user;


        currentUser =
            user;


        /* ---------------------------------------------------
           حفظ المستخدم في Realtime Database
           --------------------------------------------------- */

        await saveUserData(
            user,
            username
        );


        /* ---------------------------------------------------
           معرفة صلاحية المستخدم
           --------------------------------------------------- */

        const admin =
            await checkAdminStatus(
                user
            );


        currentIsAdmin =
            admin;


        /* ---------------------------------------------------
           تسجيل المعلومات
           --------------------------------------------------- */

        logUserInformation(
            user,
            admin
        );


        if (admin) {

            showMessage(
                "👑 تم إنشاء الحساب كمسؤول.",
                "success"
            );

            showAdminInterface();

        } else {

            showMessage(
                "تم إنشاء الحساب بنجاح.",
                "success"
            );

            hideAdminInterface();
        }


        showApplication();


        return user;

    } catch (error) {

        console.error(
            "❌ Story Hub Registration Error:",
            error
        );


        showMessage(
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );


        return null;
    }
}


/* =========================================================
   تسجيل الخروج
   ========================================================= */

async function logoutUser() {

    try {

        await signOut(
            auth
        );


        currentUser =
            null;

        currentUserData =
            null;

        currentIsAdmin =
            false;


        hideAdminInterface();

        showAuthentication();


        console.log(
            "🚪 Story Hub: تم تسجيل الخروج."
        );


    } catch (error) {

        console.error(
            "❌ Story Hub Logout Error:",
            error
        );
    }
}


/* =========================================================
   تبديل تسجيل الدخول / التسجيل
   ========================================================= */

function toggleAuthMode() {

    isRegisterMode =
        !isRegisterMode;


    clearMessage();


    if (isRegisterMode) {

        if (authTitle) {

            authTitle.textContent =
                "إنشاء حساب";
        }


        if (authSubtitle) {

            authSubtitle.textContent =
                "أنشئ حسابك في Story Hub";
        }


        if (authSubmit) {

            authSubmit.textContent =
                "إنشاء الحساب";
        }


        if (usernameGroup) {

            usernameGroup.style.display =
                "block";
        }


        if (usernameInput) {

            usernameInput.required =
                true;
        }


        if (authSwitchText) {

            authSwitchText.textContent =
                "لديك حساب بالفعل؟ تسجيل الدخول";
        }


    } else {

        if (authTitle) {

            authTitle.textContent =
                "تسجيل الدخول";
        }


        if (authSubtitle) {

            authSubtitle.textContent =
                "مرحبًا بك مرة أخرى في Story Hub";
        }


        if (authSubmit) {

            authSubmit.textContent =
                "تسجيل الدخول";
        }


        if (usernameGroup) {

            usernameGroup.style.display =
                "none";
        }


        if (usernameInput) {

            usernameInput.required =
                false;
        }


        if (authSwitchText) {

            authSwitchText.textContent =
                "ليس لديك حساب؟ إنشاء حساب";
        }
    }
}


/* =========================================================
   إرسال نموذج المصادقة
   ========================================================= */

if (authForm) {

    authForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            clearMessage();


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            const username =
                usernameInput
                    ? usernameInput.value.trim()
                    : "";


            if (!email) {

                showMessage(
                    "اكتب البريد الإلكتروني.",
                    "error"
                );

                return;
            }


            if (!password) {

                showMessage(
                    "اكتب كلمة المرور.",
                    "error"
                );

                return;
            }


            if (
                isRegisterMode &&
                !username
            ) {

                showMessage(
                    "اكتب اسم المستخدم.",
                    "error"
                );

                return;
            }


            if (isRegisterMode) {

                await registerUser(
                    username,
                    email,
                    password
                );

            } else {

                await loginUser(
                    email,
                    password
                );
            }

        }
    );
}


/* =========================================================
   زر تبديل الوضع
   ========================================================= */

if (authSwitch) {

    authSwitch.addEventListener(
        "click",
        toggleAuthMode
    );
}


/* =========================================================
   مراقبة حالة تسجيل الدخول
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            currentUser =
                null;

            currentUserData =
                null;

            currentIsAdmin =
                false;


            console.log(
                "Story Hub: لا يوجد مستخدم مسجل الدخول."
            );


            hideAdminInterface();

            showAuthentication();

            return;
        }


        /* ---------------------------------------------------
           يوجد مستخدم مسجل الدخول
           --------------------------------------------------- */

        currentUser =
            user;


        console.log(
            "========================================"
        );


        console.log(
            "🔥 Story Hub"
        );


        console.log(
            "👤 المستخدم مسجل الدخول"
        );


        console.log(
            "📧 البريد الإلكتروني:",
            user.email
        );


        console.log(
            "🆔 UID الخاص بالمستخدم:",
            user.uid
        );


        /* ---------------------------------------------------
           التحقق من المسؤول
           --------------------------------------------------- */

        const admin =
            await checkAdminStatus(
                user
            );


        currentIsAdmin =
            admin;


        /* ---------------------------------------------------
           تحديث بيانات المستخدم
           --------------------------------------------------- */

        await saveUserData(
            user
        );


        console.log(
            "👑 Admin:",
            admin
        );


        if (admin) {

            console.log(
                "👑 تم التعرف على المسؤول"
            );

            showAdminInterface();

        } else {

            console.log(
                "👤 تم التعرف على مستخدم عادي"
            );

            hideAdminInterface();
        }


        console.log(
            "========================================"
        );


        showApplication();

    }
);


/* =========================================================
   API عامة لملفات Story Hub
   ========================================================= */

window.StoryHubAuth = {

    getCurrentUser() {

        return currentUser;
    },


    isAdmin() {

        return currentIsAdmin;
    },


    getUserData() {

        return currentUserData;
    },


    logout() {

        return logoutUser();
    },


    openAdminPanel() {

        if (currentIsAdmin) {

            openAdminPanel();
        }
    }

};


/* =========================================================
   نهاية auth.js
   ========================================================= */