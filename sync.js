// API - instance of Linvo API, must have .request method
// name - name of the model
// all - dictionary of id -> object; object can only contain _mtime
module.exports = function sync (API, name, all, params, cb) {
  var push = []
  var pull = []
  var pushed = null
  var pulled = null

  API.request('datastoreMeta', params || { collection: name, from: "linvo-p2p-sync" }, function (err, metas) {
    if (err) return cb(err)

    var remote = { }
    metas.forEach(function (m) { if (m) remote[m[0]] = new Date(m[1]).getTime() })

    Object.keys(all).forEach(function (k) {
      var item = all[k]
      var mtime = item._mtime.getTime()
      if ((remote[item._id] || 0) > mtime) return // keep it in remote[], therefore we pull
      if ((remote[item._id] || 0) < mtime) push.push(all[item._id])
      delete remote[item._id] // already processed
    })

    pull = Object.keys(remote)

    doPush(function (err) {
      if (err) return cb(err)
      pushed = true
      if (pulled && pushed) cb(null, pulled, { pull: pulled.length, push: pushed.length })
    })
    doPull(function (err, recv) {
      if (err) return cb(err)
      pulled = recv || []
      if (pulled && pushed) cb(null, pulled, { pull: pulled.length, push: pushed.length })
    })
  })

  function doPush (cb) {
    if (!push.length) return cb()
    API.request('datastorePut', { collection: name, changes: push }, cb)
  }

  function doPull (cb) {
    if (!pull.length) return cb()
    API.request('datastoreGet', { collection: name, ids: pull }, cb)
  }
}
