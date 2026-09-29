// Export asset collection (src/export/packageCommon.ts).

import { describe, test, expect } from 'vitest'
import { collectAssetPaths } from '../src/export/packageCommon'
import type { Course } from '../src/types/course'

describe('collectAssetPaths', () => {
  test('includes the hotspot block image', () => {
    const course = {
      lessons: [{
        id: 'l', title: 'L', status: 'draft',
        blocks: [{
          id: 'b', type: 'hotspot', settings: {},
          data: { src: 'assets/images/map-1.png', alt: '', hotspots: [{ id: 'h', x: 1, y: 2, title: 't', text: '' }] },
        }],
      }],
    } as unknown as Course
    expect([...collectAssetPaths(course)]).toEqual(['assets/images/map-1.png'])
  })
})
