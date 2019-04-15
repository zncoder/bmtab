const bmtabTitle = "bmtab-bn4yaq"
const historyTitle = "history-bn4yaq"
let folderId
let historyId

function showBmtabPage() {
	chrome.tabs.create({"url": "/page.html"})
}

function captureTab() {
	chrome.tabs.query(
		{currentWindow: true, active: true},
		tabs => {
			let tab = tabs[0]
			if (specialPage(tab.url)) {
				return
			}
			let arg = {parentId: folderId, index: 0, title: tab.title, url: tab.url}
			bmDo("create", arg)
				.then(item => {
					chrome.tabs.remove(tab.id)
				})
		})
}

function specialPage(url) {
	return !url.startsWith("https://") && !url.startsWith("http://") && !url.startsWith("file://")
}

function initBmtab() {
	// create bmtab and history bookmark folder
	return createBmtabFolder()
		.then(id => {
			folderId = id
			return createHistoryFolder()
		})
		.then(id => historyId = id)
}

function createBmtabFolder() {
	return bmDo("search", {title: bmtabTitle})
		.then(items => {
			if (items.length > 0) {
				return items[0]
			}
			return bmDo("create", {title: bmtabTitle})
		})
		.then(item => item.id)
}

function createHistoryFolder() {
	return bmDo("getChildren", folderId)
		.then(items => {
			for (let x of items) {
				if (x.title === historyTitle) {
					return x
				}
			}

			let arg = {title: historyTitle, parentId: folderId}
			return bmDo("create", arg)
		})
		.then(item => item.id)
}

function getBmtabs() {
	return bmDo("getChildren", folderId)
		.then(items => items.filter(x => x.id !== historyId))
}

function removeBookmark(id) {
	return bmDo("get", id)
		.then(items => {
			if (items.length == 0) {
				return
			}

			let arg = {parentId: historyId, index: 0, title: items[0].title, url: items[0].url}
			return dedupHistory(arg.url)
				.then(() => bmDo("create", arg))
				.then(() => bmDo("remove", id))
		})
}

function dedupHistory(url) {
	return bmDo("getChildren", historyId)
		.then(items => {
			return items
				.filter(x => x.url === url)
				.map(x => bmDo("remove", x.id))
		})
		.then(ps => Promise.all(ps))
}

function bmDo(name, arg) {
	return new Promise((resolve, reject) => {
		switch (name) {
		case "create":
			chrome.bookmarks.create(arg, x => resolve(x))
			break
		case "search":
			chrome.bookmarks.search(arg, x => resolve(x))
			break
		case "getChildren":
			chrome.bookmarks.getChildren(arg, x => resolve(x))
			break
		case "get":
			chrome.bookmarks.get(arg, x => resolve(x))
			break
		case "remove":
			chrome.bookmarks.remove(arg, x => resolve(x))
			break
		default:
			reject("unknown bookmarks function:" + name)
			return
		}
	})
}

initBmtab()
