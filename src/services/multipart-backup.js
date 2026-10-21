import { createLibraryExport } from './export-service.js'
import { createRecoverableImportPreview } from './import-service.js'
import { createAppError } from '../utils/firebase-errors.js'
import { SPARK_LIMITS } from '../utils/spark-budget.js'

export const BACKUP_FILE_BYTES = 5 * 1024 * 1024
export const BACKUP_PART_BYTES = 4 * 1024 * 1024
const MANIFEST = 'mangalist-manifest-v1'
const PART = 'mangalist-part-v1'
const encoder = new TextEncoder()
const size = (text) => encoder.encode(text).byteLength
const invalid = (message) => createAppError('app/backup-invalid', message)
const uuid = (value) =>
  typeof value === 'string' && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value)
const manifestName = (id) => `mangalist-${id}-manifest.json`
const partName = (id, index) => `mangalist-${id}-part-${String(index).padStart(4, '0')}.json`
const hash = async (text) =>
  Array.from(
    new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(text))),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')
const checkCrypto = () => {
  if (!globalThis.crypto?.subtle)
    throw invalid('Este navegador no permite comprobar la integridad de la copia.')
}
const parse = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    throw invalid('Uno de los archivos no contiene JSON válido.')
  }
}
const checkedVerification = (verification) => {
  try {
    const checked = JSON.parse(
      createLibraryExport([], 'json', { verification }).content,
    ).verification
    if (!checked) throw invalid('Falta la confirmación de origen.')
    return checked
  } catch {
    throw invalid('La copia no incluye una confirmación de origen válida.')
  }
}
const assertCount = (value, maximum) => Number.isInteger(value) && value > 0 && value <= maximum

export function isMultipartBackup(text) {
  try {
    return String(JSON.parse(text)?.backupFormat || '').startsWith('mangalist-')
  } catch {
    return false
  }
}

function header(id, index, verification) {
  return JSON.stringify({
    backupFormat: PART,
    copyId: id,
    index,
    formatVersion: 2,
    verification,
    mangas: [],
  }).slice(0, -2)
}

// Keep encoded records, not a second parsed library or every joined part at once.
// The sealed plan never fetches the server again for individual downloads.
export async function prepareMultipartExport(
  mangas,
  verification,
  assertCurrent = () => {},
  options = {},
) {
  checkCrypto()
  const id = options.copyId || globalThis.crypto.randomUUID()
  if (!uuid(id) || !assertCount(mangas.length, SPARK_LIMITS.libraryDocuments))
    throw invalid('No se puede preparar una copia completa de esta biblioteca.')
  const checked = checkedVerification(verification)
  const target = options.partBytes || BACKUP_PART_BYTES
  if (!Number.isInteger(target) || target <= 0 || target > BACKUP_PART_BYTES)
    throw invalid('Tamaño de parte no válido.')
  const groups = []
  let records = [],
    length = size(header(id, 1, checked)) + 2
  for (let i = 0; i < mangas.length; i++) {
    assertCurrent()
    const encoded = createLibraryExport([mangas[i]], 'json', { pretty: false }).content.slice(1, -1)
    const recordBytes = size(encoded)
    if (records.length && length + 1 + recordBytes > target) {
      groups.push(Object.freeze(records))
      records = []
      length = size(header(id, groups.length + 1, checked)) + 2
    }
    if (length + recordBytes > target)
      throw invalid(
        'Una obra es demasiado grande para dividir esta copia sin perder información. Usa la copia JSON y contacta con soporte.',
      )
    length += (records.length ? 1 : 0) + recordBytes
    records.push(encoded)
    // Allow account changes/unmount to cancel a large preparation.
    if (i % 100 === 99) await new Promise((resolve) => setTimeout(resolve, 0))
  }
  if (records.length) groups.push(Object.freeze(records))
  const contentFor = (index) => `${header(id, index + 1, checked)}${groups[index].join(',')}]}`
  const parts = []
  for (let i = 0; i < groups.length; i++) {
    assertCurrent()
    const content = contentFor(i)
    const bytes = size(content)
    if (bytes > target) throw invalid('La parte excede el presupuesto de archivo.')
    parts.push(
      Object.freeze({
        index: i + 1,
        fileName: partName(id, i + 1),
        records: groups[i].length,
        bytes,
        sha256: await hash(content),
      }),
    )
  }
  assertCurrent()
  const manifest = Object.freeze({
    backupFormat: MANIFEST,
    copyId: id,
    verification: Object.freeze(checked),
    totalRecords: mangas.length,
    parts: Object.freeze(parts),
  })
  const manifestContent = JSON.stringify(manifest, null, 2)
  if (size(manifestContent) > BACKUP_FILE_BYTES)
    throw invalid('El índice de la copia es demasiado grande.')
  return Object.freeze({
    manifest,
    manifestFileName: manifestName(id),
    manifestContent,
    partContent(index) {
      if (!Number.isInteger(index) || !groups[index]) throw invalid('Parte no válida.')
      return contentFor(index)
    },
  })
}

