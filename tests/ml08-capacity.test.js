import test from 'node:test'
import assert from 'node:assert/strict'
import { libraryCost, daily, buildModel } from '../scripts/model-ml08-capacity.mjs'

test('ML-08: empty query minimum and 5000/5001 split discontinuity', () => {
  assert.equal(libraryCost(0).cold, 1)
  assert.equal(libraryCost(5000).cold, 5000)
  assert.equal(libraryCost(5001).cold, 10002)
  assert.equal(libraryCost(5001).export, 5002)
  assert.equal(libraryCost(10000).cold, 15001)
  assert.equal(libraryCost(10000).export, 10001)
  assert.throws(() => libraryCost(10001))
})

test('ML-08: weighted mixtures use per-account cold overhead and device deliveries', () => {
  const mixed = daily([
    { count: 49, size: 100 },
    { count: 1, size: 10000 },
  ])
  assert.equal(mixed.reads, 27951)
  assert.equal(mixed.detail.cold, 19901)
  const devices = daily([{ count: 50, size: 500 }], { devices: 2 })
  assert.equal(devices.reads, 59050)
  assert.equal(devices.writes, 2000)
  const reconnect = daily([{ count: 1, size: 10000 }], { reconnects: 1 })
  const handoff = daily([{ count: 1, size: 10000 }], { handoffs: 1 })
  assert.equal(handoff.reads - reconnect.reads, 5001)
})

test('ML-08: reserve is a proposal and import/retry costs consume real headroom', () => {
  const model = buildModel()
  assert.equal(model.proposal.approved, false)
  assert.equal(model.thirteenExtraEvents.withinProposedReadBudget, true)
  assert.equal(model.fourteenExtraEvents.withinProposedReadBudget, false)
  assert.equal(model.importSensitivity.find((r) => r.parameters.imports === 25000).writes, 27000)
  assert.equal(daily([{ count: 50, size: 500 }], { attempts: 3 }).reads, 35050)
  assert.throws(() => daily([{ count: 50, size: 500 }], { devices: 0 }))
})
