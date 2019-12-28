let bg

async function deleteEntry(ev) {
	let sid = ev.target.id
	if (!sid.startsWith("a-") && !sid.startsWith("span-")) {
		throw new Error(`entry id:${sid} invalid`)
	}
	let id = sid.substring(sid.indexOf("-")+1)
	let li = document.querySelector(`#li-${id}`)
	li.parentNode.removeChild(li)
	await bg.removeBookmark(id)
	return bg.buildMenus()
}

function displayEntries(items) {
	let ul = document.querySelector("#bookmark-sec")
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
		document.querySelector(`#span-${id}`).addEventListener("click", deleteEntry)
		document.querySelector(`#a-${id}`).addEventListener("click", deleteEntry)
	}
}

async function init() {
	bg = await new Promise(resolve => chrome.runtime.getBackgroundPage(x => resolve(x)))
	let items = await bg.getBmtabs()
	displayEntries(items)
}

init()
