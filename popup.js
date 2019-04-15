let bg

function showItems(items) {
	let tb = document.createElement("table")
	tb.id = "item_tb"
	for (let it of items) {
		let tr = document.createElement("tr")
		tr.innerHTML = `<td class="link">${it.title}</td>`
		let td = tr.querySelector("td")
		td.addEventListener("click", () => gotoItem(it.id, it.url))
		status(td, it.url)
		tb.appendChild(tr)
	}

	document.querySelector("#item_sec").appendChild(tb)
}

function gotoItem(id, url) {
	bg.removeBookmark(id)
	chrome.tabs.create({url: url})
	window.close()
}

function init() {
	let el = document.querySelector("#capture_btn")
	el.addEventListener("click", () => {
		bg.captureTab()
		window.close()
	})
	status(el, "save page in bmtab")

	el = document.querySelector("#page_btn")
	el.addEventListener("click", () => {
		bg.showBmtabPage()
		window.close()
	})
	status(el, "show bmtab page")
	
	bg.getBmtabs().then(showItems)
}

function status(el, s) {
	let sb = document.querySelector("#status_box")
	el.addEventListener("mouseover", () => sb.innerText = s)
	el.addEventListener("mouseout", () => sb.innerText = "")
}

chrome.runtime.getBackgroundPage(x => {
	bg = x
	init()
})
