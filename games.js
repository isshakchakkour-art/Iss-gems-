/* =========================================================
   Story Hub
   Games System (Storage-Free Edition)
   كتالوج الألعاب + لوحة رفع الألعاب (مسؤول) + التحديثات

   ملاحظة: لا يوجد هنا أي استخدام لـ Firebase Storage.
   أكواد الألعاب (HTML/CSS/JS) تُقرأ من الملف الذي يختاره
   المسؤول وتُخزَّن كنص مباشرة داخل Realtime Database،
   وصورة اللعبة تُستخدم كرابط خارجي بدل رفعها. هذا يبقي
   المشروع على خطة Spark المجانية بالكامل.
   ========================================================= */


/* =========================================================
   Firebase Realtime Database
   ========================================================= */

import {
    ref as dbRef,
    get as dbGet,
    set as dbSet,
    push as dbPush,
    remove as dbRemove
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";


/* =========================================================
   Story Hub Database
   ========================================================= */

import {
    auth,
    database
} from "./database.js";


/* =========================================================
   حدّ أقصى تقريبي لحجم كل ملف كود (بالحروف) لحماية
   حصة Realtime Database المجانية من الامتلاء بسرعة.
   ========================================================= */

const MAX_CODE_FILE_LENGTH = 300000; // ~300 KB نص تقريبًا


/* =========================================================
   مساعد: هل المستخدم الحالي مسؤول؟
   ========================================================= */

function userIsAdmin() {

    return Boolean(
        window.StoryHubAuth &&
        window.StoryHubAuth.isAdmin()
    );
}


/* =========================================================
   قراءة كل الألعاب من قاعدة البيانات
   ========================================================= */

async function fetchAllGames() {

    try {

        const snapshot =
            await dbGet(
                dbRef(database, "games")
            );

        if (!snapshot.exists()) {
            return {};
        }

        return snapshot.val();

    } catch (error) {

        console.error(
            "❌ Story Hub Games: تعذّرت قراءة الألعاب.",
            error
        );

        return {};
    }
}


/* =========================================================
   قراءة محتوى ملف كنص (Promise حول FileReader)
   ========================================================= */

function readFileAsText(file) {

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();

        reader.onload =
            () => resolve(reader.result);

        reader.onerror =
            () => reject(
                new Error("تعذّر قراءة الملف: " + file.name)
            );

        reader.readAsText(file);
    });
}


/* =========================================================
   ضغط/تصغير الصورة وتحويلها إلى Base64 (بدون أي رفع خارجي)
   ========================================================= */

export function compressImageToDataURL(file, maxWidth = 480, quality = 0.75) {

    return new Promise((resolve, reject) => {

        const img =
            new Image();

        const reader =
            new FileReader();

        reader.onload = () => {

            img.onload = () => {

                const scale =
                    Math.min(1, maxWidth / img.width);

                const canvas =
                    document.createElement("canvas");

                canvas.width =
                    img.width * scale;

                canvas.height =
                    img.height * scale;

                const context =
                    canvas.getContext("2d");

                context.drawImage(
                    img, 0, 0, canvas.width, canvas.height
                );

                resolve(
                    canvas.toDataURL("image/jpeg", quality)
                );
            };

            img.onerror =
                () => reject(new Error("تعذّر قراءة الصورة."));

            img.src =
                reader.result;
        };

        reader.onerror =
            () => reject(new Error("تعذّر قراءة ملف الصورة."));

        reader.readAsDataURL(file);
    });
}

/* =========================================================
   الدالة الأساسية لحفظ لعبة انطلاقًا من نصوص جاهزة
   (بدون الحاجة لملفات) — يستخدمها نموذج المسؤول العادي
   وأيضًا مساعد الذكاء الاصطناعي عند نشر تطبيق كلعبة.

   gameData:
     { id?, name, description, imageDataURL?, html, css, js }
   ========================================================= */