async function readCheckedFile(file, assertCurrent) {
  assertCurrent()
  if (!file || !Number.isInteger(file.size) || file.size < 1 || file.size > BACKUP_FILE_BYTES)
    throw invalid('Cada archivo de la copia debe tener como máximo 5 MiB.')
  const text = await file.text()
  assertCurrent()
  if (size(text) !== file.size)
    throw invalid('El tamaño del archivo no coincide con su contenido UTF-8.')
  return text
}

async function readPart(plan, descriptor, assertCurrent, existingMangas = []) {
  const file = plan.files.get(descriptor.fileName)
  const content = await readCheckedFile(file, assertCurrent)
  if (file.size !== descriptor.bytes || (await hash(content)) !== descriptor.sha256)
    throw invalid(
      `La parte ${descriptor.index} está alterada o incompleta. Vuelve a seleccionar los archivos originales.`,
    )
  assertCurrent()
  const data = parse(content)
  if (
    !data ||
    data.backupFormat !== PART ||
    data.copyId !== plan.manifest.copyId ||
    data.index !== descriptor.index ||
    data.formatVersion !== 2 ||
    JSON.stringify(checkedVerification(data.verification)) !==
      JSON.stringify(plan.manifest.verification) ||
    !Array.isArray(data.mangas) ||
    data.mangas.length !== descriptor.records
  )
    throw invalid(`La parte ${descriptor.index} no pertenece a esta copia.`)
  const preview = await createRecoverableImportPreview(content, {
    uid: plan.uid,
    format: 'json',
    existingMangas,
  })
  assertCurrent()
  if (
    preview.summary.errors ||
    preview.items.length !== descriptor.records ||
    preview.items.some((item) => !item.importDocumentId)
  )
    throw invalid(
      `La parte ${descriptor.index} contiene obras no válidas. No se ha iniciado su recuperación.`,
    )
  return preview
}

export function assertRestoreLibrary(plan, mangas) {
  if (mangas.some((manga) => !plan.expectedIds.has(manga.id)))
    throw invalid(
      'Usa una biblioteca vacía o reanuda la misma copia parcial. La recuperación dividida no combina bibliotecas distintas.',
    )
}

