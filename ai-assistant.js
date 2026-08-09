/* =========================================================
   Story Hub
   AI App Builder Assistant
   يعتمد على Puter.js — بدون أي مفتاح API سري، وبدون Functions.

   المستخدم (زائر الموقع) يسجّل دخوله بحساب Puter الخاص به
   عند أول استخدام (نافذة صغيرة تفتحها مكتبة Puter تلقائيًا)،
   وتكلفة الاستخدام على حساب Puter المجاني الخاص به وليس على
   حسابك في Firebase — هذا ما يجعل الميزة مجانية بالكامل من
   جهتنا.
   ========================================================= */


/* =========================================================
   النماذج المتاحة للتبديل بينها

   issgx1.1   → نموذج قوي، أفضل في التحليل وكتابة أكواد معقّدة.
   issgx-lite → نموذج أخف وأسرع للطلبات البسيطة.

   هذي أسماء مخصصة لموقعك فقط؛ من الداخل تُستخدم نماذج Puter
   الحقيقية الموضّحة بجانب كل واحد.
   ========================================================= */

const AI_MODELS = {

    "issgx1.1": {
        label: "issgx1.1 — قوي (سحابي)",
        underlyingModel: "gemini-2.5-flash"
    },

    "issgx-lite": {
        label: "issgx lite — سريع (سحابي)",
        underlyingModel: "gemini-3.5-flash-lite"
    },

    "issgx-offline": {
        label: "issgx offline — محلي 100% (بدون انترنت لاحقًا)",
        local: true,
        webllmModel: "Llama-3.2-1B-Instruct-q4f16_1-MLC"
    }

};

let selectedModelKey =
    "issgx1.1";


/* =========================================================
   محرك WebLLM المحلي (يُحمَّل بكسل عند أول استخدام فقط)
   ========================================================= */

let localEngine =
    null;


/* =========================================================
   تعليمات النظام: نجبر النموذج على إخراج كود منظّم
   ضمن كتل مفصولة حتى نقدر نستخرجها ونعرضها في المعاينة.
   ========================================================= */

const SYSTEM_INSTRUCTIONS = `
أنت مساعد برمجي محترف متخصص في بناء تطبيقات وألعاب ويب كاملة
باستخدام HTML و CSS و JavaScript فقط (بدون أي مكتبات خارجية
تحتاج تثبيتًا، يمكنك استخدام روابط CDN عند الحاجة فقط).

قبل ما تكتب الكود، حلّل الطلب جيدًا: افهم آلية اللعبة/التطبيق
بدقة (القواعد، حالات النهاية، التفاعلات، الحالات الاستثنائية)
قبل البدء بالكتابة.

معايير الجودة المطلوبة دائمًا:
- كود منظم ومقسّم لدوال واضحة، بدون تكرار غير ضروري.
- معالجة الأخطاء والحالات الحدّية (مثل النقر المتكرر أو المدخلات الخاطئة).
- تصميم بصري متكامل وجذاب (ألوان متناسقة، تباعد جيد، تجاوب مع
  الشاشات الصغيرة)، وليس مجرد عناصر HTML بلا تنسيق.
- تعليقات مختصرة بالعربية على الأجزاء المهمة من الكود.
- أداء جيد: تجنّب أي عمليات ثقيلة غير ضرورية داخل الحلقات
  السريعة (مثل requestAnimationFrame).

عند أي طلب لبناء أو تعديل تطبيق، يجب أن يكون ردّك دائمًا
بهذا الشكل بالضبط:

1. جملة أو جملتان تشرحان ما بنيته باللغة العربية.
2. ثلاث كتل كود منفصلة بالترتيب التالي، حتى لو كانت فارغة:

\`\`\`html
(محتوى الـ body فقط، بدون <html> أو <head>)
\`\`\`

\`\`\`css
(كل تنسيقات CSS)
\`\`\`

\`\`\`js
(كل كود JavaScript)
\`\`\`

لا تضف أي شرح تقني بعد الكود. اجعل الكود كاملًا وقابلًا للتشغيل
مباشرة في كل مرة، حتى عند طلب تعديل بسيط أعد كتابة الكود كاملًا.
إن كان الطلب لا يتعلق ببناء تطبيق (سؤال عام)، أجب بشكل طبيعي
بدون كتل كود.
`;


