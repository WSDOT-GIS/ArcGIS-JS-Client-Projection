/*global require, esri, dojo*/
/*jslint browser: true */

/// <reference path="jsapi_vsdoc_v31.js" />
/// <reference path="proj4js/proj4js-combined.js" />

require(["dojo/dom", "dojo/on", "esri/map", "esri/tasks/geometry", "dojo/domReady!"], function (dom, on) {
	"use strict";

	var map, basemap, geometryService;

	function getProjectedPoint(point) {
		var sourcePrj, destPrj;

		// Set up the source and destination projections.
		sourcePrj = new Proj4js.Proj('EPSG:3857');
		destPrj = new Proj4js.Proj('EPSG:2927');

		// If this is a click event, the parameter will be an event instead of a point.  Get the map point from the event.
		if (point.mapPoint) {
			point = point.mapPoint;
		}

		point = point.toJson();
		Proj4js.transform(sourcePrj, destPrj, point);
		if (point.spatialReference) {
			point.spatialReference = new esri.SpatialReference({ wkid: 2927 });
		}

		return new esri.geometry.Point(point);
	}

	// Create the map object
	map = new esri.Map(dom.byId("map"));

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
			var originalPoint, proj4jsPoint, geometryServicePoint, params;
			originalPoint = evt.mapPoint;
			console.debug(originalPoint);
			proj4jsPoint = getProjectedPoint(originalPoint);
			console.debug(proj4jsPoint);

			params = new esri.tasks.ProjectParameters();
			params.geometries = [originalPoint];
			params.outSR = new esri.SpatialReference({ wkid: 2927 });
			geometryService.project(params, function (geometries) {
				console.debug(geometries);
			});

		});
	});
});