async function saveGameRecord(gameData, onProgress) {

    if (!userIsAdmin()) {

        throw new Error(
            "لا تملك صلاحية إضافة أو تعديل الألعاب."
        );
    }

    const isUpdate =
        Boolean(gameData.id);

    const gameId =
        gameData.id ||
        dbPush(
            dbRef(database, "games")
        ).key;

    const existingSnapshot =
        isUpdate
            ? await dbGet(dbRef(database, "games/" + gameId))
            : null;

    const existingData =
        existingSnapshot && existingSnapshot.exists()
            ? existingSnapshot.val()
            : null;

    const newVersion =
        existingData
            ? (Number(existingData.version) || 1) + 1
            : 1;

    [gameData.html, gameData.css, gameData.js].forEach(text => {

        if ((text || "").length > MAX_CODE_FILE_LENGTH) {

            throw new Error(
                "أحد ملفات الكود كبير جدًا (الحد الأقصى تقريبًا 300 كيلوبايت لكل ملف)."
            );
        }
    });

    if (onProgress) onProgress("حفظ بيانات اللعبة...");

    const imageURL =
        gameData.imageDataURL !== null && gameData.imageDataURL !== undefined
            ? gameData.imageDataURL
            : (existingData ? existingData.imageURL || "" : "");

    const record = {

        id: gameId,

        name:
            gameData.name ||
            (existingData ? existingData.name : ""),

        description:
            gameData.description ||
            (existingData ? existingData.description || "" : ""),

        imageURL,

        html: gameData.html || "",

        css: gameData.css || "",

        js: gameData.js || "",

        version: newVersion,

        createdAt:
            existingData
                ? existingData.createdAt
                : Date.now(),

        updatedAt: Date.now()
    };

    await dbSet(
        dbRef(database, "games/" + gameId),
        record
    );

    if (onProgress) onProgress("تم النشر بنجاح.");

    return record;
}


/* =========================================================
   حذف لعبة
   ========================================================= */

async function deleteGame(gameId) {

    if (!userIsAdmin()) {

        throw new Error(
            "لا تملك صلاحية حذف الألعاب."
        );
    }

    try {

        await dbRemove(
            dbRef(database, "games/" + gameId)
        );

        return true;

    } catch (error) {

        console.error(
            "❌ Story Hub Games: خطأ أثناء حذف اللعبة.",
            error
        );

        return false;
    }
}


/* =========================================================
   بناء مستند اللعبة الكامل مع ضبط الأبعاد حسب الجهاز المختار
   ========================================================= */

function buildGameDocument(game, deviceType) {

    const isPhone =
        deviceType === "phone";

    const viewportTag =
        isPhone
            ? `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`
            : `<meta name="viewport" content="width=1024, initial-scale=1">`;

    const wrapperStyle =
        isPhone
            ? `
                html, body {
                    margin: 0; padding: 0; width: 100%; height: 100%;
                    overflow-x: hidden;
                }
              `
            : `
                html, body {
                    margin: 0; padding: 0; min-height: 100%;
                }
                body {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    background: #0a0806;
                }
                #story-hub-pc-frame {
                    width: min(900px, 100vw);
                    margin: 24px;
                }
              `;

    const bodyContent =
        isPhone
            ? game.html || ""
            : `<div id="story-hub-pc-frame">${game.html || ""}</div>`;

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
${viewportTag}
<title>${game.name || "Story Hub Game"}</title>
<style>
${wrapperStyle}
${game.css || ""}
</style>
</head>
<body>
${bodyContent}
<script>
${game.js || ""}
</script>
</body>
</html>
`;
}


/* =========================================================
   نافذة اختيار الجهاز (هاتف/كمبيوتر) قبل تشغيل اللعبة
   ========================================================= */

function askDeviceType() {

    return new Promise(resolve => {

        const overlay =
            document.createElement("div");

        overlay.className =
            "device-choice-overlay";

        overlay.innerHTML = `
            <div class="device-choice-box">

                <h3>وش الجهاز اللي بتلعب عليه؟</h3>

                <p>عشان نظبط مقاسات اللعبة على شاشتك بدون مشاكل.</p>

                <div class="device-choice-buttons">

                    <button type="button" class="btn-primary" data-device="phone">
                        📱 هاتف
                    </button>

                    <button type="button" class="btn-secondary" data-device="pc">
                        🖥️ كمبيوتر
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelectorAll("[data-device]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    overlay.remove();
                    resolve(button.dataset.device);
                });
            });
    });
}


/* =========================================================
   تشغيل لعبة: يسأل عن نوع الجهاز، يبني مستند HTML مناسب
   له، ويفتحه عبر Blob URL، ثم يسجّل نسخة اللعبة الحالية
   في مكتبة المستخدم (users/{uid}/library).
   ========================================================= */

async function playGame(game, onProgress) {

    const deviceType =
        await askDeviceType();

    if (onProgress) onProgress("جاري تجهيز اللعبة...");

    const combinedHTML =
        buildGameDocument(game, deviceType);

    const blob =
        new Blob([combinedHTML], { type: "text/html" });

    const blobURL =
        URL.createObjectURL(blob);

    window.open(blobURL, "_blank");

    await recordInstalledVersion(game);

    if (onProgress) onProgress("تم فتح اللعبة.");
}


