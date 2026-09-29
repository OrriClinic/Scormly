import type { Block, Course } from '../types/course'

/** A problem worth fixing before export; `key` is an i18n key in `common`. */
export interface CourseIssue {
  key: string
  vars?: Record<string, string | number>
  lessonId?: string
  lessonTitle?: string
  blockId?: string
}

type BlockIssue = Pick<CourseIssue, 'key' | 'vars'>

// Content that exports fine but would confuse or block learners: empty media,
// quizzes that can't be answered correctly, dangling scenario links, …
function checkBlock(block: Block): BlockIssue[] {
  switch (block.type) {
    case 'image':
      return block.data.src ? [] : [{ key: 'chkMissingImage' }]
    case 'gallery':
      return block.data.images.some((i) => i.src) ? [] : [{ key: 'chkEmptyGallery' }]
    case 'video':
      return block.data.src ? [] : [{ key: 'chkMissingVideo' }]
    case 'audio':
      return block.data.src ? [] : [{ key: 'chkMissingAudio' }]
    case 'embed':
      return block.data.url.trim() ? [] : [{ key: 'chkMissingEmbed' }]
    case 'quiz': {
      const qs = block.data.questions
      if (qs.length === 0) return [{ key: 'chkQuizEmpty' }]
      const out: BlockIssue[] = []
      qs.forEach((q, i) => {
        const n = i + 1
        if (!q.prompt.trim()) out.push({ key: 'chkQuestionNoPrompt', vars: { n } })
        if (q.type === 'matching') {
          if (q.pairs.length < 2) out.push({ key: 'chkMatchingFewPairs', vars: { n } })
          // The learner picks answers by their right-hand text, so repeated
          // texts make the question impossible to score reliably.
          const rights = q.pairs.map((p) => p.right.trim())
          if (new Set(rights).size !== rights.length) {
            out.push({ key: 'chkMatchingDuplicate', vars: { n } })
          }
        } else {
          if (q.options.length < 2) out.push({ key: 'chkFewOptions', vars: { n } })
          if (!q.options.some((o) => o.correct)) out.push({ key: 'chkNoCorrect', vars: { n } })
        }
      })
      return out
    }
    case 'scenario': {
      const { nodes, startNodeId } = block.data
      const ids = new Set(nodes.map((n) => n.id))
      if (nodes.length === 0 || !ids.has(startNodeId)) return [{ key: 'chkScenarioStart' }]
      const broken = nodes.some((n) =>
        n.choices.some((c) => c.nextNodeId !== null && !ids.has(c.nextNodeId)),
      )
      return broken ? [{ key: 'chkScenarioLink' }] : []
    }
    default:
      return []
  }
}

/** Lint the course before export. An empty list means nothing to report. */
export function checkCourse(course: Course): CourseIssue[] {
  if (course.lessons.length === 0) return [{ key: 'chkNoLessons' }]
  const issues: CourseIssue[] = []
  for (const lesson of course.lessons) {
    const at = { lessonId: lesson.id, lessonTitle: lesson.title }
    if (lesson.blocks.length === 0) {
      issues.push({ key: 'chkEmptyLesson', ...at })
      continue
    }
    for (const block of lesson.blocks) {
      for (const issue of checkBlock(block)) issues.push({ ...issue, ...at, blockId: block.id })
    }
  }
  return issues
}
