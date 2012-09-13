/*global require, esri, dojo, Proj4js*/
/*jslint browser: true */

/// <reference path="jsapi_vsdoc_v31.js" />
/// <reference path="proj4js/proj4js-combined.js" />

require(["require", "dojo/dom", "dojo/on", "dojo/html", "dojo/query", "dijit/Dialog", "proj4js", "proj4js/defs/EPSG/2927", "proj4js/defs/EPSG/3857", "esri/map", "esri/tasks/geometry",
"/Scripts/clientProjection.js",
"dojo/domReady!"], function (require, dom, on, html, query, Dialog, Proj4js, epsg2927, epsg3857) {
	"use strict";

	var map, extent, basemap, geometryService, dialog;

	//////For debugging purposes, make global.
	////window.Proj4js = Proj4js;

	function getProjectedPoint(point) {
		var sourcePrj, destPrj;

		// Set up the source and destination projections.
		sourcePrj = epsg3857;  // Web mercator auxiliary sphere
		destPrj = epsg2927; //new Proj4js.Proj('EPSG:2927'); // WA NAD HARN State Plane South

		// If this is a click event, the parameter will be an event instead of a point.  Get the map point from the event.
		if (point.mapPoint) {
			point = point.mapPoint;
		}

		return Proj4js.projectEsriGeometry(point, sourcePrj, destPrj);
	}

	// Create the map object
	extent = new esri.geometry.Extent(-124.5, 45.55, -116.9, 47.6, new esri.SpatialReference({ wkid: 4326 }));
	extent = esri.geometry.geographicToWebMercator(extent);
	map = new esri.Map(dom.byId("map"), {
		extent: extent
	});

	geometryService = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

	// Add create and add a layer.
	basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
	map.addLayer(basemap);

	// When the layer has loaded, add an event that will resize the map when the browser window resizes.
	dojo.connect(map, "onLoad", function () {
		on(window, "resize", function () {
			map.resize();
		});

		dojo.connect(map, "onClick", function (evt) {
			var originalPoint, proj4jsPoint, params, content;
			originalPoint = evt.mapPoint;
			map.graphics.add(new esri.Graphic(originalPoint, new esri.symbol.SimpleMarkerSymbol()));
			proj4jsPoint = getProjectedPoint(originalPoint);

			params = new esri.tasks.ProjectParameters();
			params.geometries = [originalPoint];
			params.outSR = new esri.SpatialReference({ wkid: 2927 });

			content = ["<dl><dt>Original Point</dt><dd>", JSON.stringify(originalPoint.toJson()),
				"</dd><dt>Proj4js Projected</dt><dd>", JSON.stringify(proj4jsPoint.toJson()),
				"</dd><dt>Geometry Service Projected</dt><dd id='geometryServiceResults'><progress>Please wait...</progress></dd>"].join("");

			if (dialog) {
				// Update dialog
				dialog.set("content", content);
			} else {
				// Create the dialog.
				dialog = new Dialog({
					id: "dialog",
					title: "Projection Results",
					content: content
				});

				dialog.on("hide", function () {
					map.graphics.clear();
				});
			}
			dialog.show();
			geometryService.project(params, function (geometries) {
				html.set(dom.byId("geometryServiceResults"), JSON.stringify(geometries[0].toJson()));
			}, function (error) {
				html.set(dom.byId("geometryServiceResults"), error.message || error);
			});

		});
	});
});