/* =========================================================
   تسجيل الإصدار المثبَّت لدى المستخدم الحالي
   ========================================================= */

async function recordInstalledVersion(game) {

    const user =
        auth.currentUser;

    if (!user) {
        return;
    }

    try {

        await dbSet(
            dbRef(
                database,
                `users/${user.uid}/library/${game.id}`
            ),
            {
                version: game.version,
                installedAt: Date.now()
            }
        );

    } catch (error) {

        console.error(
            "❌ Story Hub Games: تعذّر تسجيل مكتبة المستخدم.",
            error
        );
    }
}


/* =========================================================
   قراءة مكتبة المستخدم الحالي (الألعاب المثبّتة)
   ========================================================= */

async function fetchUserLibrary() {

    const user =
        auth.currentUser;

    if (!user) {
        return {};
    }

    try {

        const snapshot =
            await dbGet(
                dbRef(database, `users/${user.uid}/library`)
            );

        return snapshot.exists()
            ? snapshot.val()
            : {};

    } catch (error) {

        console.error(
            "❌ Story Hub Games: تعذّرت قراءة مكتبة المستخدم.",
            error
        );

        return {};
    }
}


/* =========================================================
   عرض صفحة "الألعاب" العامة
   ========================================================= */

async function renderGamesPage(container) {

    container.innerHTML = `
        <section class="games-section">

            <div class="games-header">

                <h1>🎮 الألعاب</h1>

                ${userIsAdmin()
                    ? `<button
                        type="button"
                        class="btn-primary"
                        id="openAddGameForm"
                       >
                        + إضافة لعبة جديدة
                       </button>`
                    : ""
                }

            </div>

            <div id="gamesFormArea"></div>

            <div class="games-grid" id="gamesGrid">
                <p>جاري تحميل الألعاب...</p>
            </div>

        </section>
    `;

    const gamesGrid =
        container.querySelector("#gamesGrid");

    const games =
        await fetchAllGames();

    const gameList =
        Object.values(games);

    if (gameList.length === 0) {

        gamesGrid.innerHTML =
            "<p>لا توجد ألعاب منشورة بعد.</p>";

    } else {

        gamesGrid.innerHTML =
            gameList.map(renderGameCard).join("");
    }

    attachGameCardEvents(container, games);

    const addButton =
        container.querySelector("#openAddGameForm");

    if (addButton) {

        addButton.addEventListener("click", () => {

            renderGameForm(
                container.querySelector("#gamesFormArea"),
                null,
                () => renderGamesPage(container)
            );
        });
    }
}


/* =========================================================
   بطاقة لعبة واحدة
   ========================================================= */

function renderGameCard(game) {

    return `
        <div class="game-card" data-game-id="${game.id}">

            <div class="game-card-image">
                ${game.imageURL
                    ? `<img src="${game.imageURL}" alt="${game.name}" onerror="this.parentElement.textContent='🎮'">`
                    : "🎮"
                }
            </div>

            <h3>${escapeHTML(game.name || "بدون اسم")}</h3>

            <p>${escapeHTML(game.description || "")}</p>

            <p class="game-version">الإصدار: ${game.version}</p>

            <div class="game-card-actions">

                <button
                    type="button"
                    class="btn-primary play-game-btn"
                    data-game-id="${game.id}"
                >
                    ▶ تشغيل / تنزيل
                </button>

                ${userIsAdmin()
                    ? `
                        <button
                            type="button"
                            class="btn-secondary edit-game-btn"
                            data-game-id="${game.id}"
                        >
                            ✏️ تحديث جديد
                        </button>

                        <button
                            type="button"
                            class="btn-danger delete-game-btn"
                            data-game-id="${game.id}"
                        >
                            🗑 حذف
                        </button>
                    `
                    : ""
                }

            </div>

        </div>
    `;
}


/* =========================================================
   ربط أزرار بطاقات الألعاب بالأحداث
   ========================================================= */

function attachGameCardEvents(container, games) {

    container.querySelectorAll(".play-game-btn")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const game =
                    games[button.dataset.gameId];

                button.disabled = true;

                const originalText =
                    button.textContent;

                await playGame(game, message => {
                    button.textContent = message;
                });

                button.textContent = originalText;
                button.disabled = false;
            });
        });

    container.querySelectorAll(".edit-game-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                const game =
                    games[button.dataset.gameId];

                renderGameForm(
                    container.querySelector("#gamesFormArea"),
                    game,
                    () => renderGamesPage(container)
                );
            });
        });

    container.querySelectorAll(".delete-game-btn")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const confirmed =
                    window.confirm(
                        "هل أنت متأكد من حذف هذه اللعبة نهائيًا؟"
                    );

                if (!confirmed) {
                    return;
                }

                await deleteGame(button.dataset.gameId);

                renderGamesPage(container);
            });
        });
}


