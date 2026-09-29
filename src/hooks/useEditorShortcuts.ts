import { useEffect } from 'react'
import { useCourseStore } from '../store/courseStore'
import { editorShortcutsBlocked, isEditableTarget } from '../lib/keyboard'
import { deleteBlockWithUndo } from '../lib/deleteWithUndo'

// Editor keyboard shortcuts acting on the selected block:
//   Delete, Backspace — delete block
//   Ctrl/Cmd + D      — duplicate block
//   Alt + ↑ / ↓       — move block up / down
//   Escape            — deselect
// Ignored while typing in inputs / textareas / contentEditable (except Escape),
// and while the preview or settings overlay is open.
export function useEditorShortcuts() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (editorShortcutsBlocked()) return
      const s = useCourseStore.getState()
      const id = s.selectedBlockId
      if (!id) return
      const lesson = s.course.lessons.find((l) => l.id === s.activeLessonId)
      if (!lesson) return
      const index = lesson.blocks.findIndex((b) => b.id === id)
      if (index === -1) return

      if (e.key === 'Escape') {
        s.selectBlock(null)
        return
      }
      if (isEditableTarget(e.target)) return
      // Macs have no Delete key on laptops, so Backspace deletes too.
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteBlockWithUndo(lesson.id, id)
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        s.duplicateBlock(lesson.id, id)
      } else if (e.altKey && e.key === 'ArrowUp' && index > 0) {
        e.preventDefault()
        s.moveBlock(lesson.id, index, index - 1)
      } else if (
        e.altKey &&
        e.key === 'ArrowDown' &&
        index < lesson.blocks.length - 1
      ) {
        e.preventDefault()
        s.moveBlock(lesson.id, index, index + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
