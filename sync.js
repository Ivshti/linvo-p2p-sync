// API - instance of Linvo API, must have .request method
// name - name of the model
// all - dictionary of id -> object; object can only contain _mtime
module.exports = function sync(API, name, all, cb) {		
	var push = [], pull = [];
	var pushed = null, pulled = null;

	API.request("datastoreMeta", { collection: name }, function(err, metas) {
		if (err) return cb(err)

		var remote = { }
		metas.forEach(function(m) { if (m) remote[m[0]] = new Date(m[1]).getTime() })

		Object.keys(all).forEach(function(k) {
			var item = all[k]
			var mtime = item._mtime.getTime()
			if ((remote[item._id] || 0) > mtime) pull.push(item._id)
			if ((remote[item._id] || 0) < mtime) push.push(res.load[item._id])
			delete remote[item._id] // already processed
		})

		pull = Object.keys(remote)

		doPush(function(err) {
			if (err) return cb(err)
			pushed = true
			if (pulled && pushed) cb(null, pulled)
		});
		doPull(function(err, recv) {
			if (err) return cb(err)
			pulled = recv || true
			if (pulled && pushed) cb(null, pulled)
		});
	})

	function doPush(cb) {
		if (! push.length) return cb()
		API.request("datastorePut", { collection: name, changes: push }, cb);
	}

	function doPull() {
		if (! pull.length) return cb()
		API.request("datastoreGet", { collection: name, ids: pull }, cb);
	}
}