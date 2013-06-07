/*global require, Proj4js*/
/*jslint browser: true */

/// <reference path="jsapi_vsdoc_v31.js" />
/// <reference path="proj4js/proj4js-combined.js" />

require(["dojo/dom", "dojo/on", "dojo/html", "dojo/query", "dojo/dom-attr", "dijit/Dialog",
	"esri/map", "esri/graphic",
	"esri/SpatialReference",
	"esri/geometry/Extent", "esri/geometry/webMercatorUtils",
	"esri/tasks/GeometryService",
	"esri/toolbars/draw",
	"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
	"esri/tasks/ProjectParameters",
	"clientProjection", "dojo/domReady!"
], function (dom, on, html, query, domAttr, Dialog, Map, Graphic, SpatialReference, Extent, webMercatorUtils, GeometryService, Draw,
	SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, ProjectParameters) {
	"use strict";

	var map, extent, basemap, geometryService, dialog, epsg2927, epsg3857;

	Proj4js.defs["EPSG:2927"] = "+proj=lcc +lat_1=47.33333333333334 +lat_2=45.83333333333334 +lat_0=45.33333333333334 +lon_0=-120.5 +x_0=500000.0001016001 +y_0=0 +ellps=GRS80 +to_meter=0.3048006096012192 +no_defs";
	epsg2927 = new Proj4js.Proj("EPSG:2927")
	epsg3857 = new Proj4js.Proj("GOOGLE");

	function getProjectedPoint(point) {
		var sourcePrj, destPrj;

		// Set up the source and destination projections.
		sourcePrj = epsg3857;  // Web mercator auxiliary sphere
		destPrj = epsg2927; //new Proj4js.Proj('EPSG:2927'); // WA NAD HARN State Plane South

		return Proj4js.projectEsriGeometry(point, sourcePrj, destPrj);
	}

	// Create the map object
	extent = new Extent(-124.5, 45.55, -116.9, 47.6, new SpatialReference({ wkid: 4326 }));
	extent = webMercatorUtils.geographicToWebMercator(extent);
	map = new Map(dom.byId("map"), {
		extent: extent,
		basemap: "streets"
	});

	geometryService = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

	// When the layer has loaded, add an event that will resize the map when the browser window resizes.
	on(map, "load", function () {
		var drawToolbar;


		on(window, "resize", function () {
			map.resize();
		});

		drawToolbar = new Draw(map);

		function getSymbol(geometry) {
			/// <summary>Gets a Simple...Symbol appropriate for the geometry type.</summary>
			/// <param name="geometry" type="esri.geometry.Geometry">A geometry</param>
			/// <returns type="esri.symbol.Symbol" />
			var symbol;
			if (/(?:multi)?point/i.test(geometry.type)) {
				symbol = new SimpleMarkerSymbol();
			} else if (geometry.type === "polyline") {
				symbol = new SimpleLineSymbol();
			} else if (geometry.type === "polygon" || geometry.type === "extent") {
				symbol = new SimpleFillSymbol();
			}

			return symbol;
		}

		on(query("button[data-geometryType]"), "click", function (mouseEvent) {
			var button = this, geometryType;
			geometryType = domAttr.get(button, "data-geometrytype");
			drawToolbar.activate(geometryType);
		});

		dojo.connect(drawToolbar, "onDrawEnd", function (geometry) {
			var originalPoint, proj4jsPoint, params, content;
			drawToolbar.deactivate();
			originalPoint = geometry;
			map.graphics.add(new Graphic(originalPoint, getSymbol(geometry)));
			proj4jsPoint = getProjectedPoint(originalPoint);

			params = new ProjectParameters();
			params.geometries = [originalPoint];
			params.outSR = new SpatialReference({ wkid: 2927 });

			content = ["<div><dl><dt>Original Geometry</dt><dd>", JSON.stringify(originalPoint.toJson()),
				"</dd><dt>Proj4js Projected</dt><dd>", JSON.stringify(proj4jsPoint.toJson()),
				"</dd><dt>Geometry Service Projected</dt><dd id='geometryServiceResults'><progress>Please wait...</progress></dd></div>"].join("");

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