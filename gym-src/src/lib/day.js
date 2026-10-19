import { effectiveRoutine } from './history.js'
import { todayISO } from './format.js'
import { t, dateLocale } from './i18n.js'

// The day Home is looking at: today unless she picked another one in the week strip.
export function dayInfo(S, iso) {
  const t0 = todayISO()
  const d = new Date(iso + 'T00:00:00')
  const diff = Math.round((d - new Date(t0 + 'T00:00:00')) / 864e5)
  const label = diff === 0 ? t('Today') : diff === 1 ? t('Tomorrow') : diff === -1 ? t('Yesterday')
    : d.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'short' })
  return {
    iso, d, diff, label,
    routine: effectiveRoutine(S, iso),
    moved: S.dayPlan[iso] !== undefined,
    done: S.workouts.filter(w => w.d === iso)
  }
}

