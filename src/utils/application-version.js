const raw = import.meta.env.MANGALIST_BUILD_INFO
const valid =
  raw &&
  /^[a-f0-9]{40}$/.test(raw.revision) &&
  typeof raw.dirty === 'boolean' &&
  typeof raw.builtAt === 'string'

export const applicationVersion = Object.freeze(
  valid
    ? { revision: raw.revision, dirty: raw.dirty, builtAt: raw.builtAt }
    : { revision: null, dirty: true, builtAt: null },
)

export const applicationVersionLabel = applicationVersion.revision
  ? `${applicationVersion.revision.slice(0, 12)}${applicationVersion.dirty ? ' · en desarrollo' : ''}`
  : 'Versión local sin identificar'

export function versionDiagnostic() {
  return JSON.stringify({ application: 'MangaList', ...applicationVersion }, null, 2)
}