/* =========================================================
   نموذج إضافة / تحديث لعبة (مسؤول فقط)
   ========================================================= */

function renderGameForm(formArea, existingGame, onDone) {

    if (!userIsAdmin()) {
        return;
    }

    const isUpdate =
        Boolean(existingGame);

    formArea.innerHTML = `
        <form class="game-form" id="gameForm">

            <h2>
                ${isUpdate
                    ? `تحديث جديد: ${escapeHTML(existingGame.name)}`
                    : "إضافة لعبة جديدة"
                }
            </h2>

            <label>
                اسم اللعبة
                <input
                    type="text"
                    id="gameName"
                    ${isUpdate ? "readonly" : "required"}
                    value="${isUpdate ? escapeHTML(existingGame.name) : ""}"
                >
            </label>

            <label>
                وصف مختصر
                <textarea id="gameDescription">${
                    isUpdate ? escapeHTML(existingGame.description || "") : ""
                }</textarea>
            </label>

            <div class="form-field">
                <span>صورة اللعبة (اختياري)</span>

                <div class="image-upload-row">

                    <label class="image-upload-btn" for="gameImage">
                        📷 اختر صورة أو التقطها بالكاميرا
                    </label>

                    <input
                        type="file"
                        id="gameImage"
                        accept="image/*"
                        capture="environment"
                        hidden
                    >

                </div>

                <div class="image-preview" id="imagePreview">
                    ${isUpdate && existingGame.imageURL
                        ? `<img src="${existingGame.imageURL}" alt="معاينة">`
                        : ""
                    }
                </div>
            </div>

            <div class="code-field">
                <div class="code-field-header">
                    <span>كود HTML الخاص باللعبة</span>
                    <label class="code-file-btn">
                        📎 أو ارفع ملف
                        <input type="file" id="gameHTMLFile" accept=".html" hidden>
                    </label>
                </div>
                <textarea
                    id="gameHTMLCode"
                    class="code-textarea"
                    placeholder="الصق كود HTML هنا (أو ارفع ملف من الزر أعلاه)..."
                    spellcheck="false"
                >${isUpdate ? escapeHTML(existingGame.html || "") : ""}</textarea>
            </div>

            <div class="code-field">
                <div class="code-field-header">
                    <span>كود CSS الخاص باللعبة</span>
                    <label class="code-file-btn">
                        📎 أو ارفع ملف
                        <input type="file" id="gameCSSFile" accept=".css" hidden>
                    </label>
                </div>
                <textarea
                    id="gameCSSCode"
                    class="code-textarea"
                    placeholder="الصق كود CSS هنا (أو ارفع ملف من الزر أعلاه)..."
                    spellcheck="false"
                >${isUpdate ? escapeHTML(existingGame.css || "") : ""}</textarea>
            </div>

            <div class="code-field">
                <div class="code-field-header">
                    <span>كود JavaScript الخاص باللعبة</span>
                    <label class="code-file-btn">
                        📎 أو ارفع ملف
                        <input type="file" id="gameJSFile" accept=".js" hidden>
                    </label>
                </div>
                <textarea
                    id="gameJSCode"
                    class="code-textarea"
                    placeholder="الصق كود JavaScript هنا (أو ارفع ملف من الزر أعلاه)..."
                    spellcheck="false"
                >${isUpdate ? escapeHTML(existingGame.js || "") : ""}</textarea>
            </div>

            <div class="game-form-message" id="gameFormMessage"></div>

            <div class="game-form-actions">

                <button type="submit" class="btn-primary">
                    ${isUpdate ? "نشر التحديث" : "نشر اللعبة"}
                </button>

                <button type="button" class="btn-secondary" id="cancelGameForm">
                    إلغاء
                </button>

            </div>

        </form>
    `;

    const form =
        formArea.querySelector("#gameForm");

    const messageBox =
        formArea.querySelector("#gameFormMessage");

    formArea.querySelector("#cancelGameForm")
        .addEventListener("click", () => {

            formArea.innerHTML = "";
        });

    const imageInput =
        formArea.querySelector("#gameImage");

    const imagePreview =
        formArea.querySelector("#imagePreview");

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

    /* رفع ملف اختياري لكل حقل كود يملأ مربع النص تلقائيًا */

    [
        ["gameHTMLFile", "gameHTMLCode"],
        ["gameCSSFile", "gameCSSCode"],
        ["gameJSFile", "gameJSCode"]
    ].forEach(([fileInputId, textareaId]) => {

        const fileInput =
            formArea.querySelector("#" + fileInputId);

        const textarea =
            formArea.querySelector("#" + textareaId);

        fileInput.addEventListener("change", async () => {

            const file =
                fileInput.files[0];

            if (!file) {
                return;
            }

            textarea.value =
                await readFileAsText(file);
        });
    });

    form.addEventListener("submit", async event => {

        event.preventDefault();

        messageBox.textContent =
            "";

        const submitButton =
            form.querySelector("button[type=submit]");

        submitButton.disabled =
            true;

        try {

            const htmlCode =
                formArea.querySelector("#gameHTMLCode").value;

            const cssCode =
                formArea.querySelector("#gameCSSCode").value;

            const jsCode =
                formArea.querySelector("#gameJSCode").value;

            if (!htmlCode.trim() && !isUpdate) {

                throw new Error(
                    "لازم تضيف كود HTML على الأقل (لصق أو رفع ملف)."
                );
            }

            let imageDataURL =
                null;

            if (imageInput.files[0]) {

                imageDataURL =
                    await compressImageToDataURL(imageInput.files[0]);
            }

            const gameData = {

                id:
                    isUpdate ? existingGame.id : null,

                name:
                    formArea.querySelector("#gameName").value.trim(),

                description:
                    formArea.querySelector("#gameDescription").value.trim(),

                imageDataURL,

                html: htmlCode,
                css: cssCode,
                js: jsCode
            };

            await saveGameRecord(gameData, message => {

                messageBox.textContent =
                    message;
            });

            formArea.innerHTML =
                "";

            if (onDone) onDone();

        } catch (error) {

            console.error(
                "❌ Story Hub Games: خطأ أثناء حفظ اللعبة.",
                error
            );

            messageBox.textContent =
                error.message ||
                "حدث خطأ أثناء نشر اللعبة.";

            submitButton.disabled =
                false;
        }
    });
}


