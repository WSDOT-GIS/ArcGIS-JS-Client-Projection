/*global require, esri, dojo*/
/*jslint browser: true */
require(["dojo/dom", "dojo/on", "esri/map", "dojo/domReady!"], function (dom, on) {
	"use strict";

	var map, basemap;

	// Create the map object
	map = new esri.Map(dom.byId("map"));

	// Add create and add a layer.
	basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
	map.addLayer(basemap);

	// When the layer has loaded, add an event that will resize the map when the browser window resizes.
	dojo.connect(map, "onLoad", function () {
		on(window, "resize", function () {
			map.resize();
		});
	});
});