// Generates an AGENTS.md dropped into a new project folder. It documents the
// project.json data model and every block type so that AI agents (and humans)
// can read, edit, and author Scormly courses by editing project.json directly.
//
// BLOCK_DOCS is typed as Record<BlockType, ...>, so adding a new block type to
// the union forces a matching entry here — the guide can't silently fall behind.

import type { BlockType, Course } from '../types/course'

export const AGENT_GUIDE_FILE = 'AGENTS.md'

interface BlockDoc {
  /** One-line purpose. */
  summary: string
  /** TS-like shape of the block's `data` field. */
  data: string
}

const BLOCK_DOCS: Record<BlockType, BlockDoc> = {
  heading: {
    summary: 'Section heading (H1–H3).',
    data: `{ level: 1 | 2 | 3, text: string, align?: 'left' | 'center' | 'right' }`,
  },
  paragraph: {
    summary: 'Rich text paragraph.',
    data: `{ html: string }  // sanitized rich-text HTML (<p>, <strong>, <em>, <a>, <ul>/<ol>, <img>)`,
  },
  list: {
    summary: 'Bulleted or numbered list.',
    data: `{ ordered: boolean, items: string[] }`,
  },
  note: {
    summary: 'Callout box (note or warning).',
    data: `{ variant: 'note' | 'warning', text: string }`,
  },
  image: {
    summary: 'Single image with optional caption.',
    data: `{ src: string, alt: string, caption?: string }  // src: relative path under assets/images/ (or a data: URL)`,
  },
  gallery: {
    summary: 'Grid of images.',
    data: `{ images: { src: string, alt: string, caption?: string }[] }`,
  },
  video: {
    summary: 'HTML5 video from a local file.',
    data: `{ src: string, poster?: string, requireWatch?: boolean }  // src: relative path under assets/videos/; requireWatch: learner must watch ~95% before moving on`,
  },
  audio: {
    summary: 'HTML5 audio from a local file.',
    data: `{ src: string }  // relative path under assets/audio/`,
  },
  embed: {
    summary: 'Embedded iframe (YouTube, Vimeo, or any https page).',
    data: `{ url: string, title?: string }`,
  },
  code: {
    summary: 'Monospaced code snippet.',
    data: `{ code: string, language?: string }`,
  },
  table: {
    summary: 'Simple table; every row has the same number of columns.',
    data: `{ header: boolean, rows: string[][] }  // header=true → first row is <th>`,
  },
  quote: {
    summary: 'Highlighted quotation.',
    data: `{ text: string, author?: string }`,
  },
  continue: {
    summary: 'Continue button / page gate.',
    data: `{ mode: 'unrestricted' | 'restricted', label: string }  // restricted hides later blocks until clicked`,
  },
  divider: {
    summary: 'Horizontal separator.',
    data: `{ style: 'solid' | 'dashed' | 'dotted' }`,
  },
  courseOutline: {
    summary: 'Auto-generated links to the other lessons (excludes the lesson it is in).',
    data: `{ title: string, numbered: boolean }  // the lesson list is derived live; not stored here`,
  },
  tabs: {
    summary: 'Tabbed content panels.',
    data: `{ tabs: { id: string, title: string, html: string }[] }`,
  },
  accordion: {
    summary: 'Collapsible sections.',
    data: `{ items: { id: string, title: string, html: string }[] }`,
  },
  flashcards: {
    summary: 'Flip cards (front/back).',
    data: `{ cards: { id: string, front: string, back: string }[] }`,
  },
  scenario: {
    summary: 'Branching dialogue trainer.',
    data: `{
    characterName: string,
    startNodeId: string,
    layout?: 'classic' | 'chat',  // 'chat' = phone-messenger style (default 'classic')
    userAvatar?: string,          // chat layout: learner's avatar on their replies (assets/ path)
    characterImages: { neutral?: string, happy?: string, concerned?: string },
    nodes: {
      id: string,
      text: string,
      emotion: 'neutral' | 'happy' | 'concerned',
      choices: { id: string, text: string, nextNodeId: string | null, setEmotion?: 'neutral' | 'happy' | 'concerned' }[]
    }[]
  }  // nextNodeId: null ends the scenario`,
  },
  quiz: {
    summary: 'Graded questions (single / multiple choice, or matching).',
    data: `{
    passingScore: number,  // 0–100
    showAnswers?: boolean,  // reveal correct answers after submitting (default true)
    questions: (
      | { id: string, type: 'single' | 'multiple', prompt: string, feedback?: string,
          options: { id: string, text: string, correct: boolean, feedback?: string }[] }
      | { id: string, type: 'matching', prompt: string, feedback?: string,
          pairs: { id: string, left: string, right: string }[] }
    )[]
  }`,
  },
  hotspot: {
    summary: 'Image with numbered clickable markers; each opens a card with a title and text (not scored).',
    data: `{
    src: string,  // relative path under assets/images/
    alt: string,
    hotspots: { id: string, x: number, y: number, title: string, text: string }[]
  }  // x/y: marker position as a percentage (0–100) of the image width/height`,
  },
  timeline: {
    summary: 'Timeline or process steps (not scored).',
    data: `{
    layout: 'vertical' | 'stepper',  // stepper = one step at a time with Previous/Next
    items: { id: string, label: string, title: string, text: string }[]
  }  // label: short marker such as a date or "Step 1"`,
  },
}

