const bmtabTitle = "bmtab-bn4yaq";
let folderId;

function showBmtabs() {
	chrome.tabs.create({"url": "/page.html"});
}

function bmTab() {
	chrome.tabs.query(
		{currentWindow: true, active: true},
		(tabs) => {
			let tab = tabs[0];
			chrome.bookmarks.create(
				{parentId: folderId, index: 0, title: tab.title, url: tab.url},
				(item) => {chrome.tabs.remove(tab.id)});
		});
}

function initBmtab() {
	// create bmtab bookmark folder
	chrome.bookmarks.search(
		{title: bmtabTitle},
		items => {
			if (items.length > 0) {
				folderId = items[0].id;
				return;
			}
			
			chrome.bookmarks.create(
				{title: bmtabTitle},
				item => {folderId = item.id});
		});
}

function getBmtabs() {
	return new Promise(resolve => {
		chrome.bookmarks.getChildren(folderId, items => resolve(items));
	});
}

initBmtab();

chrome.contextMenus.create({
		contexts: ["page", "browser_action"],
		title: "Show Bmtabs page",
	onclick: showBmtabs});

chrome.browserAction.onClicked.addListener(bmTab);

