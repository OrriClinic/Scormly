import { useEffect, useRef } from 'react'
import type { Block, BlockBackground, BlockSettings, BlockWidth } from '../../types/course'
import { useCourseStore } from '../../store/courseStore'
import { useT } from '../../i18n/I18nProvider'
import { BLOCK_BACKGROUNDS } from '../../blocks/styleClasses'
import { IMAGE_ACCEPT, Segmented, useAssetUpload } from './controls'
import { useAssetUrl } from '../../hooks/useAssetUrl'

type Spacing = NonNullable<BlockSettings['spacing']>

// Block format: a background from the theme palette and the inner padding.
// Opened from the block toolbar; closes on Esc or a click outside.
export default function BlockStylePopover({
  block,
  lessonId,
  placement,
  onClose,
}: {
  block: Block
  lessonId: string
  /** 'up': above the block's toolbar; 'down': below the block. */
  placement: 'up' | 'down'
  onClose: () => void
}) {
  const updateSettings = useCourseStore((s) => s.updateBlockSettings)
  const { t } = useT('design')
  const ref = useRef<HTMLDivElement>(null)
  const background = block.settings.background ?? 'none'
  const spacing = block.settings.spacing ?? 'normal'
  const width = block.settings.width ?? 'normal'
  const photo = block.settings.backgroundImage ?? ''
  const photoUrl = useAssetUrl(photo)
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = useAssetUpload('image', (path) =>
    updateSettings(lessonId, block.id, { background: 'image', backgroundImage: path }),
  )

  // Make sure the whole popover is visible once it opens.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    // Deferred so the click that opened the popover doesn't close it.
    const id = setTimeout(() => document.addEventListener('mousedown', onDown))
    document.addEventListener('keydown', onKey, true)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={t('blockStyle')}
      onClick={(e) => e.stopPropagation()}
      className={`pop-in absolute right-3 z-30 w-[22rem] ${placement === 'up' ? 'bottom-full mb-5' : 'top-full mt-2'} max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 text-gray-700 shadow-xl`}
    >
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {t('background')}
      </p>
      <div role="radiogroup" aria-label={t('background')} className="grid grid-cols-7 gap-1.5">
        {BLOCK_BACKGROUNDS.map((bg: BlockBackground) => {
          const checked = bg === background
          return (
            <button
              key={bg}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={t(`bg_${bg}`)}
              title={t(`bg_${bg}`)}
              onClick={() => {
                // A photo panel needs a picture first: pick one right away.
                if (bg === 'image' && !photo) fileRef.current?.click()
                else updateSettings(lessonId, block.id, { background: bg })
              }}
              className={`swatch h-8 w-8 rounded-full ring-offset-2 transition hover:scale-105 ${
                checked ? 'ring-2 ring-brand' : 'ring-1 ring-gray-200'
              }`}
              data-bg={bg}
            />
          )
        })}
      </div>
      <p className="mt-1.5 text-xs text-gray-500">{t(`bg_${background}`)}</p>
      <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} onChange={upload.onPick} className="sr-only" tabIndex={-1} />
      {background === 'image' && photo && (
        <div className="mt-2 flex items-center gap-2.5">
          <img src={photoUrl || undefined} alt="" className="h-10 w-16 rounded-md object-cover ring-1 ring-gray-200" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('replaceBgImage')}
          </button>
          <button
            type="button"
            onClick={() => updateSettings(lessonId, block.id, { background: 'none', backgroundImage: undefined })}
            className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            {t('removeImage')}
          </button>
        </div>
      )}
      {upload.error && <p className="mt-1.5 text-xs text-red-600">{t('unsupportedImage')}</p>}

      <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
        <Segmented<BlockWidth>
          label={t('blockWidth')}
          value={width}
          onChange={(v) => updateSettings(lessonId, block.id, { width: v })}
          options={[
            ['narrow', t('width_narrowBlock')],
            ['normal', t('width_column')],
            ['wide', t('width_wideBlock')],
            ['full', t('width_fullBleed')],
          ]}
        />
        <Segmented<Spacing>
          label={t('padding')}
          value={spacing}
          onChange={(v) => updateSettings(lessonId, block.id, { spacing: v })}
          options={[
            ['compact', t('pad_compact')],
            ['normal', t('pad_normal')],
            ['spacious', t('pad_spacious')],
          ]}
        />
        <p className="text-xs leading-snug text-gray-500">{t('blockWidthHelp')}</p>
      </div>
    </div>
  )
}
