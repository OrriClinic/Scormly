import { useCourseStore } from '../store/courseStore'

/** True when a key event comes from a place where the user is typing. */
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return (
    !!el &&
    (el.isContentEditable ||
      el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT')
  )
}

/** Editor shortcuts must not reach the course underneath an open overlay. */
export function editorShortcutsBlocked(): boolean {
  const s = useCourseStore.getState()
  return s.previewOpen || s.settingsOpen
}
