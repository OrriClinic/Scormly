// SCORM manifest generation (src/export/scormManifest.ts).

import { describe, test, expect } from 'vitest'
import { buildManifest } from '../src/export/scormManifest'
import type { Course } from '../src/types/course'

function course(overrides: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    title: 'My <Course> & "Друзі"',
    description: 'What the course is about',
    theme: 'rose',
    settings: {
      completion: 'quiz',
      scored: true,
      passingScore: 80,
      navigation: 'free',
      contentLanguage: 'uk',
    },
    lessons: [
      {
        id: 'l1',
        title: 'L1',
        blocks: [
          {
            id: 'q1',
            type: 'quiz',
            settings: {},
            data: { questions: [], passingScore: 70, shuffle: false },
          },
        ],
      },
    ],
    ...overrides,
  } as unknown as Course
}

const FILES = ['index.html', 'player.js', 'assets/фото уроку (1).png']

describe('buildManifest — both versions', () => {
  test.each(['1.2', '2004'] as const)('%s: hrefs are %%-encoded valid URIs', (v) => {
    const xml = buildManifest(course(), FILES, v)
    expect(xml).toContain(
      '<file href="assets/%D1%84%D0%BE%D1%82%D0%BE%20%D1%83%D1%80%D0%BE%D0%BA%D1%83%20(1).png" />',
    )
    expect(xml).not.toContain('href="assets/фото')
  })

  test.each(['1.2', '2004'] as const)('%s: title is XML-escaped', (v) => {
    const xml = buildManifest(course(), FILES, v)
    expect(xml).toContain('My &lt;Course&gt; &amp; &quot;Друзі&quot;')
  })
})

describe('buildManifest — SCORM 2004', () => {
  test('declares the mastery score as minNormalizedMeasure', () => {
    const xml = buildManifest(course(), FILES, '2004', 80)
    expect(xml).toContain('satisfiedByMeasure="true"')
    expect(xml).toContain('<imsss:minNormalizedMeasure>0.80</imsss:minNormalizedMeasure>')
  })

  test('declares one objective per scored block', () => {
    const xml = buildManifest(course(), FILES, '2004', 80)
    expect(xml).toContain('objectiveID="QUIZ_q1"')
  })

  test('always declares completionSetByContent/objectiveSetByContent', () => {
    // Without these the LMS may auto-complete the SCO on exit, overriding the
    // player's reported status — even for unscored courses.
    const unscored = course({ lessons: [] })
    for (const xml of [buildManifest(course(), FILES, '2004', 80), buildManifest(unscored, FILES, '2004')]) {
      expect(xml).toContain(
        '<imsss:deliveryControls completionSetByContent="true" objectiveSetByContent="true" />',
      )
    }
  })

  test('embeds LOM metadata with title, description and language', () => {
    const xml = buildManifest(course(), FILES, '2004')
    expect(xml).toContain('xmlns:lom="http://ltsc.ieee.org/xsd/LOM"')
    expect(xml).toContain('<lom:string language="uk">What the course is about</lom:string>')
    expect(xml).toContain('<lom:language>uk</lom:language>')
  })
})

describe('buildManifest — SCORM 1.2', () => {
  test('declares the mastery score via adlcp:masteryscore', () => {
    const xml = buildManifest(course(), FILES, '1.2', 80)
    expect(xml).toContain('<adlcp:masteryscore>80</adlcp:masteryscore>')
  })

  test('embeds IMS MD metadata with title, description and language', () => {
    const xml = buildManifest(course(), FILES, '1.2')
    expect(xml).toContain('xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1"')
    expect(xml).toContain('<imsmd:langstring xml:lang="uk">What the course is about</imsmd:langstring>')
    expect(xml).toContain('<imsmd:language>uk</imsmd:language>')
  })

  test('omits the description element when the course has none', () => {
    const xml = buildManifest(course({ description: '' }), FILES, '1.2')
    expect(xml).not.toContain('imsmd:description')
  })

  test('defaults the metadata language to en', () => {
    const c = course()
    delete c.settings!.contentLanguage
    const xml = buildManifest(c, FILES, '1.2')
    expect(xml).toContain('<imsmd:language>en</imsmd:language>')
  })
})
