// ============================================
// Story Hub
// animations.js
// ============================================

"use strict";


// ============================================
// شاشة البداية
// ============================================

const splashScreen =
    document.getElementById("splashScreen");


if (splashScreen) {

    window.addEventListener(
        "load",
        () => {

            /*
             * نترك شاشة البداية تعرض:
             *
             * الأيقونة
             * ثم Story Hub
             * ثم Welcome
             * ثم مرحبًا
             *
             * وبعدها تختفي.
             */

            setTimeout(
                () => {

                    splashScreen.classList.add(
                        "hide"
                    );

                },
                3200
            );

        }
    );

}