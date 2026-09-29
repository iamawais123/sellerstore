// An in-memory stand-in for the slice of the Firebase Admin Firestore API the Telegram relay uses:
// collection().doc() get / set / update / delete, where (== and >) / orderBy / limit queries, and
// runTransaction with the same optimistic retry Firestore does when a document changed under it.
// It exists because the Firestore emulator needs Java; the relay's own code runs against it unchanged.

const clone = (value) => (value === undefined ? undefined : structuredClone(value))

export function createFakeFirestore() {
  const tables = new Map() // collection -> Map(id -> { data, version })
  const table = (name) => {
    if (!tables.has(name)) tables.set(name, new Map())
    return tables.get(name)
  }

  const snapshotOf = (name, id) => {
    const row = table(name).get(id)
    return {
      id,
      exists: !!row && !row.gone,
      data: () => clone(row?.data),
      version: row?.version ?? 0,
      ref: docRef(name, id),
    }
  }

  const write = (name, id, data) => {
    const row = table(name).get(id)
    table(name).set(id, { data: clone(data), version: (row?.version ?? 0) + 1 })
  }
  const remove = (name, id) => {
    const row = table(name).get(id)
    if (row) table(name).set(id, { data: undefined, version: row.version + 1, gone: true })
  }
  const live = (name) => [...table(name)].filter(([, row]) => !row.gone && row.data !== undefined)

  const applyUpdate = (name, id, changes) => {
    const row = table(name).get(id)
    if (!row || row.gone) throw new Error(`NOT_FOUND: ${name}/${id}`)
    write(name, id, { ...row.data, ...changes })
  }

  function docRef(name, id) {
    return {
      id,
      path: `${name}/${id}`,
      get: async () => snapshotOf(name, id),
      set: async (data) => write(name, id, data),
      update: async (changes) => applyUpdate(name, id, changes),
      delete: async () => remove(name, id),
    }
  }

  function query(name, filters = [], order = null, max = Infinity) {
    const run = async () => {
      let rows = live(name).map(([id, row]) => ({ id, data: row.data }))
      for (const { field, op, value } of filters) {
        rows = rows.filter(({ data }) => (op === '==' ? data[field] === value : op === '>' ? data[field] > value : false))
      }
      if (order) rows.sort((a, b) => (a.data[order.field] < b.data[order.field] ? -1 : a.data[order.field] > b.data[order.field] ? 1 : 0) * (order.dir === 'desc' ? -1 : 1))
      const docs = rows.slice(0, max).map(({ id }) => snapshotOf(name, id))
      return { docs, empty: docs.length === 0, size: docs.length }
    }
    return {
      where: (field, op, value) => query(name, [...filters, { field, op, value }], order, max),
      orderBy: (field, dir = 'asc') => query(name, filters, { field, dir }, max),
      limit: (n) => query(name, filters, order, n),
      get: run,
    }
  }

  const db = {
    collection: (name) => ({ doc: (id) => docRef(name, id), ...query(name) }),
    settings: () => {},
    async runTransaction(work) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const reads = []
        const writes = []
        const tx = {
          get: async (ref) => {
            const [name, id] = ref.path.split('/')
            const snap = snapshotOf(name, id)
            reads.push({ name, id, version: snap.version })
            return snap
          },
          set: (ref, data) => writes.push(() => write(...ref.path.split('/'), data)),
          update: (ref, changes) => writes.push(() => applyUpdate(...ref.path.split('/'), changes)),
          delete: (ref) => writes.push(() => remove(...ref.path.split('/'))),
        }
        const result = await work(tx)
        // Something we read changed while we worked: run it again against the new state, as Firestore does.
        if (reads.some(({ name, id, version }) => (table(name).get(id)?.version ?? 0) !== version)) continue
        writes.forEach((apply) => apply())
        return result
      }
      throw new Error('ABORTED: too much contention')
    },
    // Test helpers.
    seed: (name, id, data) => write(name, id, data),
    read: (name, id) => clone(table(name).get(id)?.data),
  }
  return db
}
