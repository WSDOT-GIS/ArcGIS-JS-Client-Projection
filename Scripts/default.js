require(["esri/map", "dojo/dom", "dojo/on", "dojo/domReady!"], function (Map, dom, on, parser) {
	"use strict";

	var map, basemap;

	// Create the map object
	map = new esri.Map(dom.byId("map"));

	// Add create and add a layer.
	basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
	map.addLayer(basemap);

	// When the layer has loaded, add an event that will resize the map when the browser window resizes.
	dojo.connect(map, "onLoad", function () {
		on(window, "resize", function () {
			map.resize();
		});
	});
});