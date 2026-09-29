import { useT } from '../../i18n/I18nProvider'

// Submit button / score panel shared by the scored exercise previews
// (ordering, fill in the blanks); matches the quiz preview.
export default function ScoreResult({
  submitted,
  score,
  passingScore,
  onSubmit,
  onRetry,
}: {
  submitted: boolean
  score: number
  passingScore: number
  onSubmit: () => void
  onRetry: () => void
}) {
  const { t } = useT('preview')
  if (!submitted) {
    return (
      <button type="button" onClick={onSubmit} className="btn-primary text-sm">
        {t('submit')}
      </button>
    )
  }
  const passed = score >= passingScore
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
      <p className="text-lg font-semibold text-gray-900">{t('yourScore', { score })}</p>
      <p className={`mt-1 font-medium ${passed ? 'text-green-700' : 'text-red-700'}`}>
        {passed ? t('passed') : t('failed')}
      </p>
      <button type="button" onClick={onRetry} className="btn-secondary mt-4 text-sm">
        {t('retry')}
      </button>
    </div>
  )
}
