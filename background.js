const bmtabTitle = "bmtab-bn4yaq";
const historyTitle = "history-bn4yaq";
const baseMenuId = 100;
let folderId;
let historyId;

function showBmtabPage() {
	chrome.tabs.create({"url": "/page.html"});
}

function captureTab() {
	chrome.tabs.query(
		{currentWindow: true, active: true},
		tabs => {
			let tab = tabs[0];
			let u = tab.url;
			if (!u.startsWith("https://") && !u.startsWith("http://") && !u.startsWith("file://")) {
				// don't capture special pages
				return;
			}
			let arg = {parentId: folderId, index: 0, title: tab.title, url: u};
			bmDo("create", arg)
				.then(item => {
					chrome.tabs.remove(tab.id);
					buildMenus();
				});
		});
}

function initBmtab() {
	// create bmtab and history bookmark folder
	createBmtabFolder()
		.then(id => {
			folderId = id;
			return createHistoryFolder();
		})
		.then(id => historyId = id);
}

function createBmtabFolder() {
	return bmDo("search", {title: bmtabTitle})
		.then(items => {
			if (items.length > 0) {
				return items[0];
			}
			return bmDo("create", {title: bmtabTitle});
		})
		.then(item => item.id);
}

function createHistoryFolder() {
	return bmDo("getChildren", folderId)
		.then(items => {
			for (let x of items) {
				if (x.title === historyTitle) {
					return x;
				}
			}

			let arg = {title: historyTitle, parentId: folderId};
			return bmDo("create", arg);
		})
		.then(item => item.id);
}

function getBmtabs() {
	return bmDo("getChildren", folderId)
		.then(items => items.filter(x => x.id !== historyId));
}

function removeMenus() {
	return new Promise(resolve => chrome.contextMenus.removeAll(() => resolve()));
}

function newMenu(arg) {
	//console.log("newmenu arg"); console.log(arg);
	return new Promise(resolve => {
		arg.contexts = ["page", "browser_action"]
		chrome.contextMenus.create(arg, () => resolve());
	});
}

function removeBookmark(id) {
	return bmDo("get", id)
		.then(items => {
			if (items.length == 0) {
				return;
			}

			let arg = {parentId: historyId, index: 0, title: items[0].title, url: items[0].url}
			return dedupHistory(arg.url)
				.then(() => bmDo("create", arg))
				.then(() => bmDo("remove", id));
		});
}

function dedupHistory(url) {
	return bmDo("getChildren", historyId)
		.then(items => {
			return items
				.filter(x => x.url === url)
				.map(x => bmDo("remove", x.id));
		})
		.then(ps => Promise.all(ps));
}

function handleMenu(info, tab) {
	getBmtabs()
		.then(items => {
			let id = parseInt(info.menuItemId);
			//console.log("handle menu:" + id + " of items"); console.log(items);
			if (id === 1) {
				showBmtabPage();
				return;
			}
	
			id -= baseMenuId;
			if (id >= items.length) {
				console.log("menuitemid:" + (id+baseMenuId) + " out of bound");
				return;
			}
			let it = items[id];
			//console.log("show item:" + it.id + ",url:" + it.url);
			chrome.tabs.update(tab.id, {url: it.url});
			return removeBookmark(it.id);
		})
		.then(buildMenus);
}

function buildMenus() {
	let items;
	return removeMenus()
		.then(getBmtabs)
		.then(x => {
			items = x;
			//console.log("buildmenus items"); console.log(items);
		})
		.then(() => newMenu({
			id: "0",
			title: "Bmtabs",
			enabled: items.length > 0
		}))
		.then(() => {
			if (items.length == 0) {
				return;
			}
			newMenu({id: "1", title: "Bmtabs Page", parentId: "0"});
			newMenu({type: "separator", parentId: "0"});
			for (let i = 0; i < items.length; i++) {
				newMenu({id: baseMenuId + i + "", title: items[i].title, parentId: "0"});
			}
		});
}

function handleMessage(req, sender, sendResponse) {
	switch (req.action) {
	case "bm-removed":
		buildMenus();
		break;
		
	default:
		console.log("unknown req"); console.log(req);
		break;
	}
}

function bmDo(name, arg) {
	return new Promise((resolve, reject) => {
		switch (name) {
		case "create":
			chrome.bookmarks.create(arg, x => resolve(x));
			break;
		case "search":
			chrome.bookmarks.search(arg, x => resolve(x));
			break;
		case "getChildren":
			chrome.bookmarks.getChildren(arg, x => resolve(x));
			break;
		case "get":
			chrome.bookmarks.get(arg, x => resolve(x));
			break;
		case "remove":
			chrome.bookmarks.remove(arg, x => resolve(x));
			break;
		default:
			reject("unknown bookmarks function:" + name)
			return;
		}
	});
}

initBmtab();

chrome.contextMenus.onClicked.addListener(handleMenu);
buildMenus();

chrome.browserAction.onClicked.addListener(captureTab);
chrome.runtime.onMessage.addListener(handleMessage);
