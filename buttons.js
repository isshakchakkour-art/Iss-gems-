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

function handleNavigation(page) {

    switch (page) {

        case "home":

            mainContent.innerHTML = `
                <section class="home-section">
                    <h1>
                        مرحبًا بك في Astology Hub
                    </h1>

                    <p>
                        منصتك للألعاب والتحديثات وآخر الأخبار.
                    </p>
                </section>
            `;

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