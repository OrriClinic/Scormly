import { useEffect, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCourseStore } from '../../store/courseStore'
import { deleteLessonWithUndo } from '../../lib/deleteWithUndo'
import type { Lesson } from '../../types/course'
import { useT } from '../../i18n/I18nProvider'

export default function Sidebar() {
  const course = useCourseStore((s) => s.course)
  const addLesson = useCourseStore((s) => s.addLesson)
  const moveLesson = useCourseStore((s) => s.moveLesson)
  const updateCourseMeta = useCourseStore((s) => s.updateCourseMeta)
  const sidebarOpen = useCourseStore((s) => s.sidebarOpen)
  const setSidebarOpen = useCourseStore((s) => s.setSidebarOpen)
  const setSettingsOpen = useCourseStore((s) => s.setSettingsOpen)
  const { t } = useT('common')
  const { t: ts } = useT('settings')
  const [editingId, setEditingId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Focus a drag handle, Space to pick up, arrows to move, Space to drop.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Esc closes the mobile drawer.
  useEffect(() => {
    if (!sidebarOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sidebarOpen, setSidebarOpen])

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    const from = course.lessons.findIndex((l) => l.id === e.active.id)
    const to = course.lessons.findIndex((l) => l.id === e.over!.id)
    if (from !== -1 && to !== -1) moveLesson(from, to)
  }

  return (
    <>
      {/* Backdrop for the mobile drawer. */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        data-tour="lessons"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-gray-50 transition-transform md:static md:z-auto md:w-64 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="border-b border-gray-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {t('course')}
        </p>
        <input
          value={course.title}
          aria-label={t('courseTitle')}
          placeholder={ts('titlePlaceholder')}
          onChange={(e) => updateCourseMeta({ title: e.target.value })}
          className="w-full truncate rounded bg-transparent text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
        />
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={course.lessons.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {course.lessons.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-gray-400">{t('noLessons')}</p>
            )}
            <ul className="space-y-1">
              {course.lessons.map((lesson, index) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  editing={editingId === lesson.id}
                  onStartEdit={() => setEditingId(lesson.id)}
                  onStopEdit={() => setEditingId(null)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </nav>

      <div className="space-y-1 border-t border-gray-200 p-2">
        <button
          type="button"
          onClick={() => {
            addLesson()
            // Name the new lesson right away instead of leaving "Lesson N".
            setEditingId(useCourseStore.getState().activeLessonId)
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-500 hover:border-brand hover:text-brand"
        >
          + {t('addLesson')}
        </button>
        <button
          type="button"
          data-tour="settings"
          onClick={() => {
            setSettingsOpen(true)
            setSidebarOpen(false)
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <span aria-hidden className="text-base leading-none">⚙</span>
          {ts('open')}
        </button>
      </div>
      </aside>
    </>
  )
}

interface SortableLessonProps {
  lesson: Lesson
  index: number
  editing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
}

function SortableLesson({
  lesson,
  index,
  editing,
  onStartEdit,
  onStopEdit,
}: SortableLessonProps) {
  const activeLessonId = useCourseStore((s) => s.activeLessonId)
  const setActiveLesson = useCourseStore((s) => s.setActiveLesson)
  const setSidebarOpen = useCourseStore((s) => s.setSidebarOpen)
  const renameLesson = useCourseStore((s) => s.renameLesson)
  const moveLesson = useCourseStore((s) => s.moveLesson)
  const lessonCount = useCourseStore((s) => s.course.lessons.length)
  const { t } = useT('common')
  const isActive = lesson.id === activeLessonId
  const blockCount = lesson.blocks.length

  function open() {
    setActiveLesson(lesson.id)
    setSidebarOpen(false)
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lesson.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <li ref={setNodeRef} style={style} className="group relative">
      <div
        role="button"
        tabIndex={0}
        aria-current={isActive ? 'page' : undefined}
        onClick={open}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            open()
          } else if (e.key === 'F2') {
            e.preventDefault()
            onStartEdit()
          } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            const to = index + (e.key === 'ArrowUp' ? -1 : 1)
            if (to < 0 || to >= lessonCount) return
            e.preventDefault()
            moveLesson(index, to)
            // The row re-renders in its new slot; keep keyboard focus on it.
            const row = e.currentTarget
            requestAnimationFrame(() => row.focus())
          }
        }}
        className={`flex w-full outline-none focus-visible:ring-2 focus-visible:ring-brand items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
          isActive
            ? 'bg-brand/10 font-medium text-brand-dark'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <button
          type="button"
          aria-label={t('drag')}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className={`flex h-5 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-xs ${
            isActive ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {index + 1}
        </button>

        {editing ? (
          <input
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            value={lesson.title}
            onChange={(e) => renameLesson(lesson.id, e.target.value)}
            onBlur={onStopEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') onStopEdit()
            }}
            onClick={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 rounded bg-white px-1 text-sm outline-none ring-1 ring-brand"
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation()
              onStartEdit()
            }}
            className="min-w-0 flex-1 truncate"
          >
            {lesson.title}
          </span>
        )}

        {!editing && (
          <span
            title={t('blockCount', { n: blockCount })}
            className={`shrink-0 rounded-full px-1.5 text-xs tabular-nums group-hover:hidden group-focus-within:hidden pointer-coarse:hidden ${
              blockCount === 0 ? 'text-gray-300' : isActive ? 'text-brand-dark/60' : 'text-gray-400'
            }`}
          >
            {blockCount === 0 ? t('emptyLessonShort') : blockCount}
          </span>
        )}

        {!editing && (
          <span className="hidden shrink-0 items-center group-hover:flex group-focus-within:flex pointer-coarse:flex">
            <button
              type="button"
              title={t('renameLesson')}
              aria-label={t('renameLesson')}
              onClick={(e) => {
                e.stopPropagation()
                onStartEdit()
              }}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:text-gray-700"
            >
              ✎
            </button>
            <button
              type="button"
              title={t('deleteLesson')}
              aria-label={t('deleteLesson')}
              onClick={(e) => {
                e.stopPropagation()
                deleteLessonWithUndo(lesson.id)
              }}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:text-red-600"
            >
              ✕
            </button>
          </span>
        )}
      </div>
    </li>
  )
}