/* =========================================================
   عرض صفحة "تحديثات الألعاب"
   ========================================================= */

async function renderUpdatesPage(container) {

    container.innerHTML = `
        <section class="games-section">
            <h1>🔄 تحديثات الألعاب</h1>
            <div id="updatesList">
                <p>جاري التحقق من التحديثات...</p>
            </div>
        </section>
    `;

    const updatesList =
        container.querySelector("#updatesList");

    if (!auth.currentUser) {

        updatesList.innerHTML =
            "<p>سجّل الدخول لعرض تحديثات ألعابك.</p>";

        return;
    }

    const [games, library] =
        await Promise.all([
            fetchAllGames(),
            fetchUserLibrary()
        ]);

    const updatable =
        Object.keys(library)
            .filter(gameId =>
                games[gameId] &&
                Number(games[gameId].version) > Number(library[gameId].version)
            )
            .map(gameId => games[gameId]);

    if (updatable.length === 0) {

        updatesList.innerHTML =
            "<p>كل ألعابك محدَّثة لآخر إصدار. ✅</p>";

        return;
    }

    updatesList.innerHTML =
        updatable.map(game => `
            <div class="update-card" data-game-id="${game.id}">

                <div class="game-card-image">
                    ${game.imageURL
                        ? `<img src="${game.imageURL}" alt="${game.name}" onerror="this.parentElement.textContent='🎮'">`
                        : "🎮"
                    }
                </div>

                <div>
                    <h3>${escapeHTML(game.name)}</h3>
                    <p>يتوفر إصدار جديد: ${game.version}</p>
                </div>

                <button
                    type="button"
                    class="btn-primary update-game-btn"
                    data-game-id="${game.id}"
                >
                    تحديث الآن
                </button>

            </div>
        `).join("");

    updatesList.querySelectorAll(".update-game-btn")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const game =
                    games[button.dataset.gameId];

                button.disabled = true;

                await playGame(game, message => {
                    button.textContent = message;
                });

                renderUpdatesPage(container);
            });
        });
}


/* =========================================================
   حماية بسيطة من HTML Injection في أسماء/أوصاف الألعاب
   ========================================================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;
}


/* =========================================================
   API عامة
   ========================================================= */

window.StoryHubGames = {

    renderGamesPage,

    renderUpdatesPage,

    saveGameRecord

};


/* =========================================================
   نهاية games.js
   ========================================================= */
