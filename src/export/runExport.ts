import { create } from 'zustand'
import { exportScorm } from './exportScorm'
import { exportCmi5 } from './exportCmi5'
import { downloadProjectZip } from '../lib/exportProjectZip'
import { toast } from '../store/toastStore'
import { translate } from '../i18n/I18nProvider'

export type ExportTarget = 'scorm2004' | 'scorm12' | 'cmi5' | 'project'

// One export at a time, shared by the desktop menu, the mobile menu and the
// project menu, so repeated clicks can't start parallel packaging runs.
export const useExportStore = create<{ exporting: boolean }>()(() => ({ exporting: false }))

const RUN: Record<ExportTarget, () => Promise<string>> = {
  scorm2004: () => exportScorm('2004'),
  scorm12: () => exportScorm('1.2'),
  cmi5: exportCmi5,
  project: downloadProjectZip,
}

/** Build + download a package, reporting the outcome as a toast. */
export async function runExport(target: ExportTarget): Promise<void> {
  if (useExportStore.getState().exporting) return
  useExportStore.setState({ exporting: true })
  const progress = toast({ id: 'export', message: translate('common', 'exporting') })
  try {
    const filename = await RUN[target]()
    toast({ id: progress, tone: 'success', message: translate('common', 'exportDone', { file: filename }) })
  } catch (err) {
    console.error('[export]', err)
    toast({ id: progress, tone: 'error', message: translate('common', 'exportFailed') })
  } finally {
    useExportStore.setState({ exporting: false })
  }
}
