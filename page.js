let sel = x => document.querySelector(x);

function deleteEntry(id) {
	let li = sel("#li-"+id);
	li.parentNode.removeChild(li);
	chrome.bookmarks.remove(id);
	chrome.runtime.sendMessage({action: "bm-removed"});
}

const liTmpl = '<li id="li-{id}">\n\
  <span class="close-sym" id="span-{id}">&nbsp;&times </span>&nbsp;<a id="a-{id}" href="{url}">{title}</a>\n\
</li>\n';

function displayEntries(items) {
	let list = "";
	for (let it of items) {
		list += liTmpl
			.replace(/{id}/g, it.id)
			.replace(/{url}/g, it.url)
			.replace(/{title}/g, it.title);
	}
	
	let ul = sel("#bookmark-sec");
	ul.innerHTML = list;

	for (let it of items) {
		let cb = () => {deleteEntry(it.id)};
		sel("#span-"+it.id).addEventListener("click", cb);
		sel("#a-"+it.id).addEventListener("click", cb);
	}
}

chrome.runtime.getBackgroundPage(bg => bg.getBmtabs().then(displayEntries));
