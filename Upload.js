var receiveData = {}, uploadContainer;

function createElement(data, insert) {
	if (data.constructor === Object) {
		data = [data];
	}
	var list = [];
	for (var i = 0; i < data.length; i++) {
		if (!data[i].name) return null;
		var elem = document.createElement(data[i].name);
		if (data[i].property) {
			for (var j in data[i].property) {
				if (data[i].property.hasOwnProperty(j)) {
					if (data[i].property[j].constructor === Object) {
						for (var k in data[i].property[j]) {
							if (j === "attr") {
								elem.setAttribute(k, data[i].property[j][k]);
							} else if (data[i].property[j].hasOwnProperty(k)) {
								elem[j][k] = data[i].property[j][k];
							}
						}
					} else {
						elem[j] = data[i].property[j];
					}
				}
			}
		}
		if (data[i].event) {
			for (var l in data[i].event) {
				if (data[i].event.hasOwnProperty(l)) {
					if (data[i].event[l].constructor === Function)
						data[i].event[l] = [data[i].event[l]];
                    data[i].event[l].forEach(function(func) {
						elem.addEventListener(l, func, false);
					});
				}
			}
		}
		if (insert) {
			var parent;
			var before = null;
			if (insert.constructor === Array) {
				var target = insert[1];
				if (typeof target === "number") {
					parent = insert[0];
					before = parent.childNodes[target];
				} else {
					before = insert[0];
					parent = before.parentNode;
					if (target === "next") {
						before = before.nextSibling;
					}
				}
			} else {
				parent = insert;
			}
			parent.insertBefore(elem, before);
		}
		list.push(elem);
	}
	if (list.length === 1) {
		return list[0];
	} else {
		return list;
	}
}

function ajax(data) {
	var payload = null;
	var xhr = new XMLHttpRequest();
	xhr.onload = function() {
		if (data.referrer) {
			history.back();
		}
		if (this.status >= 200 && this.status < 400){
			data.success(this);
		} else {
			if (data.retry) {
				ajax(data);
			}
			data.error(this);
		}
	};
	xhr.onerror = function() {
		if (data.retry) {
			ajax(data);
		}
		data.error(this);
	};
	if (xhr.responseType !== undefined) {
		if (data.type) {
			xhr.responseType = data.type;
		}
	}
	if (data.referrer) {
		history.pushState("", "", data.referrer);
	}
	if (data.data) {
		if (data.dataType === "formData") {
			payload = (function() {
				var formData = new FormData();
				for (var i in data.data) {
					if (data.data.hasOwnProperty(i)) {
						if (data.data[i].constructor === Array) {
							formData.append(i, data.data[i][0], data.data[i][1]);
						} else {
							formData.append(i, data.data[i]);
						}
					}
				}
				return formData;
			})();
		} else if (data.method === "GET") {
			data.url += "?" + ((typeof data.data === "string") ? data.data : serialize(data.data));
		} else if (typeof data.data === "string") {
			payload = data.data;
		} else {
			payload = serialize(data.data);
		}
	}
	xhr.open(data.method, data.url);
	if (data.headers) {
		for (var i in data.headers) {
			if (data.headers.hasOwnProperty(i))
				xhr.setRequestHeader(i, data.headers[i]);
		}
	}
	if (data.dataType === "text")
		xhr.setRequestHeader("Content-Type", "text/plain; charset=" + (data.charset || "utf-8"));
	else if (typeof payload === "string")
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
	
	xhr.send(payload);
}
function serialize(data) {
	var list = [];
	for (var i in data) {
		if (data.hasOwnProperty(i))
			list.push(encodeURIComponent(i) + "=" + encodeURIComponent(data[i]));
	}
	return list.join('&');
}

