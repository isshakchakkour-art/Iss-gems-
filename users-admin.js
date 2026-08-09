/* =========================================================
   Story Hub
   Users Admin Module
   عرض حسابات المستخدمين المسجَّلين + حظر/إلغاء حظر
   ========================================================= */

import {
    ref as dbRef,
    get as dbGet,
    update as dbUpdate
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    database
} from "./database.js";


function userIsAdmin() {

    return Boolean(
        window.StoryHubAuth &&
        window.StoryHubAuth.isAdmin()
    );
}


/* =========================================================
   قراءة كل المستخدمين المسجَّلين (من ملفاتهم في RTDB،
   المُنشأة تلقائيًا عند التسجيل عبر auth.js)
   ========================================================= */

async function fetchAllUsers() {

    const snapshot =
        await dbGet(
            dbRef(database, "users")
        );

    if (!snapshot.exists()) {
        return [];
    }

    const data =
        snapshot.val();

    return Object.entries(data)
        .map(([uid, profile]) => ({ uid, ...profile }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}


/* =========================================================
   تبديل حالة الحظر لمستخدم
   ========================================================= */

async function toggleUserBan(uid, banned) {

    if (!userIsAdmin()) {

        throw new Error(
            "لا تملك صلاحية إدارة المستخدمين."
        );
    }

    await dbUpdate(
        dbRef(database, "users/" + uid),
        { banned }
    );
}


/* =========================================================
   عرض صفحة إدارة المستخدمين
   ========================================================= */

async function renderUsersPage(container) {

    if (!userIsAdmin()) {
        return;
    }

    container.innerHTML = `
        <section class="games-section">

            <h1>👥 إدارة المستخدمين</h1>

            <div id="usersList">
                <p>جاري تحميل قائمة المستخدمين...</p>
            </div>

        </section>
    `;

    const listBox =
        container.querySelector("#usersList");

    let users;

    try {

        users =
            await fetchAllUsers();

    } catch (error) {

        console.error(
            "❌ Story Hub Users: تعذّرت قراءة المستخدمين.",
            error
        );

        listBox.innerHTML =
            "<p>تعذّر تحميل قائمة المستخدمين.</p>";

        return;
    }

    if (users.length === 0) {

        listBox.innerHTML =
            "<p>لا يوجد مستخدمون مسجّلون بعد.</p>";

        return;
    }

    listBox.innerHTML =
        users.map(renderUserRow).join("");

    listBox.querySelectorAll(".toggle-ban-btn")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const uid =
                    button.dataset.uid;

                const currentlyBanned =
                    button.dataset.banned === "true";

                button.disabled =
                    true;

                try {

                    await toggleUserBan(uid, !currentlyBanned);

                    renderUsersPage(container);

                } catch (error) {

                    console.error(
                        "❌ Story Hub Users: خطأ أثناء تحديث الحظر.",
                        error
                    );

                    button.disabled =
                        false;
                }
            });
        });
}


function renderUserRow(user) {

    const isBanned =
        Boolean(user.banned);

    const isAdminAccount =
        Boolean(user.admin);

    const date =
        user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("ar-EG", {
                year: "numeric", month: "long", day: "numeric"
            })
            : "غير معروف";

    return `
        <div class="user-row ${isBanned ? "user-row-banned" : ""}">

            <div class="user-row-info">

                <strong>${escapeHTML(user.email || "بدون بريد")}</strong>

                <span class="user-row-meta">
                    ${isAdminAccount ? "👑 مسؤول — " : ""}
                    انضم بتاريخ: ${date}
                    ${isBanned ? " — 🚫 محظور" : ""}
                </span>

            </div>

            ${isAdminAccount
                ? ""
                : `<button
                    type="button"
                    class="btn-${isBanned ? "secondary" : "danger"} toggle-ban-btn"
                    data-uid="${user.uid}"
                    data-banned="${isBanned}"
                   >
                    ${isBanned ? "إلغاء الحظر" : "حظر المستخدم"}
                   </button>`
            }

        </div>
    `;
}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;
}


window.StoryHubUsers = {

    renderUsersPage

};
