// API - instance of Linvo API, must have .request method
// name - name of the model
// all - dictionary of id -> object; object can only contain _mtime
// params - additional things we send to the server
// opts.
module.exports = function sync (API, name, all, params, opts, cb) {
  var pushed = null
  var pulled = null

  var plan = { pull: [], push: [] }

  opts = opts || { }
  opts.planner = opts.planner || planner

  API.request('datastoreMeta', params || { collection: name, from: "linvo-p2p-sync" }, function (err, metas) {
    if (err) return cb(err)

    var remote = { }
    metas.forEach(function (m) { if (m) remote[m[0]] = new Date(m[1]).getTime() })

    plan = opts.planner(remote, all)

    doPush(function (err) {
      if (err) return cb(err)
      pushed = true
      if (pulled && pushed) cb(null, pulled, { pull: plan.pull.length, pulled: pulled.length, push: plan.push.length })
    })
    doPull(function (err, recv) {
      if (err) return cb(err)
      pulled = recv || []
      if (pulled && pushed) cb(null, pulled, { pull: plan.pull.length, pulled: pulled.length, push: plan.push.length })
    })
  })

  function planner (remote, all) {
    var push = []
    var pull = []
    Object.keys(all).forEach(function (k) {
      var item = all[k]
      var mtime = item._mtime.getTime()
      if ((remote[item._id] || 0) > mtime) return // keep it in remote[], therefore we pull
      if ((remote[item._id] || 0) < mtime) push.push(all[item._id])
      delete remote[item._id] // already processed
    })

    pull = Object.keys(remote)

    return { push: push, pull: pull }
  }

  function doPush (cb) {
    if (!plan.push.length) return cb()
    API.request('datastorePut', { collection: name, changes: plan.push }, cb)
  }

  function doPull (cb) {
    if (!plan.pull.length) return cb()
    API.request('datastoreGet', { collection: name, ids: plan.pull }, cb)
  }
}
