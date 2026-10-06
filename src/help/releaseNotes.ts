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
    id: '2026-10-06-3',
    date: '2026-10-06',
    items: {
      en: [
        'Design upgrade: block backgrounds from your theme (tint, color, gradient, dark) and padding, in the new “Block style” button.',
        'Ready-made blocks: statement, testimonial with photo, quote on image, image & text, text on image, full-width image, banners, key takeaways and more.',
        'Five quote styles, image sizes (small to full width), a photo carousel, an Image & text block, a spacer and an Attachment block for downloads.',
        'A course cover page (Introduction) before the first lesson, plus a lesson menu with progress and a “Next lesson” card for learners.',
        'Appearance settings: content width, typography, block entrance animations and lesson transitions.',
        'A Columns block (2–4 columns of text), full-width bands for photos and text, callouts (tip, success), paragraph styles and decorative dividers.',
        'Hover a block in the Add menu to see a live preview of how it will look.',
      ],
      uk: [
        'Оновлений дизайн: фон блоків із вашої теми (відтінок, колір, градієнт, темний) і відступи — у новій кнопці «Стиль блоку».',
        'Готові блоки: акцентна фраза, відгук із фото, цитата на зображенні, фото й текст, текст на фото, фото на всю ширину, банери, «Головне» та інші.',
        'П’ять стилів цитат, розміри зображень (від малого до всієї ширини), фотокарусель, блок «Фото й текст», відступ і блок «Вкладення» для файлів.',
        'Титульна сторінка курсу (Вступ) перед першим уроком, а для студентів — меню уроків із прогресом і картка «Наступний урок».',
        'Налаштування вигляду: ширина контенту, типографіка, анімація появи блоків і переходи між уроками.',
        'Блок «Колонки» (2–4 колонки тексту), смуги на всю ширину для фото й тексту, виноски (порада, успіх), стилі абзаців і декоративні розділювачі.',
        'Наведіть на блок у меню додавання, щоб побачити живе превʼю того, як він виглядатиме.',
      ],
    },
  },
  {
    id: '2026-10-06-2',
    date: '2026-10-06',
    items: {
      en: [
        'More reliable LMS tracking: resume, time spent and pass/fail reach the LMS more reliably, and a passed course stays passed.',
        'Stricter SCORM and cmi5 conformance, with the official schema files included for older LMSes.',
        'An honest completion screen: it says when the course isn’t complete or passed yet and links to the lessons to finish or retake.',
        'Player buttons follow the course language, and a new “Exit course” button returns to the LMS.',
      ],
      uk: [
        'Надійніше відстеження в LMS: місце зупинки, час і результат доходять до LMS надійніше, а складений курс лишається складеним.',
        'Суворіша відповідність SCORM і cmi5, а для старіших LMS у пакети додано офіційні файли схем.',
        'Чесний фінальний екран: повідомляє, якщо курс ще не завершено чи не складено, і дає посилання на уроки, які треба пройти чи перескласти.',
        'Кнопки плеєра говорять мовою курсу, а нова кнопка «Вийти з курсу» повертає до LMS.',
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