// Verify the complete set before the caller can perform the first write.
// Store immutable File references and IDs only, then re-read/hash each pending part.
export async function verifyMultipartBackup(
  selectedFiles,
  { uid, assertCurrent = () => {}, existingMangas = [] },
) {
  checkCrypto()
  if (typeof uid !== 'string' || !uid || uid.includes('/'))
    throw invalid('Inicia sesión antes de comprobar la copia.')
  const files = new Map()
  const candidates = Array.from(selectedFiles || [])
  if (candidates.length < 2 || candidates.length > SPARK_LIMITS.libraryDocuments + 1)
    throw invalid('Selecciona el manifiesto y todas las partes de la copia.')
  for (const file of candidates) {
    if (files.has(file.name)) throw invalid('Hay archivos con nombres repetidos.')
    if (file.size > BACKUP_FILE_BYTES)
      throw invalid('Cada archivo de la copia debe tener como máximo 5 MiB.')
    files.set(file.name, file)
  }
  const indexes = candidates.filter((file) => /^mangalist-.+-manifest\.json$/.test(file.name))
  if (indexes.length !== 1)
    throw invalid(
      'Selecciona un único manifiesto y todas sus partes, conservando los nombres originales.',
    )
  const manifest = parse(await readCheckedFile(indexes[0], assertCurrent))
  if (
    !manifest ||
    manifest.backupFormat !== MANIFEST ||
    !uuid(manifest.copyId) ||
    indexes[0].name !== manifestName(manifest.copyId) ||
    !assertCount(manifest.totalRecords, SPARK_LIMITS.libraryDocuments) ||
    !Array.isArray(manifest.parts) ||
    !assertCount(manifest.parts.length, manifest.totalRecords) ||
    candidates.length !== manifest.parts.length + 1
  )
    throw invalid('El manifiesto no es válido o faltan/sobran archivos de la copia.')
  manifest.verification = checkedVerification(manifest.verification)
  let total = 0
  for (let i = 0; i < manifest.parts.length; i++) {
    const part = manifest.parts[i]
    if (
      !part ||
      part.index !== i + 1 ||
      part.fileName !== partName(manifest.copyId, i + 1) ||
      !assertCount(part.records, manifest.totalRecords) ||
      !assertCount(part.bytes, BACKUP_FILE_BYTES) ||
      typeof part.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(part.sha256) ||
      !files.has(part.fileName)
    )
      throw invalid('Falta una parte o su descripción no es válida.')
    total += part.records
    Object.freeze(part)
  }
  if (total !== manifest.totalRecords)
    throw invalid('El total de obras no coincide con el manifiesto.')
  Object.freeze(manifest.parts)
  Object.freeze(manifest.verification)
  Object.freeze(manifest)
  const plan = { uid, manifest, files, expectedIds: new Set() }
  for (const part of manifest.parts) {
    const preview = await readPart(plan, part, assertCurrent)
    for (const item of preview.items) {
      if (plan.expectedIds.has(item.importDocumentId))
        throw invalid('La copia contiene identidades de importación repetidas.')
      plan.expectedIds.add(item.importDocumentId)
    }
  }
  assertRestoreLibrary(plan, existingMangas)
  assertCurrent()
  return plan
}

export async function restoreMultipartBackup(
  plan,
  {
    assertCurrent,
    assertReady = () => {},
    getMangas,
    write,
    budget,
    shouldPause = () => false,
    onProgress = () => {},
  },
) {
  assertCurrent()
  assertRestoreLibrary(plan, getMangas())
  const completed = new Set(
    getMangas()
      .filter((item) => plan.expectedIds.has(item.id))
      .map((item) => item.id),
  )
  const report = () => onProgress(completed.size, plan.manifest.totalRecords)
  const pause = (error) => ({
    complete: false,
    completed: completed.size,
    error,
    retryAfterMs: Math.max(
      budget?.retryAfterMs?.('read') || 0,
      budget?.retryAfterMs?.('write') || 0,
    ),
  })
  report()
  for (const descriptor of plan.manifest.parts) {
    assertCurrent()
    assertRestoreLibrary(plan, getMangas())
    if (shouldPause()) return pause()
    const preview = await readPart(plan, descriptor, assertCurrent, getMangas())
    const pending = preview.items.filter(
      (item) => !completed.has(item.importDocumentId) && !item.imported,
    )
    for (const item of preview.items.filter((item) => item.imported))
      completed.add(item.importDocumentId)
    let offset = 0
    while (offset < pending.length) {
      assertCurrent()
      assertRestoreLibrary(plan, getMangas())
      if (shouldPause()) return pause()
      assertReady()
      const capacity = Math.min(
        8,
        budget?.remaining?.('read') ?? 8,
        budget?.remaining?.('write') ?? 8,
      )
      if (!capacity) return pause(createAppError('app/request-budget'))
      const chunk = pending.slice(offset, offset + capacity)
      const results = await Promise.allSettled(
        chunk.map(async (item) => {
          assertCurrent()
          return write(plan.uid, item.manga, { importDocumentId: item.importDocumentId })
        }),
      )
      assertCurrent()
      let failure
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') completed.add(chunk[index].importDocumentId)
        else failure ||= result.reason
      })
      report()
      if (failure) return pause(failure)
      offset += chunk.length
    }
    report()
  }
  return {
    complete: completed.size === plan.manifest.totalRecords,
    completed: completed.size,
    retryAfterMs: 0,
  }
}
