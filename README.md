# Syncing between a key-value store and the Linvo API 

## How to use

### ``sync(API, collectionName, all, cb)``

#### **API** - instance of Linvo API, must have .request method
#### **collectionName** - name of the collection (model)
#### **all** - dictionary of id -> object

#### **cb** - ``function(err, received) { }`` where `received` would be an array of all objects modified remotely - you need to save those to local DB

This would do a P2P sync with the back-end of a given collection. It would call remote methods `datastoreMeta`, and then `datastorePut` and/or `datastoreGet` depending on the needs. 

After receiving `received`, it is your responsibility to write those to the local database.


## Example

```javascript
var API = require("services/linvoapi")

sync(API, "libraryItem", { }, function(err, received) {
	if (err) return console.error(err)

	received.forEach(function(l) {
		new libraryItem(l).save()
	})
})
```