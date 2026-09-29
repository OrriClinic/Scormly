import { Fragment } from 'react'
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useCourseStore, selectActiveLesson } from '../../store/courseStore'
import BlockShell from '../editor/BlockShell'
import AddBlockMenu from '../editor/AddBlockMenu'
import { useT } from '../../i18n/I18nProvider'

export default function Workspace() {
  const activeLesson = useCourseStore(selectActiveLesson)
  const selectBlock = useCourseStore((s) => s.selectBlock)
  const moveBlock = useCourseStore((s) => s.moveBlock)
  const renameLesson = useCourseStore((s) => s.renameLesson)
  const addLesson = useCourseStore((s) => s.addLesson)
  const lessonCount = useCourseStore((s) => s.course.lessons.length)
  const { t } = useT('common')
  // Small distance so a click still selects/edits; drag starts only past 5px.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Focus a drag handle, Space to pick up, arrows to move, Space to drop.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(e: DragEndEvent) {
    if (!activeLesson || !e.over || e.active.id === e.over.id) return
    const from = activeLesson.blocks.findIndex((b) => b.id === e.active.id)
    const to = activeLesson.blocks.findIndex((b) => b.id === e.over!.id)
    if (from !== -1 && to !== -1) moveBlock(activeLesson.id, from, to)
  }

  return (
    <main
      data-tour="canvas"
      className="flex-1 overflow-y-auto bg-gray-100"
      onClick={() => selectBlock(null)}
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {activeLesson ? (
          <>
            <header className="mb-8" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('lesson')}
              </p>
              <input
                value={activeLesson.title}
                aria-label={t('lessonTitle')}
                placeholder={t('lessonTitle')}
                onChange={(e) => renameLesson(activeLesson.id, e.target.value)}
                className="w-full rounded-md bg-transparent text-3xl font-bold text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
              />
            </header>

            {activeLesson.blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-9 text-center">
                <p className="mb-4 max-w-xs text-xs text-gray-500">
                  {t('emptyHint')}
                </p>
                <div onClick={(e) => e.stopPropagation()}>
                  <AddBlockMenu lessonId={activeLesson.id} />
                </div>
              </div>
            ) : (
              <div
                className="space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={activeLesson.blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div>
                      {activeLesson.blocks.map((block, index) => (
                        <Fragment key={block.id}>
                          <AddBlockMenu
                            variant="inline"
                            lessonId={activeLesson.id}
                            atIndex={index}
                          />
                          <BlockShell
                            block={block}
                            lessonId={activeLesson.id}
                            index={index}
                            total={activeLesson.blocks.length}
                          />
                        </Fragment>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <div className="pt-3">
                  <AddBlockMenu lessonId={activeLesson.id} />
                </div>
              </div>
            )}
          </>
        ) : lessonCount === 0 ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-10 text-center">
            <p className="mb-4 max-w-xs text-sm text-gray-500">{t('noLessonsHint')}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                addLesson()
              }}
              className="btn-primary text-sm"
            >
              + {t('addLesson')}
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500">{t('chooseLesson')}</p>
        )}
      </div>
    </main>
  )
}
