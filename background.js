chrome.webRequest.onBeforeSendHeaders.addListener(
	function(details) {
		var object = {};
		for (var i = 0; i < details.requestHeaders.length; ++i) {
			object[details.requestHeaders[i].name] = {where: i, data: details.requestHeaders[i].value};
		}
		if (object.hasOwnProperty("X-Referer")) {
			details.requestHeaders[object["Referer"]["where"]].value = object["X-Referer"]["data"];
			for (var i = 0; i < details.requestHeaders.length; ++i) {
				if (details.requestHeaders[i].name === "X-Referer") {
					details.requestHeaders.splice(i, 1);
				} else if (details.requestHeaders[i].name === "Origin") {
					details.requestHeaders.splice(i, 1);
				}
			}
		}
		console.log(details);
		return {requestHeaders: details.requestHeaders};
	},
	{urls: ["<all_urls>"]},
	["blocking", "requestHeaders"]
);
