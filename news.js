/* =========================================================
   Story Hub
   News System
   نشر الأخبار (مسؤول) + عرضها لجميع المستخدمين
   ========================================================= */

import {
    ref as dbRef,
    get as dbGet,
    set as dbSet,
    push as dbPush,
    remove as dbRemove
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    database
} from "./database.js";

import {
    compressImageToDataURL
} from "./games.js";


function userIsAdmin() {

    return Boolean(
        window.StoryHubAuth &&
        window.StoryHubAuth.isAdmin()
    );
}


/* =========================================================
   قراءة كل الأخبار (الأحدث أولًا)
   ========================================================= */

async function fetchAllNews() {

    try {

        const snapshot =
            await dbGet(
                dbRef(database, "news")
            );

        if (!snapshot.exists()) {
            return [];
        }

        const data =
            snapshot.val();

        return Object.values(data)
            .sort((a, b) => b.createdAt - a.createdAt);

    } catch (error) {

        console.error(
            "❌ Story Hub News: تعذّرت قراءة الأخبار.",
            error
        );

        return [];
    }
}


/* =========================================================
   نشر خبر جديد
   ========================================================= */

async function publishNews({ title, content, imageFile }) {

    if (!userIsAdmin()) {

        throw new Error(
            "لا تملك صلاحية نشر الأخبار."
        );
    }

    const newsId =
        dbPush(
            dbRef(database, "news")
        ).key;

    let imageURL =
        "";

    if (imageFile) {

        imageURL =
            await compressImageToDataURL(imageFile, 640, 0.75);
    }

    const record = {

        id: newsId,
        title: title || "",
        content: content || "",
        imageURL,
        createdAt: Date.now()

    };

    await dbSet(
        dbRef(database, "news/" + newsId),
        record
    );

    return record;
}


/* =========================================================
   حذف خبر
   ========================================================= */

async function deleteNews(newsId) {

    if (!userIsAdmin()) {

        throw new Error(
            "لا تملك صلاحية حذف الأخبار."
        );
    }

    await dbRemove(
        dbRef(database, "news/" + newsId)
    );
}


/* =========================================================
   عرض صفحة الأخبار
   ========================================================= */

async function renderNewsPage(container) {

    container.innerHTML = `
        <section class="games-section">

            <div class="games-header">

                <h1>📰 آخر الأخبار</h1>

                ${userIsAdmin()
                    ? `<button type="button" class="btn-primary" id="openAddNewsForm">
                        + إضافة خبر
                       </button>`
                    : ""
                }

            </div>

            <div id="newsFormArea"></div>

            <div id="newsList">
                <p>جاري تحميل الأخبار...</p>
            </div>

        </section>
    `;

    const newsListBox =
        container.querySelector("#newsList");

    const newsItems =
        await fetchAllNews();

    if (newsItems.length === 0) {

        newsListBox.innerHTML =
            "<p>لا توجد أخبار حتى الآن.</p>";

    } else {

        newsListBox.innerHTML =
            newsItems.map(renderNewsCard).join("");
    }

    attachNewsEvents(container, newsItems);

    const addButton =
        container.querySelector("#openAddNewsForm");

    if (addButton) {

        addButton.addEventListener("click", () => {

            renderNewsForm(
                container.querySelector("#newsFormArea"),
                () => renderNewsPage(container)
            );
        });
    }
}


function renderNewsCard(item) {

    const date =
        new Date(item.createdAt)
            .toLocaleDateString("ar-EG", {
                year: "numeric", month: "long", day: "numeric"
            });

    return `
        <div class="news-card" data-news-id="${item.id}">

            ${item.imageURL
                ? `<img class="news-card-image" src="${item.imageURL}" alt="${escapeHTML(item.title)}">`
                : ""
            }

            <div class="news-card-body">

                <h3>${escapeHTML(item.title)}</h3>

                <p class="news-card-date">${date}</p>

                <p class="news-card-content">${escapeHTML(item.content)}</p>

                ${userIsAdmin()
                    ? `<button type="button" class="btn-danger delete-news-btn" data-news-id="${item.id}">
                        🗑 حذف
                       </button>`
                    : ""
                }

            </div>

        </div>
    `;
}


function attachNewsEvents(container, newsItems) {

    container.querySelectorAll(".delete-news-btn")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const confirmed =
                    window.confirm("حذف هذا الخبر نهائيًا؟");

                if (!confirmed) {
                    return;
                }

                await deleteNews(button.dataset.newsId);

                renderNewsPage(container);
            });
        });
}


function renderNewsForm(formArea, onDone) {

    if (!userIsAdmin()) {
        return;
    }

    formArea.innerHTML = `
        <form class="game-form" id="newsForm">

            <h2>إضافة خبر جديد</h2>

            <label>
                عنوان الخبر
                <input type="text" id="newsTitle" required>
            </label>

            <label>
                نص الخبر
                <textarea id="newsContent" required></textarea>
            </label>

            <div class="form-field">
                <span>صورة الخبر (اختياري)</span>

                <div class="image-upload-row">

                    <label class="image-upload-btn" for="newsImage">
                        📷 اختر صورة أو التقطها بالكاميرا
                    </label>

                    <input type="file" id="newsImage" accept="image/*" capture="environment" hidden>

                </div>

                <div class="image-preview" id="newsImagePreview"></div>
            </div>

            <div class="game-form-message" id="newsFormMessage"></div>

            <div class="game-form-actions">

                <button type="submit" class="btn-primary">نشر الخبر</button>

                <button type="button" class="btn-secondary" id="cancelNewsForm">إلغاء</button>

            </div>

        </form>
    `;

    const form =
        formArea.querySelector("#newsForm");

    const messageBox =
        formArea.querySelector("#newsFormMessage");

    const imageInput =
        formArea.querySelector("#newsImage");

    const imagePreview =
        formArea.querySelector("#newsImagePreview");

    formArea.querySelector("#cancelNewsForm")
        .addEventListener("click", () => {
            formArea.innerHTML = "";
        });

    imageInput.addEventListener("change", () => {

        const file =
            imageInput.files[0];

        if (!file) {
            return;
        }

        const reader =
            new FileReader();

        reader.onload =
            () => {
                imagePreview.innerHTML =
                    `<img src="${reader.result}" alt="معاينة">`;
            };

        reader.readAsDataURL(file);
    });

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const submitButton =
            form.querySelector("button[type=submit]");

        submitButton.disabled =
            true;

        try {

            await publishNews({

                title:
                    formArea.querySelector("#newsTitle").value.trim(),

                content:
                    formArea.querySelector("#newsContent").value.trim(),

                imageFile:
                    imageInput.files[0] || null

            });

            formArea.innerHTML =
                "";

            if (onDone) onDone();

        } catch (error) {

            console.error(
                "❌ Story Hub News: خطأ أثناء النشر.",
                error
            );

            messageBox.textContent =
                error.message || "حدث خطأ أثناء نشر الخبر.";

            submitButton.disabled =
                false;
        }
    });
}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;
}


window.StoryHubNews = {

    renderNewsPage

};
