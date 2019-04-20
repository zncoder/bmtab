const bmtabTitle = "bmtab-bn4yaq"
const historyTitle = "history-bn4yaq"
const menuIdBase = 100
const menuIdPage = 1

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

			dedup(folderId, tab.url)
				.then(() => {
					let arg = {parentId: folderId, index: 0, title: tab.title, url: tab.url}
					bmDo("create", arg)
						.then(item => {
							chrome.tabs.remove(tab.id)
							buildMenus()
						})
				})
		})
}

function specialPage(url) {
	return !url.startsWith("https://") && !url.startsWith("http://") && !url.startsWith("file://")
}

function restoreTab(tab, url) {
	if (specialPage(tab.url)) {
		chrome.tabs.update(tab.id, {url: url})
	} else {
		chrome.tabs.create({url: url, active: true})
	}
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

function removeMenus() {
	return new Promise(resolve => chrome.contextMenus.removeAll(() => resolve()))
}

function newMenu(arg) {
	//console.log("newmenu arg"); console.log(arg)
	return new Promise(resolve => {
		arg.contexts = ["browser_action"]
		chrome.contextMenus.create(arg, () => resolve())
	})
}

function removeBookmark(id) {
	return bmDo("get", id)
		.then(items => {
			if (items.length == 0) {
				return
			}

			let arg = {parentId: historyId, index: 0, title: items[0].title, url: items[0].url}
			return dedup(historyId, arg.url)
				.then(() => bmDo("create", arg))
				.then(() => bmDo("remove", id))
		})
}

function dedup(folder, url) {
	return bmDo("getChildren", folder)
		.then(items => {
			return items
				.filter(x => x.url === url)
				.map(x => bmDo("remove", x.id))
		})
		.then(ps => Promise.all(ps))
}

function handleMenu(info, tab) {
	getBmtabs()
		.then(items => {
			let id = parseInt(info.menuItemId)
			//console.log("handle menu:" + id + " of items"); console.log(items)
			if (id === menuIdPage) {
				showBmtabPage()
				return
			}
	
			id -= menuIdBase
			if (id >= items.length) {
				console.log("menuitemid:" + (id+menuIdBase) + " out of bound")
				return
			}
			let it = items[id]
			//console.log("show item:" + it.id + ",url:" + it.url)
			restoreTab(tab, it.url)
			return removeBookmark(it.id)
		})
		.then(buildMenus)
}

function buildMenus() {
	let items
	return removeMenus()
		.then(getBmtabs)
		.then(x => {
			items = x
			//console.log("buildmenus items"); console.log(items)
		})
		.then(() => {
			let max = items.length
			let title = "* Bmtab Page *"
			if (max - 1 > chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT) {
				max = chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT - 1
				title = "* Bmtab Page [...] *"
			}
			
			newMenu({id: menuIdPage + "", title: title})
			for (let i = 0; i < max; i++) {
				newMenu({id: menuIdBase + i + "", title: items[i].title})
			}
		})
}

function handleMessage(req, sender, sendResponse) {
	switch (req.action) {
	case "bm-removed":
		buildMenus()
		break
		
	default:
		console.log("unknown req"); console.log(req)
		break
	}
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

function start() {
	initBmtab()
		.then(() => {
			chrome.contextMenus.onClicked.addListener(handleMenu)
			chrome.browserAction.onClicked.addListener(captureTab)
			chrome.runtime.onMessage.addListener(handleMessage)

			buildMenus()
		})
}

start()
