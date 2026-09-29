// Pre-export course lint (src/export/courseCheck.ts).

import { describe, test, expect } from 'vitest'
import { checkCourse } from '../src/export/courseCheck'
import type { Block, Course } from '../src/types/course'

function course(blocks: Block[][]): Course {
  return {
    title: 'C',
    lessons: blocks.map((b, i) => ({ id: `l${i}`, title: `L${i}`, status: 'draft', blocks: b })),
  } as unknown as Course
}
const block = (type: string, data: unknown, id = 'b') => ({ id, type, settings: {}, data }) as unknown as Block
const keys = (c: Course) => checkCourse(c).map((i) => i.key)

describe('checkCourse', () => {
  test('a course with content passes', () => {
    const quiz = block('quiz', {
      passingScore: 80,
      questions: [{ id: 'q', type: 'single', prompt: 'P', options: [{ id: 'a', text: 'A', correct: true }, { id: 'b', text: 'B', correct: false }] }],
    })
    expect(checkCourse(course([[block('heading', { level: 1, text: 'Hi' }), quiz]]))).toEqual([])
  })

  test('no lessons / empty lesson', () => {
    expect(keys(course([]))).toEqual(['chkNoLessons'])
    const issues = checkCourse(course([[]]))
    expect(issues).toEqual([{ key: 'chkEmptyLesson', lessonId: 'l0', lessonTitle: 'L0' }])
  })

  test('media without a file', () => {
    expect(keys(course([[
      block('image', { src: '', alt: '' }),
      block('gallery', { images: [{ src: '', alt: '' }] }),
      block('video', { src: '' }),
      block('audio', { src: '' }),
      block('embed', { url: '  ' }),
    ]]))).toEqual(['chkMissingImage', 'chkEmptyGallery', 'chkMissingVideo', 'chkMissingAudio', 'chkMissingEmbed'])
  })

  test('unanswerable quiz questions are reported with their number', () => {
    const quiz = block('quiz', {
      passingScore: 80,
      questions: [
        { id: 'q1', type: 'multiple', prompt: '', options: [{ id: 'a', text: 'A', correct: false }] },
        { id: 'q2', type: 'matching', prompt: 'M', pairs: [{ id: 'p1', left: 'x', right: 'same' }, { id: 'p2', left: 'y', right: 'same ' }] },
      ],
    }, 'quiz1')
    const issues = checkCourse(course([[quiz]]))
    expect(issues.map((i) => [i.key, i.vars?.n])).toEqual([
      ['chkQuestionNoPrompt', 1], ['chkFewOptions', 1], ['chkNoCorrect', 1], ['chkMatchingDuplicate', 2],
    ])
    expect(issues[0].blockId).toBe('quiz1')
    expect(keys(course([[block('quiz', { passingScore: 80, questions: [] })]]))).toEqual(['chkQuizEmpty'])
  })

  test('scenario start and dangling links', () => {
    const node = (id: string, next: string | null) => ({ id, text: 't', emotion: 'neutral', choices: [{ id: 'c', text: 'go', nextNodeId: next }] })
    expect(keys(course([[block('scenario', { characterImages: {}, characterName: 'A', startNodeId: 'x', nodes: [node('n1', null)] })]])))
      .toEqual(['chkScenarioStart'])
    expect(keys(course([[block('scenario', { characterImages: {}, characterName: 'A', startNodeId: 'n1', nodes: [node('n1', 'gone')] })]])))
      .toEqual(['chkScenarioLink'])
    expect(keys(course([[block('scenario', { characterImages: {}, characterName: 'A', startNodeId: 'n1', nodes: [node('n1', null)] })]])))
      .toEqual([])
  })
})
