import type { Language } from '../i18n/types'

// Builder release notes for the "What's new" dialog, newest first. Add an
// entry when shipping user-visible changes; the id doubles as the "seen" marker
// (a new id lights up the Help badge once for returning authors).
export interface Release {
  id: string
  date: string
  items: Record<Language, string[]>
}

export const RELEASES: Release[] = [
  {
    id: '2026-10-06-2',
    date: '2026-10-06',
    items: {
      en: [
        'SCORM packages now include the official ADL/IMS schema files, for older LMSes and validating importers; every manifest is checked against them.',
        'The player speaks the course’s language: with “Automatic” player language, an English course gets English buttons even in a Ukrainian browser or LMS profile.',
        'Finishing with activities still unanswered no longer shows “Course complete”: the player says the course isn’t complete yet and links to the unfinished lessons.',
        'A passed or completed course stays that way in the LMS, even if the learner retakes a quiz with a lower score.',
        'The player now uses the LMS’s passing score when the LMS sets one, so the result on screen matches what the LMS records.',
        'More reliable tracking: resume and time spent are saved even when the browser blocks the final save on closing, and “Exit course” returns to the LMS in SCORM 2004 too.',
      ],
      uk: [
        'SCORM-пакети тепер містять офіційні файли схем ADL/IMS для старіших LMS і валідаторів під час імпорту; кожен маніфест перевіряється за ними.',
        'Плеєр говорить мовою курсу: з «Автоматичною» мовою плеєра англійський курс має англійські кнопки навіть в українському браузері чи профілі LMS.',
        'Завершення з завданнями без відповіді більше не показує «Курс завершено»: плеєр повідомляє, що курс ще не завершено, і дає посилання на незавершені уроки.',
        'Складений чи завершений курс лишається таким у LMS, навіть якщо слухач перескладе тест із нижчим балом.',
        'Плеєр тепер використовує прохідний бал з LMS, якщо LMS його задає, тож результат на екрані збігається з тим, що записує LMS.',
        'Надійніше відстеження: місце зупинки й витрачений час зберігаються, навіть коли браузер блокує останнє збереження при закритті, а «Вийти з курсу» повертає до LMS і в SCORM 2004.',
      ],
    },
  },
  {
    id: '2026-10-06',
    date: '2026-10-06',
    items: {
      en: [
        'Better LMS compatibility: SCORM 2004 manifests tell the LMS not to auto-complete the course on exit, and media file names are percent-encoded in manifests.',
        'The course title, description and content language are embedded as metadata in SCORM 2004 packages, so LMS catalogs can show them after import.',
        'A completed course now reopens where the learner finished instead of restarting, and retaking a quiz from the “Review the course” screen is still tracked.',
        'New “Exit course” button on the completion screen: returns the learner to the LMS (cmi5) or closes the course window.',
      ],
      uk: [
        'Краща сумісність із LMS: маніфести SCORM 2004 забороняють LMS автоматично позначати курс завершеним при виході, а імена медіафайлів у маніфестах кодуються у відсотковому форматі.',
        'Назва, опис і мова контенту курсу тепер вбудовуються як метадані в пакети SCORM 2004, тож каталоги LMS показують їх після імпорту.',
        'Завершений курс тепер відкривається там, де слухач закінчив, а не спочатку; перепроходження тесту з екрана «Переглянути курс» також відстежується.',
        'Нова кнопка «Вийти з курсу» на фінальному екрані: повертає слухача до LMS (cmi5) або закриває вікно курсу.',
      ],
    },
  },
  {
    id: '2026-09-30',
    date: '2026-09-30',
    items: {
      en: [
        'Five new project themes: Mono, Indigo and Crimson with sharp square corners, soft rounded Mint and pill-shaped Grape.',
        'Terminal theme for hackers: monospace font and phosphor-green terminal buttons.',
        'Exported courses now match the theme’s button and card shapes, not just its color.',
        'Accessible courses: a learner accessibility menu (text size, high contrast, readable spacing, reduced motion), full keyboard and screen-reader support, and AA contrast in every theme.',
        'Captions (WebVTT) and transcripts for video and audio, a “decorative” flag for images, and a course content language.',
        'The course check now flags accessibility gaps before export: missing alt text, captions, transcripts, embed titles and content language.',
        'More reliable LMS tracking for SCORM and cmi5 exports; the player also respects the learner’s caption and language preferences from the LMS.',
      ],
      uk: [
        'П’ять нових тем проєкту: Mono, Indigo і Crimson з гострими прямими кутами, м’яка заокруглена Mint і Grape з кнопками-пігулками.',
        'Хакерська тема Terminal: моноширинний шрифт і зелені термінальні кнопки.',
        'Експортовані курси тепер повторюють форму кнопок і карток теми, а не лише її колір.',
        'Доступні курси: меню доступності для слухача (розмір тексту, висока контрастність, зручні інтервали, менше анімації), повна підтримка клавіатури й програм зчитування екрана та контраст рівня AA в усіх темах.',
        'Субтитри (WebVTT) і текстові розшифровки для відео й аудіо, позначка «декоративне» для зображень і мова контенту курсу.',
        'Перевірка курсу перед експортом тепер знаходить прогалини доступності: відсутні alt-тексти, субтитри, розшифровки, назви вбудованого контенту й мову контенту.',
        'Надійніше відстеження в LMS для експорту SCORM і cmi5; плеєр також враховує налаштування субтитрів і мови слухача з LMS.',
      ],
    },
  },
  {
    id: '2026-09-29',
    date: '2026-09-29',
    items: {
      en: [
        'Four new interactive blocks: image hotspots, timeline / process steps, and two scored exercises — sort / order and fill in the blanks — that report to the LMS like quizzes.',
        'Redesigned project settings with tabs, plus new options: player language, show or hide lesson progress, and a custom finish message.',
        'A Help menu with a guided tour, builder Q&A and release notes.',
        'Insert a block anywhere: hover between two blocks and press “+”.',
        'Undo right from the notification after deleting a block or lesson.',
        'Export now checks the course first (empty lessons, missing media, quiz questions without a correct answer…).',
        'Clear messages when an export, save or upload fails, with Retry for saving.',
        'Keyboard shortcuts help (press ?), full keyboard support in menus and dialogs, and reordering lessons and blocks from the keyboard.',
        'Block counts in the lesson list, new lessons open ready to rename.',
        'cmi5: learners now resume where they left off, and the LMS language preference is respected.',
        'The AGENTS.md guide in every project now covers every block, the course check rules and a workflow for AI assistants.',
      ],
      uk: [
        'Чотири нові інтерактивні блоки: hotspots на зображенні, таймлайн / кроки процесу і дві оцінювані вправи — сортування та заповнення пропусків, які звітують у LMS як тести.',
        'Оновлені налаштування проєкту з вкладками й нові опції: мова плеєра, показ прогресу уроків і власний текст фінального екрана.',
        'Меню «Довідка» з туром, питаннями й відповідями та списком змін.',
        'Вставляйте блок будь-де: наведіть між двома блоками й натисніть «+».',
        'Скасування просто зі сповіщення після видалення блоку чи уроку.',
        'Перед експортом курс перевіряється (порожні уроки, відсутні медіа, питання без правильної відповіді…).',
        'Зрозумілі повідомлення, коли експорт, збереження чи завантаження файлу не вдалися, і «Повторити» для збереження.',
        'Довідка з гарячими клавішами (натисніть ?), повна підтримка клавіатури в меню й діалогах і зміна порядку уроків і блоків з клавіатури.',
        'Кількість блоків у списку уроків; новий урок одразу можна перейменувати.',
        'cmi5: слухачі продовжують з місця, де зупинилися, а мова з LMS враховується.',
        'Інструкція AGENTS.md у кожному проєкті тепер описує всі блоки, правила перевірки курсу й порядок роботи для AI-асистентів.',
      ],
    },
  },
  {
    id: '2026-05-23',
    date: '2026-05-23',
    items: {
      en: [
        'cmi5 (xAPI) export next to SCORM 2004 and 1.2.',
        'Course outline block, chat layout for dialogue scenarios, required video watching and step-by-step navigation.',
        'Richer LMS reporting: per-quiz objectives, detailed question interactions, learner name and language.',
        'Download a project as a .zip to share it.',
      ],
      uk: [
        'Експорт cmi5 (xAPI) поруч із SCORM 2004 і 1.2.',
        'Блок «Зміст курсу», чат-вигляд для діалогових сценаріїв, обов’язковий перегляд відео й покрокова навігація.',
        'Детальніші звіти в LMS: цілі для кожного тесту, докладні відповіді на питання, ім’я та мова слухача.',
        'Завантаження проєкту як .zip, щоб поділитися ним.',
      ],
    },
  },
]

export const LATEST_RELEASE = RELEASES[0].id
