let bg

function showItems(items) {
	let tb = document.createElement("table")
	tb.id = "item_tb"
	for (let it of items) {
		let tr = document.createElement("tr")
		let favicon = faviconUrl(it.url)
		tr.innerHTML = `<td><img src="${favicon}" width="14" height="14"></td>` +
			`<td class="link">${it.title}</td>`
		let td = tr.querySelector(".link")
		td.addEventListener("click", () => gotoItem(it.id, it.url))
		tb.appendChild(tr)
	}

	document.querySelector("#item_sec").appendChild(tb)
}

function gotoItem(id, url) {
	bg.removeBookmark(id)
	chrome.tabs.create({url: url})
	window.close()
}

function faviconUrl(url) {
	let a = document.createElement("a")
	a.href = url
	a.pathname = "favicon.ico"
	return a.href
}

function init() {
	let el = document.querySelector("#capture_btn")
	el.addEventListener("click", () => {
		bg.captureTab()
		window.close()
	})

	el = document.querySelector("#page_btn")
	el.addEventListener("click", () => {
		bg.showBmtabPage()
		window.close()
	})
	
	bg.getBmtabs().then(showItems)
}

chrome.runtime.getBackgroundPage(x => {
	bg = x
	init()
})