function blockReference(): string {
  return (Object.keys(BLOCK_DOCS) as BlockType[])
    .map((type) => {
      const doc = BLOCK_DOCS[type]
      return `#### \`${type}\`\n${doc.summary}\n\n\`\`\`ts\ndata: ${doc.data}\n\`\`\``
    })
    .join('\n\n')
}

export function buildAgentGuide(course: Course): string {
  const firstLesson = course.lessons[0]?.id ?? 'lesson-...'

  return `# Scormly course — agent guide

This folder is a **Scormly** project. The entire course lives in
[\`project.json\`](./project.json) — a single JSON file you can read and edit
directly to author or modify the course. Scormly is a local-first course builder
that exports to SCORM 1.2 / 2004 and cmi5 (xAPI).

> Edit \`project.json\` while the project is **closed** in the Scormly app (or
> reopen it afterwards), so your changes aren't overwritten by autosave. Keep the
> JSON valid and every \`id\` unique.

## Data model

\`\`\`
Course
└─ lessons: Lesson[]
   └─ blocks: Block[]
\`\`\`

### Course

\`\`\`ts
{
  id: string,
  title: string,
  description: string,
  coverImage?: string,
  theme: 'rose' | 'ocean' | 'forest' | 'sunset',
  settings: {
    completion: 'view' | 'quiz',   // 'quiz' also requires every quiz answered
    scored: boolean,               // report a pass/fail result
    passingScore: number,          // 0–100, used when scored
    navigation: 'free' | 'linear', // linear: Next unlocks once the lesson's gates/quizzes are done
    playerLanguage?: 'auto' | 'en' | 'uk', // player UI language; 'auto' (default) = LMS/browser language
    showProgress?: boolean,        // show "Lesson n of N" in the player header (default true)
    finishMessage?: string         // completion-screen text; empty/omitted = built-in message
  },
  lessons: Lesson[]
}
\`\`\`

### Lesson

\`\`\`ts
{ id: string, title: string, status: 'draft' | 'published', blocks: Block[] }
\`\`\`

### Block

Every block is \`{ id: string, type: BlockType, settings: { spacing?: 'compact' | 'normal' | 'spacious' }, data: <type-specific> }\`.
The \`type\` field selects the shape of \`data\` (a discriminated union).

## Block types

${blockReference()}

## Authoring rules

- **IDs**: every \`id\` (course, lesson, block, and nested items like quiz
  options, scenario nodes, tabs) must be unique within the file. Any unique
  string works; the app uses a short prefix + random suffix (e.g. \`block-x7f3a9\`).
- **Adding content**: append a block object to a lesson's \`blocks\` array, or a
  whole lesson to \`lessons\`. Order in the array = order shown to the learner.
- **Rich text** (\`paragraph\`, \`tabs\`, \`accordion\`): \`html\` is a small subset
  of HTML. Inline images use relative \`assets/\` paths.
- **Media**: reference files by relative path under \`assets/images/\`,
  \`assets/videos/\`, or \`assets/audio/\`. Put the files there too. A \`data:\` URL
  also works but bloats the file.
- **Media formats**: images PNG/JPEG/WebP/GIF/SVG, video MP4/WebM, audio
  MP3/OGG/WAV/M4A. Other formats are rejected by the app.
- **Quizzes**: for \`single\`/\`multiple\`, mark correct options with
  \`correct: true\` (at least one; give at least 2 options). For \`matching\`,
  the correct match for each pair is its own \`right\` value — keep every
  \`right\` text unique within a question (learners pick answers by that text),
  and give at least 2 pairs.
- **Scenarios**: \`startNodeId\` and every non-null \`nextNodeId\` must be the
  \`id\` of a node in the same scenario.
- **Don't** invent block \`type\`s or \`data\` fields beyond those listed above —
  unknown blocks are ignored by the player.

## Before you finish — quality checklist

Scormly runs these checks before exporting and warns the author; a course that
passes them is ready to export:

- the course has at least one lesson, and no lesson is empty;
- image / video / audio blocks have a \`src\`, galleries have at least one
  image, embeds have a \`url\`;
- quizzes have questions; every question has text, enough options/pairs and a
  correct answer, and matching answers are unique;
- scenarios start at an existing node and have no links to missing nodes.

## Typical agent workflow

1. Read \`project.json\` (and this guide) to understand the current course.
2. Make your edits — add lessons/blocks, rewrite text, build quizzes — keeping
   ids unique and the JSON valid.
3. Walk through the checklist above.
4. Ask the author to reopen the project in Scormly to review, preview and export
   (SCORM 2004 / 1.2 or cmi5). Exporting happens in the app, not from the file.

## Minimal example

\`\`\`json
{
  "id": "${course.id}",
  "title": "${course.title.replace(/"/g, '\\"')}",
  "description": "",
  "theme": "${course.theme}",
  "settings": { "completion": "quiz", "scored": true, "passingScore": 80, "navigation": "free" },
  "lessons": [
    {
      "id": "${firstLesson}",
      "title": "Lesson 1",
      "status": "draft",
      "blocks": [
        { "id": "block-1", "type": "heading", "settings": {}, "data": { "level": 1, "text": "Welcome" } },
        { "id": "block-2", "type": "paragraph", "settings": {}, "data": { "html": "<p>Hello, learner!</p>" } }
      ]
    }
  ]
}
\`\`\`

_Generated by Scormly. It is rewritten whenever the project is opened in a newer
version, so don't keep notes here — edits will be replaced. Scormly never reads
it back; deleting it is harmless (it is recreated on the next open)._
`
}
