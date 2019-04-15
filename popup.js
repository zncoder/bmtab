let bg

function showItems(items) {
	let ul = document.querySelector("#item_sec")
	for (let it of items) {
		let li = document.createElement("li")
		li.classList.add("link")
		li.innerText = `${it.title}`
		li.addEventListener("click", () => gotoItem(it.id, it.url))
		status(li, it.url)
		ul.appendChild(li)
	}
}

function gotoItem(id, url) {
	bg.removeBookmark(id)
	chrome.tabs.create({url: url})
}

function init() {
	let el = document.querySelector("#capture_btn")
	el.addEventListener("click", bg.captureTab)
	status(el, "save page in bmtab")

	el = document.querySelector("#page_btn")
	el.addEventListener("click", bg.showBmtabPage)
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
