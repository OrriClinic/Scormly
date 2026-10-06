import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BlockType } from '../../types/course'
import {
  BLOCK_CATEGORIES,
  BLOCK_REGISTRY,
  type BlockCategory,
} from '../../blocks/registry'
import { useCourseStore } from '../../store/courseStore'
import { useMenu } from '../../hooks/useMenu'
import { useT } from '../../i18n/I18nProvider'
import BlockIcon from '../../blocks/BlockIcon'
import { BLOCK_TEMPLATES, TEMPLATE_GROUPS, type BlockTemplate, type TemplateGroup } from '../../blocks/templates'
import { createBlock } from '../../blocks/registry'
import BlockHoverPreview from './BlockHoverPreview'
import type { Block } from '../../types/course'

interface AddBlockMenuProps {
  lessonId: string
  /** Insertion position; defaults to the end of the lesson. */
  atIndex?: number
  /** 'inline' = a hover-revealed "+" on a divider line between blocks. */
  variant?: 'button' | 'inline'
  /** Inline only: take no height (between blocks joined into one panel). */
  tight?: boolean
}

/** Menu width in rem. */
const MENU_REM = 40

interface MenuItem {
  key: string
  icon: BlockType
  title: string
  description: string
  make: () => Block[]
  add: () => void
}

interface MenuGroup {
  id: string
  section: 'tpl' | 'blk'
  sectionLabel: string
  label: string
  icon: BlockType
  /** Items in the group regardless of the search. */
  total: number
  items: MenuItem[]
}

const SECTIONS = ['tpl', 'blk'] as const

const TEMPLATE_GROUP_ICON: Record<TemplateGroup, BlockType> = {
  text: 'paragraph',
  quotes: 'quote',
  media: 'image',
  structure: 'divider',
}

const CATEGORY_ICON: Record<BlockCategory, BlockType> = {
  text: 'heading',
  media: 'gallery',
  interactive: 'quiz',
  navigation: 'continue',
}

// The last opened group, remembered while the app is open.
let lastGroup = 'tpl:text'

const CATEGORY_KEY: Record<BlockCategory, string> = {
  text: 'catText',
  media: 'catMedia',
  interactive: 'catInteractive',
  navigation: 'catNavigation',
}