/* =========================================================
   حالة المحادثة
   ========================================================= */

let conversationHistory =
    [];

let latestGeneratedCode =
    { html: "", css: "", js: "" };


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
   استخراج كتل الكود من ردّ النموذج
   ========================================================= */

function extractCodeBlocks(fullText) {

    const extract = language => {

        const pattern =
            new RegExp(
                "```" + language + "([\\s\\S]*?)```",
                "i"
            );

        const match =
            fullText.match(pattern);

        return match ? match[1].trim() : "";
    };

    return {
        html: extract("html"),
        css: extract("css"),
        js: extract("js|javascript")
    };
}


/* =========================================================
   نص المحادثة بدون كتل الكود (للعرض في فقاعة المحادثة)
   ========================================================= */

function stripCodeBlocks(fullText) {

    return fullText
        .replace(/```[\s\S]*?```/g, "")
        .trim();
}


/* =========================================================
   بناء مستند HTML كامل من الكود المولَّد للمعاينة
   ========================================================= */

function buildPreviewDocument(code) {

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>${code.css || ""}</style>
</head>
<body>
${code.html || ""}
<script>${code.js || ""}<\/script>
</body>
</html>
`;
}


/* =========================================================
   عرض صفحة المساعد الذكي
   ========================================================= */

function renderAIAssistantPage(container) {

    if (!userIsAdmin()) {

        container.innerHTML = `
            <section class="home-section">
                <h1>المساعد الذكي</h1>
                <p>هذه الميزة متاحة للمسؤول فقط حاليًا.</p>
            </section>
        `;

        return;
    }

    container.innerHTML = `
        <section class="ai-section">

            <div class="ai-toolbar">

                <div class="ai-tabs">

                    <button type="button" class="ai-tab active" data-tab="chat">
                        💬 المحادثة
                    </button>

                    <button type="button" class="ai-tab" data-tab="files">
                        📁 الملفات
                    </button>

                </div>

                <select id="aiModelSelect" class="ai-model-select">
                    ${Object.entries(AI_MODELS).map(([key, model]) => `
                        <option value="${key}" ${key === selectedModelKey ? "selected" : ""}>
                            ${model.label}
                        </option>
                    `).join("")}
                </select>

            </div>

            <div class="ai-panel ai-panel-chat" id="aiPanelChat" style="display:flex;">

                <div class="ai-messages" id="aiMessages">

                    <div class="ai-message ai-message-assistant">
                        <div class="ai-bubble">
                            👋 أهلًا! صف لي التطبيق أو اللعبة اللي تبي أبنيها،
                            وراح أجهّز لك الكود. تقدر تفتح تبويب "📁 الملفات"
                            لنسخ الكود، أو تفتح المعاينة بشاشة كاملة قبل النشر.
                        </div>
                    </div>

                </div>

                <form class="ai-input-row" id="aiInputForm">

                    <textarea
                        id="aiPromptInput"
                        placeholder="مثال: ابنِ لي لعبة تخمين رقم بين 1 و100..."
                        rows="1"
                        required
                    ></textarea>

                    <button type="submit" class="btn-primary" id="aiSendButton">
                        إرسال
                    </button>

                </form>

            </div>

            <div class="ai-panel ai-panel-files" id="aiPanelFiles" style="display:none;">

                <p class="ai-files-empty" id="aiFilesEmpty">
                    لم يتم توليد أي كود بعد. تحدّث مع المساعد أولًا من تبويب المحادثة.
                </p>

                <div id="aiFilesList"></div>

                <div class="ai-preview-toolbar">

                    <button type="button" class="btn-secondary" id="aiOpenFullPreview">
                        🖥️ فتح المعاينة بشاشة كاملة
                    </button>

                    <button type="button" class="btn-primary" id="aiPublishButton" disabled>
                        🚀 نشر التطبيق كلعبة
                    </button>

                </div>

            </div>

        </section>
    `;

    wireAIAssistantEvents(container);
}


/* =========================================================
   ربط أحداث الواجهة
   ========================================================= */

function wireAIAssistantEvents(container) {

    const tabs =
        container.querySelectorAll(".ai-tab");

    const chatPanel =
        container.querySelector("#aiPanelChat");

    const filesPanel =
        container.querySelector("#aiPanelFiles");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const isFiles =
                tab.dataset.tab === "files";

            chatPanel.style.display =
                isFiles ? "none" : "flex";

            filesPanel.style.display =
                isFiles ? "flex" : "none";
        });
    });


    const modelSelect =
        container.querySelector("#aiModelSelect");

    modelSelect.addEventListener("change", () => {

        selectedModelKey =
            modelSelect.value;
    });


    const form =
        container.querySelector("#aiInputForm");

    const promptInput =
        container.querySelector("#aiPromptInput");

    const sendButton =
        container.querySelector("#aiSendButton");

    const messagesBox =
        container.querySelector("#aiMessages");

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const prompt =
            promptInput.value.trim();

        if (!prompt) {
            return;
        }

        promptInput.value =
            "";

        appendMessage(messagesBox, "user", prompt);

        sendButton.disabled =
            true;

        const assistantBubble =
            appendMessage(messagesBox, "assistant", "");

        try {

            await streamAssistantReply(
                prompt,
                container,
                assistantBubble
            );

        } catch (error) {

            console.error(
                "❌ Story Hub AI: خطأ أثناء المحادثة.",
                error
            );

            const isInsufficientFunds =
                (error && error.code === "insufficient_funds") ||
                (error && error.error && error.error.code === "insufficient_funds") ||
                /insufficient_funds|No usage left/i.test(
                    (error && (error.message || JSON.stringify(error))) || ""
                );

            assistantBubble.textContent =
                isInsufficientFunds
                    ? "💳 نفد الرصيد التجريبي لحساب Puter الحالي مع هذا النموذج. جرّب التبديل لنموذج \"issgx lite\" من القائمة أعلاه، أو اشحن رصيدًا بسيطًا في حساب Puter الخاص بك."
                    : "حدث خطأ أثناء الاتصال بالمساعد الذكي. حاول مرة أخرى.";

        } finally {

            sendButton.disabled =
                false;
        }
    });


    container.querySelector("#aiOpenFullPreview")
        .addEventListener("click", () => {

            openFullScreenPreview();
        });


    const publishButton =
        container.querySelector("#aiPublishButton");

    publishButton.addEventListener("click", () => {

        openPublishForm(container);
    });
}


/* =========================================================
   إضافة فقاعة رسالة للمحادثة
   ========================================================= */

function appendMessage(messagesBox, role, text) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "ai-message ai-message-" + role;

    wrapper.innerHTML = `
        <div class="ai-bubble">${escapeHTML(text)}</div>
    `;

    messagesBox.appendChild(wrapper);

    messagesBox.scrollTop =
        messagesBox.scrollHeight;

    return wrapper.querySelector(".ai-bubble");
}


/* =========================================================
   إرسال الرسالة للنموذج واستقبال الرد تدريجيًا (Streaming)
   ========================================================= */

async function streamAssistantReply(prompt, container, assistantBubble) {

    conversationHistory.push({
        role: "user",
        content: prompt
    });

    const messagesForModel = [
        { role: "system", content: SYSTEM_INSTRUCTIONS },
        ...conversationHistory
    ];

    const modelInfo =
        AI_MODELS[selectedModelKey];

    let fullText =
        "";

    if (modelInfo.local) {

        for await (const chunk of streamFromLocalModel(
            messagesForModel, assistantBubble
        )) {

            fullText +=
                chunk;

            assistantBubble.textContent =
                stripCodeBlocks(fullText) || "...جاري الكتابة";
        }

    } else {

        if (window.puter && window.puter.auth &&
            !(await window.puter.auth.isSignedIn())) {

            assistantBubble.textContent =
                "🔐 افتح نافذة تسجيل الدخول لحساب Puter وأكمل الدخول، ثم أعد إرسال رسالتك...";

            await window.puter.auth.signIn();

            assistantBubble.textContent =
                "✅ تم تسجيل الدخول. جاري التفكير...";
        }

        const response =
            await window.puter.ai.chat(
                messagesForModel,
                { model: modelInfo.underlyingModel, stream: true }
            );

        for await (const part of response) {

            if (part && part.text) {

                fullText +=
                    part.text;

                assistantBubble.textContent =
                    stripCodeBlocks(fullText) || "...جاري الكتابة";
            }
        }
    }

    conversationHistory.push({
        role: "assistant",
        content: fullText
    });

    const codeBlocks =
        extractCodeBlocks(fullText);

    if (codeBlocks.html || codeBlocks.css || codeBlocks.js) {

        latestGeneratedCode =
            codeBlocks;

        assistantBubble.textContent =
            (stripCodeBlocks(fullText) || "تم تجهيز الكود.") +
            "  —  افتح تبويب 📁 الملفات لنسخ الكود أو معاينته بشاشة كاملة.";

        renderFilesTab(container);

        const publishButton =
            container.querySelector("#aiPublishButton");

        if (publishButton) {
            publishButton.disabled = false;
        }
    }
}


/* =========================================================
   تحميل وتشغيل نموذج WebLLM محليًا (بدون أي سيرفر خارجي)

   يتم تحميل المكتبة والنموذج مرة واحدة فقط عند أول استخدام،
   ويُخزَّن في ذاكرة تخزين المتصفح المؤقتة (Cache) للمرات
   القادمة — بعدها يعمل حتى بدون انترنت.
   ========================================================= */

async function* streamFromLocalModel(messagesForModel, assistantBubble) {

    if (!localEngine) {

        assistantBubble.textContent =
            "⬇️ جاري تحميل النموذج المحلي لأول مرة (قد يستغرق دقائق حسب سرعة الشبكة)...";

        const webllm =
            await import("https://esm.run/@mlc-ai/web-llm");

        localEngine =
            await webllm.CreateMLCEngine(
                AI_MODELS["issgx-offline"].webllmModel,
                {
                    initProgressCallback: report => {

                        assistantBubble.textContent =
                            "⬇️ تحميل النموذج المحلي: " +
                            Math.round((report.progress || 0) * 100) +
                            "%";
                    }
                }
            );
    }

    assistantBubble.textContent =
        "...جاري الكتابة";

    const stream =
        await localEngine.chat.completions.create({
            messages: messagesForModel,
            stream: true
        });

    for await (const chunk of stream) {

        const delta =
            chunk.choices &&
            chunk.choices[0] &&
            chunk.choices[0].delta &&
            chunk.choices[0].delta.content;

        if (delta) {
            yield delta;
        }
    }
}


/* =========================================================
   عرض الملفات المولَّدة كنص قابل للنسخ في تبويب "الملفات"
   ========================================================= */

function renderFilesTab(container) {

    const listBox =
        container.querySelector("#aiFilesList");

    const emptyMessage =
        container.querySelector("#aiFilesEmpty");

    const hasCode =
        latestGeneratedCode.html ||
        latestGeneratedCode.css ||
        latestGeneratedCode.js;

    if (!hasCode) {

        listBox.innerHTML =
            "";

        emptyMessage.style.display =
            "block";

        return;
    }

    emptyMessage.style.display =
        "none";

    const files = [
        { label: "index.html", content: latestGeneratedCode.html },
        { label: "style.css", content: latestGeneratedCode.css },
        { label: "script.js", content: latestGeneratedCode.js }
    ];

    listBox.innerHTML =
        files.map((file, index) => `
            <div class="ai-file-card">

                <div class="ai-file-header">
                    <span>📄 ${file.label}</span>
                    <button type="button" class="btn-secondary ai-copy-btn" data-file-index="${index}">
                        📋 نسخ
                    </button>
                </div>

                <pre class="ai-file-content">${escapeHTML(file.content || "(فارغ)")}</pre>

            </div>
        `).join("");

    listBox.querySelectorAll(".ai-copy-btn")
        .forEach((button, index) => {

            button.addEventListener("click", async () => {

                try {

                    await navigator.clipboard.writeText(
                        files[index].content || ""
                    );

                    button.textContent =
                        "✅ تم النسخ";

                    setTimeout(() => {
                        button.textContent = "📋 نسخ";
                    }, 1500);

                } catch (error) {

                    console.error(
                        "❌ Story Hub AI: تعذّر النسخ.",
                        error
                    );
                }
            });
        });
}


/* =========================================================
   فتح معاينة التطبيق بشاشة كاملة منفصلة (Overlay مستقل)
   ========================================================= */

function openFullScreenPreview() {

    const hasCode =
        latestGeneratedCode.html ||
        latestGeneratedCode.css ||
        latestGeneratedCode.js;

    if (!hasCode) {

        window.alert(
            "لم يتم توليد أي كود بعد. تحدّث مع المساعد أولًا."
        );

        return;
    }

    const overlay =
        document.createElement("div");

    overlay.className =
        "ai-fullscreen-preview";

    overlay.innerHTML = `
        <div class="ai-fullscreen-toolbar">

            <button type="button" class="btn-secondary" id="aiCloseFullPreview">
                ✕ إغلاق
            </button>

            <span>معاينة كاملة</span>

        </div>

        <iframe
            class="ai-fullscreen-frame"
            title="معاينة كاملة للتطبيق"
            sandbox="allow-scripts"
        ></iframe>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("iframe").srcdoc =
        buildPreviewDocument(latestGeneratedCode);

    overlay.querySelector("#aiCloseFullPreview")
        .addEventListener("click", () => {

            overlay.remove();
        });
}