function initUploader() {
	uploadContainer = createElement({
		name: "div",
		property: {
			className: "fileUploader"
		}
	});
	
	var hiddenFileInput = createElement({
		name: "input",
		property: {
			type: "file",
			multiple: "multiple"
		},
		event: {
			change: function() {
				var files = e.target.files;
				
				var i = 0, callback = function() {
					if (i >= files.length || files[i].type.indexOf("image") < 0) {
						alert("잘못된 파일입니다.");
						return;
					}
					initUploaderForm(files[i++], callback);
				};
				
				callback();
			}
		}
	});
	console.log(hiddenFileInput);
	
	var prevent = function(e) {
		e.preventDefault();
	}
	
	createElement([{
		name: "li",
		property: {
			className: "list-group-item",
			textContent: "직접 올리기"
		},
		event: {
			dragstart: prevent,
			dragend: prevent,
			dragover: prevent,
			drag: prevent,
			dragenter: function(e) {
				e.preventDefault();
				e.stopPropagation();
				this.textContent = "내려놓으세요!";
			},
			dragleave: function(e) {
				e.preventDefault();
				e.stopPropagation();
				this.textContent = "직접 올리기";
			},
			drop: function(e) {
				e.preventDefault();
				e.stopPropagation();
				this.textContent = "직접 올리기";
				var files = e.dataTransfer.files;
				
				var i = 0, callback = function() {
					if (i >= files.length || files[i].type.indexOf("image") < 0) {
						alert("잘못된 파일입니다.");
						return;
					}
					initUploaderForm(files[i++], callback);
				};
				
				callback();
			},
			click: function() {
				hiddenFileInput.click();
			}
		}
	}, {
		name: "li",
		property: {
			className: "list-group-item",
			textContent: "주소에서 올리기"
		},
		event: {
			click: function() {
				var address = prompt("주소 입력");
				if (!address || address.length < 1) {
					alert("주소를 입력하세요.");
					return;
				}
				address = address.replace("http://", "https://");
				ajax({
					method: "GET",
					url: address,
					type: "blob",
					headers: {
						"X-Referer": address
					},
					success: function(xhr) {
						var type = xhr.getResponseHeader("content-type").split("/");
						if (type.indexOf("image") < 0) {
							alert("이미지가 아닌 것 같습니다.");
						} else {
							if (type[1] === "jpeg") {
								type[1] = "jpg";
							}
							initUploaderForm(xhr.response, undefined, type[1]);
						}
					},
					error: function(xhr) {
						alert("이미지 불러오기에 실패했습니다! https 이미지만 불러올 수 있습니다.");
					}
				});
			}
		}
	}], createElement({
		name: "ul",
		property: {
			className: "list-group"
		}
	}, uploadContainer));
	
	createElement({
		name: "button",
		property: {
			className: "btn btn-primary",
			innerHTML: '<span class="icon ion-close"></span> <span class="icon-title">닫기</span>',
			style: {
				float: "right"
			}
		},
		event: {
			click: function() {
				document.body.removeChild(uploadContainer);
			}
		}
	}, uploadContainer);
	
	document.body.appendChild(uploadContainer);
}

function initUploaderForm(file, finishcallback, extension) {
	var filename;
	if (extension) {
		filename = "." + extension;
	} else {
		filename = file.name;
	}
	var uploadFileInfo = createElement({
		name: "div",
		property: {
			className: "uploadFileInfo"
		}
	});
	
	createElement({
		name: "img",
		property: {
			src: URL.createObjectURL(file)
		}
	}, uploadFileInfo);
	
	createElement([{
		name: "input",
		property: {
			className: "form-control",
			type: "text",
			name: "filename",
			placeholder: "파일 이름",
			value: filename.substring(filename.lastIndexOf('.'), filename.length).toLowerCase()
		}
	}, {
		name: "input",
		property: {
			className: "form-control",
			type: "text",
			name: "category",
			placeholder: "분류",
			value: (receiveData.category) ? receiveData.category : ""
		}
	}, {
		name: "input",
		property: {
			className: "form-control",
			type: "text",
			name: "reference",
			placeholder: "출처",
			value: (receiveData.reference) ? receiveData.reference : ""
		}
	}], createElement({
		name: "div",
		property: {
			className: "inputContainer"
		}
	}, uploadFileInfo));
	
	createElement({
		name: "input",
		property: {
			type: "submit",
			className: "btn btn-primary",
			value: "업로드",
			style: {
				float: "right"
			}
		},
		event: {
			click: function() {
				var category = uploadFileInfo.querySelector("[name=category]").value;
				var reference = uploadFileInfo.querySelector("[name=reference]").value;
				var filename = uploadFileInfo.querySelector("[name=filename]").value;
				receiveData.category = category;
				receiveData.reference = reference;
				ajax({
					method: "post",
					url: "https://namu.wiki/Upload",
					referrer: "https://namu.wiki/Upload",
					data: {
						"baserev": "0",
						"file": [file, filename],
						"document": "파일:" + filename,
						"text": "[include(틀:이미지 라이선스/제한적 이용)]\n== 기본 정보 ==\n|| 출처 || " + reference + " ||\n[[분류:" + category + "]]",
						"log": ""
					},
					dataType: "formData",
					type: "text",
					success: function(xhr) {
						if (xhr.responseURL.indexOf("/w/") < 0) {
							alert("이미지 업로드가 실패했습니다!");
							return;
						}
						console.log(xhr.responseURL);
						if (finishcallback) finishcallback();
						document.body.removeChild(uploadFileInfo);
					},
					error: function(xhr) {
						alert("이미지 업로드가 실패했습니다!");
					}
				});
			}
		}
	}, uploadFileInfo);
	
	document.body.appendChild(uploadFileInfo);
}

createElement({
	name: "a",
	property: {
		className: "nav-link",
		innerHTML: '<span class="icon ion-upload"></span><span class="icon-title">파일 올리기 도구</span>'
	},
	event: {
		click: function() {
			if (uploadContainer)
				document.body.appendChild(uploadContainer);
			else
				initUploader();
		}
	}
}, createElement({
	name: "li",
	property: {
		className: "nav-item"
	}
}, document.querySelector(".senkawa .nav.navbar-nav")));