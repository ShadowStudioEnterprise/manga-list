import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing'
import * as sdk from 'firebase/firestore'
import { createSparkBudget, SPARK_LIMITS } from '../../src/utils/spark-budget.js'
import { loadModule } from '../helpers/load-module.js'

test(
  'ML-09: real emulator listener closes on quota signal and recovers all records with privacy intact',
  { timeout: 30000 },
  async () => {
    assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8188')
    const env = await initializeTestEnvironment({
      projectId: 'demo-mangalist-ml09',
      firestore: {
        host: '127.0.0.1',
        port: 8188,
        rules: await readFile('firestore.rules', 'utf8'),
      },
    })
    await env.clearFirestore()
    let stop
    try {
      const db = env.authenticatedContext('owner').firestore()
      const reference = sdk.collection(db, 'users', 'owner', 'mangas')
      await env.withSecurityRulesDisabled(async (context) => {
        const batch = sdk.writeBatch(context.firestore())
        for (const id of ['a', 'b', 'c'])
          batch.set(sdk.doc(context.firestore(), 'users', 'owner', 'mangas', id), { name: id })
        await batch.commit()
      })
      let time = 0,
        starts = 0,
        stops = 0
      const budget = createSparkBudget(() => time)
      const service = await loadModule('src/services/library-cursors.js', {
        '@/utils/spark-budget': { sparkBudget: budget, SPARK_LIMITS },
        'firebase/firestore': {
          ...sdk,
          onSnapshot(...args) {
            starts++
            const cancel = sdk.onSnapshot(...args)
            return () => {
              stops++
              cancel()
            }
          },
        },
      })
      const confirm = () =>
        new Promise((resolve, reject) => {
          stop = service.subscribeCursorLibrary(
            reference,
            (doc) => doc.id,
            (items, metadata) => {
              if (metadata.complete && !metadata.fromCache) resolve(items)
            },
            reject,
          )
        })
      assert.deepEqual(await confirm(), ['a', 'b', 'c'])
      // Emulator has no billable quotas. Inject the service signal, not usage claims.
      budget.record({ code: 'resource-exhausted' })
      assert.equal(stops, 1)
      assert.throws(
        () =>
          service.subscribeCursorLibrary(
            reference,
            (doc) => doc.id,
            () => {},
          ),
        { code: 'app/quota-paused' },
      )
      assert.equal(starts, 1)
      await env.withSecurityRulesDisabled(async (context) => {
        await sdk.setDoc(sdk.doc(context.firestore(), 'users', 'owner', 'mangas', 'd'), {
          name: 'd',
        })
      })
      time = 900000
      assert.deepEqual(await confirm(), ['a', 'b', 'c', 'd'])
      assert.equal(starts, 2)
      await assertFails(
        sdk.getDocs(
          sdk.collection(
            env.authenticatedContext('intruder').firestore(),
            'users',
            'owner',
            'mangas',
          ),
        ),
      )
    } finally {
      stop?.()
      await env.cleanup()
    }
  },
)

test(
  'ML-09: explicit transport recovery preserves the original pending write promise and ownership',
  { timeout: 30000 },
  async () => {
    assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8188')
    const env = await initializeTestEnvironment({
      projectId: 'demo-mangalist-ml09-network',
      firestore: {
        host: '127.0.0.1',
        port: 8188,
        rules: await readFile('firestore.rules', 'utf8'),
      },
    })
    await env.clearFirestore()
    const db = env.authenticatedContext('owner').firestore()
    const ref = sdk.doc(db, 'users', 'owner', 'mangas', 'queued')
    try {
      await env.withSecurityRulesDisabled(async (context) => {
        await sdk.setDoc(sdk.doc(context.firestore(), ref.path), {
          schemaVersion: 1,
          name: 'Queued write',
          normalizedName: 'queued-write',
          chapter: '1',
          type: 'manga',
          genres: [],
          readingStatus: 'following',
          publicationStatus: 'unknown',
          sources: [],
          notes: '',
          favorite: false,
          createdAt: sdk.Timestamp.fromMillis(1700000000000),
          updatedAt: sdk.Timestamp.fromMillis(1700000000000),
        })
      })
      const recovery = await loadModule('src/services/library-recovery.js', {
        '@/boot/firebase': {
          requireFirebase: () => ({ auth: { currentUser: { uid: 'owner' } }, db }),
        },
        '@/utils/spark-budget': { sparkBudget: createSparkBudget() },
        'firebase/firestore': sdk,
      })
      await sdk.disableNetwork(db)
      let state = 'pending'
      const originalWrite = sdk.updateDoc(ref, { chapter: '2', updatedAt: sdk.serverTimestamp() })
      originalWrite.then(
        () => {
          state = 'committed'
        },
        () => {
          state = 'failed'
        },
      )
      await new Promise((resolve) => setTimeout(resolve, 30))
      assert.equal(state, 'pending')
      await recovery.recoverLibraryConnection('owner')
      await originalWrite
      assert.equal(state, 'committed')
      assert.equal((await sdk.getDocFromServer(ref)).data().chapter, '2')
      await assertFails(
        sdk.getDoc(sdk.doc(env.authenticatedContext('intruder').firestore(), ref.path)),
      )
    } finally {
      await env.cleanup()
    }
  },
)
