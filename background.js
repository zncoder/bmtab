const bmtabTitle = "bmtab-bn4yaq"
const historyTitle = "history-bn4yaq"
const menuIdBase = 100
const menuIdPage = 1

let folderId
let historyId

function showBmtabPage() {
	return tabDo("create", {"url": "/page.html"})
}

async function currentTab() {
	let tabs = await tabDo("query", {currentWindow: true, active: true})
	return tabs[0]
}

async function captureTab() {
	let tab = await currentTab()
	if (specialPage(tab.url)) {
		return
	}

	await dedup(folderId, tab.url)

	let arg = {parentId: folderId, index: 0, title: tab.title, url: tab.url}
	await bmDo("create", arg)
	await tabDo("remove", tab.id)
	return buildMenus()
}

function specialPage(url) {
	return !url.startsWith("https://") && !url.startsWith("http://") && !url.startsWith("file://")
}

function restoreTab(tab, url) {
	if (specialPage(tab.url)) {
		return tabDo("update", tab.id, {url: url})
	} else {
		return tabDo("create", {url: url, active: true})
	}
}

async function initBmtab() {
	// create bmtab and history bookmark folder
	folderId = await createBmtabFolder()
	historyId = await createHistoryFolder()
}

async function createBmtabFolder() {
	let items = await bmDo("search", {title: bmtabTitle})
	if (items.length > 0) {
		return items[0].id
	}
	let item = await bmDo("create", {title: bmtabTitle})
	return item.id
}

async function createHistoryFolder() {
	let items = await bmDo("getChildren", folderId)
	for (let x of items) {
		if (x.title === historyTitle) {
			return x.id
		}
	}
	let arg = {title: historyTitle, parentId: folderId}
	let item = await bmDo("create", arg)
	return item.id
}

async function getBmtabs() {
	let items = await bmDo("getChildren", folderId)
	return items.filter(x => x.id !== historyId)
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

async function removeBookmark(id) {
	let items = await bmDo("get", id)
	if (items.length == 0) {
		return
	}

	let arg = {parentId: historyId, index: 0, title: items[0].title, url: items[0].url}
	await dedup(historyId, arg.url)
	await bmDo("create", arg)
	return bmDo("remove", id)
}

async function dedup(folder, url) {
	let items = await bmDo("getChildren", folder)
	return Promise.all(
		items
			.filter(x => x.url === url)
			.map(x => bmDo("remove", x.id)))
}

async function handleMenu(info, tab) {
	let items = await getBmtabs()
	let id = parseInt(info.menuItemId)
	//console.log("handle menu:" + id + " of items"); console.log(items)
	if (id === menuIdPage) {
		await showBmtabPage()
	} else {	
		id -= menuIdBase
		if (id >= items.length) {
			console.log("menuitemid:" + (id+menuIdBase) + " out of bound")
			return
		}
		let it = items[id]
		//console.log("show item:" + it.id + ",url:" + it.url)
		await restoreTab(tab, it.url)
		await removeBookmark(it.id)
	}
	return buildMenus()
}

async function buildMenus() {
	await removeMenus()
	
	let items = await getBmtabs()
	//console.log("buildmenus items"); console.log(items)
	let max = items.length
	let title = "* Bmtab Page *"
	if (max - 1 > chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT) {
		max = chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT - 1
		title = "* Bmtab Page [...] *"
	}

	let ps = []
	ps.push(newMenu({id: menuIdPage + "", title: title}))
	for (let i = 0; i < max; i++) {
		ps.push(newMenu({id: menuIdBase + i + "", title: items[i].title}))
	}
	return Promise.all(ps)
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

function bmDo(op, arg) {
	return new Promise((resolve, reject) => {
		switch (op) {
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
			reject("unknown bookmarks function:" + op)
			return
		}
	})
}

function tabDo(op, ...args) {
	return new Promise((resolve, reject) => {
		switch (op) {
		case "create":
			chrome.tabs.create(args[0], res => resolve(res))
			break
		case "query":
			chrome.tabs.query(args[0], res => resolve(res))
			break
		case "remove":
			chrome.tabs.remove(args[0], () => resolve())
			break
		case "update":
			chrome.tabs.update(args[0], args[1], res => resolve(res))
			break
		default:
			reject("unknown tab function:" + op)
			break
		}
	})
}

async function init() {
	await initBmtab()

	chrome.contextMenus.onClicked.addListener(handleMenu)
	chrome.browserAction.onClicked.addListener(captureTab)
	chrome.runtime.onMessage.addListener(handleMessage)
	
	buildMenus()
}

init()
