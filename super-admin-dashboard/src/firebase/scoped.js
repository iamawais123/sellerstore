// Live queries over a set of admins' data. A super admin only ever reads their own branch, and the
// security rules check every list query against the admins it names (`adminId in [...]`), spending
// one lookup on each. Rules can only afford a handful of lookups per request (8 admin ids still fit,
// 9 do not), so the ids are split into small groups — one live query each — and merged back into one
// list. The owner, who reads everything, does not need this.
import * as shopData from './shopData.js'

export const ADMINS_PER_QUERY = 6

// A filter plus a sort by time needs a composite index, which exists only once firestore.indexes.json
// has been deployed. Until then Firestore refuses such a query ('failed-precondition'). Rather than
// leave a log view empty, the same query is then run again with just the filter and sorted here.
export const isMissingIndex = (error) => error?.code === 'failed-precondition'

// `start(indexed, onError)` begins a live query — the ordered, limited one when `indexed`, the plain
// filter otherwise — and returns its unsubscribe function. Runs the indexed one first and switches to
// the plain one if the index turns out to be missing. Returns the unsubscribe function.
export function watchWithIndexFallback(start, onError = () => {}) {
  let stop = () => {}
  const begin = (indexed) => {
    stop = start(indexed, (error, name) => {
      if (indexed && isMissingIndex(error)) {
        stop()
        begin(false)
      } else {
        onError(error, name)
      }
    })
  }
  begin(true)
  return () => stop()
}

// The newest `count` rows by `field`, newest first.
export const newestFirst = (rows, field, count) =>
  [...rows].sort((a, b) => String(b[field] || '').localeCompare(String(a[field] || ''))).slice(0, count)

const chunksOf = (list, size) => {
  const chunks = []
  for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size))
  return chunks
}

// `newest`, when given, is `{ field, count }`: each query asks for the newest `count` rows by `field`
// (descending) and the merged list is cut back to the newest `count` overall.
export function watchForAdmins(db, name, adminIds, { map, newest } = {}, onData, onError = () => {}) {
  if (!adminIds.length) {
    onData([])
    return () => {}
  }
  const groups = chunksOf(adminIds, ADMINS_PER_QUERY)
  const rows = groups.map(() => null)
  const emit = () => {
    if (rows.some((group) => group === null)) return // wait until every group has answered once
    const merged = rows.flat()
    onData(newest ? newestFirst(merged, newest.field, newest.count) : merged)
  }
  const stops = groups.map((group, index) =>
    watchWithIndexFallback(
      (indexed, onGroupError) =>
        shopData.watchList(
          db,
          name,
          [
            shopData.where('adminId', 'in', group),
            ...(newest && indexed ? [shopData.orderBy(newest.field, 'desc'), shopData.limit(newest.count)] : []),
          ],
          (groupRows) => {
            rows[index] = groupRows
            emit()
          },
          onGroupError,
          map
        ),
      onError
    )
  )
  return () => stops.forEach((stop) => stop())
}