export default function AddBlockMenu({
  lessonId,
  atIndex,
  variant = 'button',
  tight = false,
}: AddBlockMenuProps) {
  const addBlock = useCourseStore((s) => s.addBlock)
  const insertBlocks = useCourseStore((s) => s.insertBlocks)
  const { t } = useT('common')
  const { t: tb } = useT('blocks')
  const { t: td } = useT('design')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [placement, setPlacement] = useState<'down' | 'up'>('down')
  const [maxHeight, setMaxHeight] = useState(520)
  // Hover preview: shown after a short pause on an item, beside the menu.
  // Positioned (fixed) next to the menu from its rect when it appears; null
  // when there's no room on either side.
  const [hover, setHover] = useState<
    { key: string; title: string; description: string; blocks: Block[]; left: number; top: number } | null
  >(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const hoverTimer = useRef<number | undefined>(undefined)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Every item lives in exactly one group: ready-made templates by template
  // group, then basic blocks by registry category. Without a search the
  // selected group is shown; a search lists every match, grouped.
  const q = query.trim().toLowerCase()
  const hit = (title: string, description: string) =>
    !q || title.toLowerCase().includes(q) || description.toLowerCase().includes(q)
  const groups: MenuGroup[] = [
    ...TEMPLATE_GROUPS.map((group) => {
      const all = BLOCK_TEMPLATES.filter((tpl) => tpl.group === group)
      return {
        id: `tpl:${group}`,
        section: 'tpl' as const,
        sectionLabel: td('catTemplates'),
        label: td(`tplGroup_${group}`),
        icon: TEMPLATE_GROUP_ICON[group],
        total: all.length,
        items: all
          .map((tpl) => ({
            key: `tpl-${tpl.id}`,
            icon: tpl.icon,
            title: td(`tpl_${tpl.id}`),
            description: td(`tpl_${tpl.id}Desc`),
            make: tpl.create,
            add: () => handleTemplate(tpl),
          }))
          .filter((it) => hit(it.title, it.description)),
      }
    }),
    ...BLOCK_CATEGORIES.map(({ category }) => {
      const all = Object.values(BLOCK_REGISTRY).filter((m) => m.category === category)
      return {
        id: `blk:${category}`,
        section: 'blk' as const,
        sectionLabel: td('catBasicBlocks'),
        label: t(CATEGORY_KEY[category]),
        icon: CATEGORY_ICON[category],
        total: all.length,
        items: all
          .map((m) => ({
            key: m.type,
            icon: m.type,
            title: tb(m.type),
            description: tb(`${m.type}Desc`),
            make: () => [createBlock(m.type)],
            add: () => handleAdd(m.type),
          }))
          .filter((it) => hit(it.title, it.description)),
      }
    }),
  ]
  const [activeGroup, setActiveGroup] = useState(lastGroup)
  function selectGroup(id: string) {
    lastGroup = id
    setActiveGroup(id)
  }
  const visible = q ? groups.filter((g) => g.items.length > 0) : groups.filter((g) => g.id === activeGroup)

  // Open toward whichever side has more room, and cap the height to the space
  // actually available there (minus a margin) so the menu never overflows the
  // viewport — the list scrolls instead of being clipped behind the header.
  function toggle() {
    if (!open) {
      setQuery('')
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) {
        const margin = 16
        // Space above is bounded by the fixed app header (h-14 = 56px), not the
        // viewport top, or an upward menu gets clipped behind it.
        const headerBottom = 56
        const below = window.innerHeight - rect.bottom - margin
        const above = rect.top - headerBottom - margin
        const up = above > below
        setPlacement(up ? 'up' : 'down')
        setMaxHeight(Math.max(260, Math.min(520, up ? above : below)))
      }
    }
    setOpen((v) => !v)
  }

  // Focus the search field when the menu opens (desktop convenience).
  useEffect(() => {
    if (open) searchRef.current?.focus()
    else {
      window.clearTimeout(hoverTimer.current)
      setHover(null)
    }
  }, [open])
  useEffect(() => () => window.clearTimeout(hoverTimer.current), [])

  // Props for an item that previews `make()` after a short hover / focus.
  function previewProps(key: string, title: string, description: string, make: () => Block[]) {
    const start = () => {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = window.setTimeout(() => {
        const pos = previewPosition()
        if (pos) setHover({ key, title, description, blocks: make(), ...pos })
      }, 450)
    }
    const stop = () => {
      window.clearTimeout(hoverTimer.current)
      setHover((h) => (h?.key === key ? null : h))
    }
    return { onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop }
  }

  // Beside the menu — right if the 22rem card fits in the window, else left —
  // aligned with its top and kept inside the viewport. It floats over the app
  // (sidebar included), so the canvas edge doesn't clip it.
  function previewPosition(): { left: number; top: number } | null {
    const rect = menuRef.current?.getBoundingClientRect()
    if (!rect || window.innerWidth < 1024) return null
    const width = 352
    const gap = 16
    const left =
      rect.right + gap + width <= window.innerWidth - 8
        ? rect.right + gap
        : rect.left - gap - width >= 8
          ? rect.left - gap - width
          : null
    if (left === null) return null
    const top = Math.max(64, Math.min(rect.top, window.innerHeight - 440))
    return { left, top }
  }

  // Search keeps focus on open; ↓ moves into the block list.
  useMenu({ open, onClose: () => setOpen(false), rootRef, triggerRef, focusFirst: false })

  function handleAdd(type: BlockType) {
    addBlock(lessonId, type, atIndex)
    setOpen(false)
    setQuery('')
  }

  function handleTemplate(tpl: BlockTemplate) {
    insertBlocks(lessonId, tpl.create(), atIndex)
    setOpen(false)
    setQuery('')
  }

  const inline = variant === 'inline'
  // Inline trigger stays hidden until hovered/focused (always faintly visible
  // on touch screens, which have no hover) and while its menu is open.
  const reveal = open
    ? 'opacity-100'
    : 'opacity-0 group-hover/gap:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-60'

  return (
    <div
      ref={rootRef}
      data-tour={inline ? undefined : 'add-block'}
      className={
        inline
          ? `group/gap relative flex items-center justify-center ${tight ? 'z-10 h-0' : 'h-5'}`
          : 'relative flex justify-center'
      }
    >
      {inline ? (
        <>
          <div
            aria-hidden
            className={`absolute inset-x-4 top-1/2 h-px bg-brand/40 transition-opacity ${
              open ? 'opacity-100' : 'opacity-0 group-hover/gap:opacity-100'
            }`}
          />
          <button
            ref={triggerRef}
            type="button"
            onClick={toggle}
            title={t('insertBlock')}
            aria-label={t('insertBlock')}
            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border border-brand/40 bg-white text-sm leading-none text-brand shadow-sm transition-opacity hover:bg-brand hover:text-white ${reveal}`}
          >
            +
          </button>
        </>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-brand hover:text-brand"
        >
          <span className="text-base leading-none">+</span> {t('addBlock')}
        </button>
      )}

      {open &&
        hover &&
        createPortal(
          <div className="fixed z-50" style={{ left: hover.left, top: hover.top }}>
            <BlockHoverPreview key={hover.key} title={hover.title} description={hover.description} blocks={hover.blocks} />
          </div>,
          // Inside the themed builder root so the theme's colors apply.
          rootRef.current?.closest('[data-theme]') ?? document.body,
        )}
      {open && (
        <div
          ref={menuRef}
          style={{ maxHeight, width: `${MENU_REM}rem` }}
          className={`pop-in absolute left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ${
            placement === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="border-b border-gray-100 p-2">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                const first = visible.flatMap((g) => g.items)[0]
                if (first) {
                  e.preventDefault()
                  first.add()
                }
              }}
              placeholder={t('searchBlocks')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            {/* Section rail: ready-made groups, then basic block categories. */}
            <nav
              aria-label={td('blockSections')}
              className="flex shrink-0 gap-1 overflow-x-auto border-b border-gray-100 bg-gray-50/80 p-2 sm:w-48 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r sm:p-2.5"
            >
              {SECTIONS.map((section) => (
                <div key={section} className="contents sm:block sm:pb-2">
                  <p className="hidden px-2 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gray-400 sm:flex sm:items-center sm:gap-1.5">
                    {section === 'tpl' && <span aria-hidden className="text-brand">✦</span>}
                    {section === 'tpl' ? td('catTemplates') : td('catBasicBlocks')}
                  </p>
                  {groups
                    .filter((g) => g.section === section)
                    .map((g) => {
                      const count = q ? g.items.length : g.total
                      const active = !q && g.id === activeGroup
                      return (
                        <button
                          key={g.id}
                          type="button"
                          aria-current={active || undefined}
                          disabled={q !== '' && count === 0}
                          onClick={() => {
                            setQuery('')
                            selectGroup(g.id)
                          }}
                          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-2 py-1.5 text-left text-[13px] transition sm:w-full ${
                            active
                              ? 'bg-white font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200'
                              : 'text-gray-600 hover:bg-white/70 hover:text-gray-900 disabled:opacity-35'
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                              section === 'tpl'
                                ? 'bg-gradient-to-br from-brand to-brand-dark text-white'
                                : active ? 'bg-brand/15 text-brand-dark' : 'bg-gray-200/70 text-gray-500'
                            }`}
                          >
                            <BlockIcon type={g.icon} className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{g.label}</span>
                          <span className="rounded-full px-1.5 text-[11px] tabular-nums text-gray-400">{count}</span>
                        </button>
                      )
                    })}
                </div>
              ))}
            </nav>

            <div role="menu" className="min-h-0 flex-1 overflow-y-auto p-3">
              {visible.map((g) => (
                <section key={g.id} className="mb-4 last:mb-0" aria-label={`${g.sectionLabel}: ${g.label}`}>
                  <header className="sticky -top-3 z-10 -mx-3 mb-2 flex items-baseline gap-2 border-b border-gray-100 bg-white/95 px-3 pb-2 pt-1 backdrop-blur">
                    <span className={`text-[10.5px] font-semibold uppercase tracking-[0.12em] ${g.section === 'tpl' ? 'text-brand-dark' : 'text-gray-400'}`}>
                      {g.sectionLabel}
                    </span>
                    <span aria-hidden className="text-gray-300">/</span>
                    <h3 className="text-sm font-semibold text-gray-900">{g.label}</h3>
                    <span className="ml-auto text-xs tabular-nums text-gray-400">{g.items.length}</span>
                  </header>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {g.items.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        role="menuitem"
                        onClick={item.add}
                        {...previewProps(item.key, item.title, item.description, item.make)}
                        className={`flex flex-col gap-1 rounded-xl border p-2.5 text-left transition focus:outline-none ${
                          g.section === 'tpl'
                            ? 'border-gray-100 bg-gradient-to-br from-white to-brand/[0.04] hover:-translate-y-px hover:border-brand/40 hover:shadow-sm focus:border-brand/40 focus:bg-brand/5'
                            : 'border-gray-100 hover:border-brand/40 hover:bg-brand/5 focus:border-brand/40 focus:bg-brand/5'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              g.section === 'tpl'
                                ? 'bg-gradient-to-br from-brand to-brand-dark text-white shadow-sm'
                                : 'bg-brand/10 text-brand'
                            }`}
                          >
                            <BlockIcon type={item.icon} />
                          </span>
                          <span className="text-sm font-medium leading-tight text-gray-800">{item.title}</span>
                        </span>
                        <span className="text-xs leading-tight text-gray-500">{item.description}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
              {visible.length === 0 && (
                <p className="px-1 py-6 text-center text-sm text-gray-400">{t('noBlocks')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
