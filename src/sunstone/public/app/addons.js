siteMap = {
	addons: [
	]
};

var path = "addons/tabs/";
var deps = [];
siteMap.addons.forEach(function (addon) {
	deps.push(path + addon);
});

require(deps, function (e){});
