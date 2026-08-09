/* =========================================
   Astology Hub
   تشغيل الأزرار والقائمة
   ========================================= */

"use strict";


/* =========================================
   عناصر القائمة
   ========================================= */

const navigationButtons =
    document.querySelectorAll(".nav-button");

const mainContent =
    document.getElementById("mainContent");

const sidebar =
    document.getElementById("sidebar");

const menuToggle =
    document.getElementById("menuToggle");


/* =========================================
   فتح وإغلاق القائمة
   ========================================= */

menuToggle.addEventListener("click", () => {

    document.body.classList.toggle(
        "sidebar-collapsed"
    );

    const isCollapsed =
        document.body.classList.contains(
            "sidebar-collapsed"
        );

    menuToggle.setAttribute(
        "aria-expanded",
        String(!isCollapsed)
    );

});


/* =========================================
   أزرار التنقل
   ========================================= */

navigationButtons.forEach((button) => {

    button.addEventListener("click", () => {

        navigationButtons.forEach((item) => {

            item.classList.remove("active");

        });

        button.classList.add("active");

        const page =
            button.dataset.page;

        handleNavigation(page);

    });

});


/* =========================================
   محتوى الصفحات
   ========================================= */

function renderHomePage(target) {

    if (!target) {
        return;
    }

    target.innerHTML = `
        <section class="hero-section">

            <div class="hero-inner">

                <div class="hero-text">
                    <h1>Story Hub — منصة الألعاب</h1>
                    <p>ألعاب، تحديثات، أخبار، ومحتوى مُختار لك. ابدأ بالبحث أو استكشف الألعاب المميزة.</p>

                    <div class="search-bar">
                        <input id="siteSearch" type="search" placeholder="ابحث عن لعبة أو تصنيف...">
                        <button id="searchBtn">🔎 بحث</button>
                    </div>

                </div>

                <div class="hero-visual">
                    <div class="hero-card">🎮</div>
                </div>

            </div>

        </section>

        <section class="section" id="featured">
            <div class="section-header">
                <h2>ألعاب مميزة ⭐</h2>
                <a href="#">عرض الكل</a>
            </div>

            <div class="games-grid">
                <article class="game-card">
                    <div class="game-thumb">🐍</div>
                    <div class="game-body">
                        <h3>Snake Classic</h3>
                        <p class="game-desc">لعبة كلاسيكية ممتعة وسهلة اللعب.</p>
                        <div class="game-meta">
                            <span>حجم: 1.2MB</span>
                            <span>تحديث: 2026-07-20</span>
                        </div>
                    </div>
                    <div class="game-actions">
                        <button class="btn-play">تشغيل</button>
                        <button class="btn-download">تحميل</button>
                    </div>
                </article>

                <article class="game-card">
                    <div class="game-thumb">⚽</div>
                    <div class="game-body">
                        <h3>Mini Soccer</h3>
                        <p class="game-desc">مباراة سريعة مع تحكم بسيط.</p>
                        <div class="game-meta">
                            <span>حجم: 2.8MB</span>
                            <span>تحديث: 2026-06-01</span>
                        </div>
                    </div>
                    <div class="game-actions">
                        <button class="btn-play">تشغيل</button>
                        <button class="btn-download">تحميل</button>
                    </div>
                </article>

                <article class="game-card">
                    <div class="game-thumb">🧩</div>
                    <div class="game-body">
                        <h3>Puzzle Mania</h3>
                        <p class="game-desc">ألغاز ذهنية تتحداك وتسلّيك.</p>
                        <div class="game-meta">
                            <span>حجم: 3.6MB</span>
                            <span>تحديث: 2026-08-01</span>
                        </div>
                    </div>
                    <div class="game-actions">
                        <button class="btn-play">تشغيل</button>
                        <button class="btn-download">تحميل</button>
                    </div>
                </article>
            </div>
        </section>

        <section class="section" id="latest">
            <div class="section-header">
                <h2>أحدث الألعاب 🆕</h2>
                <a href="#">عرض الكل</a>
            </div>
            <div class="games-grid small">
                <div class="empty">سيتم إضافة أحدث الألعاب هنا.</div>
            </div>
        </section>

        <section class="section" id="updates">
            <div class="section-header">
                <h2>آخر التحديثات 🔄</h2>
                <a href="#">عرض الكل</a>
            </div>
            <div class="updates-list">
                <p>قائمة التحديثات ستظهر هنا.</p>
            </div>
        </section>

        <section class="section" id="news">
            <div class="section-header">
                <h2>الأخبار 📰</h2>
                <a href="#">عرض الكل</a>
            </div>
            <div class="news-list">
                <p>أحدث الأخبار سيتم عرضها هنا.</p>
            </div>
        </section>
    `;
}

function handleNavigation(page) {

    switch (page) {

        case "home":

            renderHomePage(mainContent);

            break;


        case "games":

            if (window.StoryHubGames) {

                window.StoryHubGames.renderGamesPage(mainContent);

            } else {

                mainContent.innerHTML = `
                    <section class="home-section">
                        <h1>الألعاب</h1>
                        <p>جاري تحميل نظام الألعاب...</p>
                    </section>
                `;
            }

            break;


        case "updates":

            if (window.StoryHubGames) {

                window.StoryHubGames.renderUpdatesPage(mainContent);

            } else {

                mainContent.innerHTML = `
                    <section class="home-section">
                        <h1>تحديثات الألعاب</h1>
                        <p>جاري تحميل نظام التحديثات...</p>
                    </section>
                `;
            }

            break;


        case "profile":

            if (window.StoryHubAuth) {

                window.StoryHubAuth.renderProfilePage(mainContent);

            } else {

                mainContent.innerHTML = `
                    <section class="home-section">
                        <h1>الحساب</h1>

                    </section>
                `;
            }

            break;

        case "ai":

            if (window.StoryHubAI) {

                window.StoryHubAI.renderAIAssistantPage(mainContent);

            } else {

                mainContent.innerHTML = `
                    <section class="home-section">
                        <h1>المساعد الذكي</h1>
                        <p>جاري تحميل المساعد الذكي...</p>
                    </section>
                `;
            }

            break;


        case "news":

            if (window.StoryHubNews) {

                window.StoryHubNews.renderNewsPage(mainContent);

            } else {

                mainContent.innerHTML = `
                    <section class="home-section">
                        <h1>آخر الأخبار</h1>
                        <p>جاري تحميل الأخبار...</p>
                    </section>
                `;
            }

            break;


        default:

            console.warn(
                "الصفحة المطلوبة غير موجودة:",
                page
            );

    }

}