/* =========================================================
   نموذج نشر التطبيق كلعبة (اسم + صورة اختيارية)
   ========================================================= */

function openPublishForm(container) {

    if (!latestGeneratedCode.html &&
        !latestGeneratedCode.css &&
        !latestGeneratedCode.js) {

        return;
    }

    const existingDialog =
        container.querySelector(".ai-publish-dialog");

    if (existingDialog) {
        existingDialog.remove();
    }

    const dialog =
        document.createElement("div");

    dialog.className =
        "ai-publish-dialog";

    dialog.innerHTML = `
        <div class="ai-publish-box">

            <h3>نشر التطبيق كلعبة على الموقع</h3>

            <label>
                اسم اللعبة/التطبيق
                <input type="text" id="aiPublishName" required>
            </label>

            <label>
                وصف مختصر
                <textarea id="aiPublishDescription"></textarea>
            </label>

            <div class="ai-publish-message" id="aiPublishMessage"></div>

            <div class="game-form-actions">

                <button type="button" class="btn-primary" id="aiConfirmPublish">
                    نشر الآن
                </button>

                <button type="button" class="btn-secondary" id="aiCancelPublish">
                    إلغاء
                </button>

            </div>

        </div>
    `;

    container.querySelector(".ai-panel-files")
        .appendChild(dialog);

    dialog.querySelector("#aiCancelPublish")
        .addEventListener("click", () => dialog.remove());

    dialog.querySelector("#aiConfirmPublish")
        .addEventListener("click", async () => {

            const nameInput =
                dialog.querySelector("#aiPublishName");

            const descriptionInput =
                dialog.querySelector("#aiPublishDescription");

            const messageBox =
                dialog.querySelector("#aiPublishMessage");

            const name =
                nameInput.value.trim();

            if (!name) {

                messageBox.textContent =
                    "اكتب اسمًا للتطبيق أولًا.";

                return;
            }

            const confirmButton =
                dialog.querySelector("#aiConfirmPublish");

            confirmButton.disabled =
                true;

            try {

                await window.StoryHubGames.saveGameRecord({

                    name,

                    description:
                        descriptionInput.value.trim(),

                    html: latestGeneratedCode.html,
                    css: latestGeneratedCode.css,
                    js: latestGeneratedCode.js

                }, message => {

                    messageBox.textContent =
                        message;
                });

                messageBox.textContent =
                    "✅ تم النشر بنجاح! تقدر تشوفه من صفحة الألعاب.";

                setTimeout(() => dialog.remove(), 1800);

            } catch (error) {

                console.error(
                    "❌ Story Hub AI: خطأ أثناء النشر.",
                    error
                );

                messageBox.textContent =
                    error.message || "حدث خطأ أثناء النشر.";

                confirmButton.disabled =
                    false;
            }
        });
}


/* =========================================================
   حماية بسيطة من HTML Injection
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

window.StoryHubAI = {

    renderAIAssistantPage

};


/* =========================================================
   نهاية ai-assistant.js
   ========================================================= */
