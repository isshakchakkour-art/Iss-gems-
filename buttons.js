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

async function renderHomePage(target) {

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

            <div class="games-grid" id="featuredGamesList">
                <div class="empty">جاري تحميل الألعاب المميزة...</div>
            </div>
        </section>

        <section class="section" id="latest">
            <div class="section-header">
                <h2>أحدث الألعاب 🆕</h2>
                <a href="#">عرض الكل</a>
            </div>
            <div class="games-grid small" id="latestGamesList">
                <div class="empty">جاري تحميل أحدث الألعاب...</div>
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

    const featuredGamesList = target.querySelector("#featuredGamesList");
    const latestGamesList = target.querySelector("#latestGamesList");

    if (window.StoryHubGames?.getFeaturedGames) {

        try {

            const featuredGames = await window.StoryHubGames.getFeaturedGames(3);

            if (featuredGames.length > 0) {

                featuredGamesList.innerHTML = featuredGames.map(game => `
                    <article class="game-card">
                        <div class="game-card-image">
                            ${game.imageURL ? `<img src="${game.imageURL}" alt="${game.name}" onerror="this.parentElement.textContent='🎮'">` : "🎮"}
                        </div>
                        <div class="game-card-body">
                            <h3>${game.name || "لعبة"}</h3>
                            <p>${game.description || "لا يوجد وصف متاح."}</p>
                            <div class="game-card-meta">
                                <span>الإصدار: ${game.version || 1}</span>
                            </div>
                        </div>
                    </article>
                `).join("");
            } else {

                featuredGamesList.innerHTML = '<div class="empty">لا توجد ألعاب مميزة بعد.</div>';
            }

            const latestGames = featuredGames.slice(0, 2);

            if (latestGames.length > 0) {

                latestGamesList.innerHTML = latestGames.map(game => `
                    <article class="game-card">
                        <div class="game-card-image small">
                            ${game.imageURL ? `<img src="${game.imageURL}" alt="${game.name}" onerror="this.parentElement.textContent='🎮'">` : "🎮"}
                        </div>
                        <div class="game-card-body">
                            <h3>${game.name || "لعبة"}</h3>
                            <p>${game.description || ""}</p>
                        </div>
                    </article>
                `).join("");
            } else {

                latestGamesList.innerHTML = '<div class="empty">لا توجد ألعاب حديثة بعد.</div>';
            }

        } catch (error) {

            console.error("❌ Story Hub: تعذّرت قراءة الألعاب المميزة.", error);
            featuredGamesList.innerHTML = '<div class="empty">تعذر تحميل الألعاب الآن.</div>';
            latestGamesList.innerHTML = '<div class="empty">تعذر تحميل الألعاب الآن.</div>';
        }
    }
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