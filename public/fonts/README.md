# OWNIT bundled fonts

These files self-host the Latin WOFF2 variable fonts already used by the project. They were copied from the existing Next.js build's Google Fonts cache without modifying the font binaries, so development and page rendering do not depend on a live Google Fonts request.

| Font file | Family | Upstream project | Licence |
| --- | --- | --- | --- |
| archivo-latin.woff2 | Archivo | https://github.com/Omnibus-Type/Archivo | Archivo-OFL.txt |
| inter-latin.woff2 | Inter | https://github.com/rsms/inter | Inter-OFL.txt |
| caveat-latin.woff2 | Caveat | https://github.com/googlefonts/caveat | Caveat-OFL.txt |

The three complete copyright and SIL Open Font License notices were retrieved on 2026-09-27 from the official Google Fonts repository:

- https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/OFL.txt
- https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt
- https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/OFL.txt

Keep each licence alongside its font when redistributing the project. The bundled subsets cover Latin text; other scripts use the CSS fallback fonts.
