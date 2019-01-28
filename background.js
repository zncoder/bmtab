const bmtabTitle = "bmtab-bn4yaq";
const historyTitle = "history-bn4yaq";
const baseMenuId = 100;
let folderId;
let historyId;

function showBmtabPage() {
	chrome.tabs.create({"url": "/page.html"});
}

function bmTab() {
	chrome.tabs.query(
		{currentWindow: true, active: true},
		tabs => {
			let tab = tabs[0];
			let arg = {parentId: folderId, index: 0, title: tab.title, url: tab.url};
			chrome.bookmarks.create(arg, item => {
				//console.log("remove tab:" + tab.id);
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
	return new Promise(resolve => {
		chrome.bookmarks.search(
			{title: bmtabTitle},
			items => {
				if (items.length > 0) {
					resolve(items[0].id);
					return;
				}
				
				chrome.bookmarks.create(
					{title: bmtabTitle},
					item => resolve(item.id));
			});
	});
}

function createHistoryFolder() {
	return new Promise(resolve => {
		chrome.bookmarks.getChildren(
			folderId,
			items => {
				for (let x of items) {
					if (x.title === historyTitle) {
						resolve(x.id);
						return;
					}
				}

				chrome.bookmarks.create(
					{
						title: historyTitle,
						parentId: folderId
					},
					item => resolve(item.id));
			});
	});
}

function getBmtabs() {
	return new Promise(resolve => chrome.bookmarks.getChildren(folderId, items => {
		items = items.filter(x => x.id !== historyId);
		resolve(items);
	}));
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
	return new Promise(resolve => {
		// move id to history
		chrome.bookmarks.get(id, items => {
			if (items.length == 0) {
				resolve();
				return;
			}
			
			let arg = {parentId: historyId, index: 0, title: items[0].title, url: items[0].url}
			chrome.bookmarks.create(arg, () => {
				chrome.bookmarks.remove(id, () => resolve());
			});
		});
	});
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

initBmtab();

chrome.contextMenus.onClicked.addListener(handleMenu);
buildMenus();

chrome.browserAction.onClicked.addListener(bmTab);
chrome.runtime.onMessage.addListener(handleMessage);
