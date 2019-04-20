let bg
let sel = x => document.querySelector(x)

function deleteEntry(id) {
	let li = sel(`#li-${id}`)
	li.parentNode.removeChild(li)
	bg.removeBookmark(id)
	chrome.runtime.sendMessage({action: "bm-removed"})
}

function displayEntries(items) {
	let ul = sel("#bookmark-sec")
	for (let it of items) {
		let s = `<span class="close-sym" id="span-${it.id}">&nbsp;&times </span>&nbsp;` + 
				`<a id="a-${it.id}" href="${it.url}" target="_blank" rel="noopener noreferrer">${it.title}</a>`
		let li = document.createElement("li")
		li.id= `li-${it.id}`
		li.innerHTML = s
		ul.appendChild(li)
	}
	
	for (let it of items) {
		let id = it.id
		let cb = () => deleteEntry(id)
		sel(`#span-${id}`).addEventListener("click", cb)
		sel(`#a-${id}`).addEventListener("click", cb)
	}
}

chrome.runtime.getBackgroundPage(x => {
	bg = x
	bg.getBmtabs().then(displayEntries)
})
