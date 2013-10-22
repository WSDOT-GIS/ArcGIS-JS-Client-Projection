/*global define, require, module*/
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['use!proj4js'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory(require('proj4js'));
	} else {
		// Browser globals (root is window)
		root.returnExports = factory(root.Proj4js);
	}
}(this, function (Proj4js) {
	"use strict";

	function projectNumberPair(geometry, sourcePrj, destPrj) {
		/// <summary>Projects an array containing two numbers (representing a point).</summary>
		/// <param name="geometry" type="Number[]">An array containing two numbers.</param>
		/// <param name="sourcePrj" type="Proj4js.Proj">Source Projection</param>
		/// <param name="destPrj" type="Proj4js.Proj">Destination Projection</param>
		/// <returns type="Number[]">Returns a projected copy of the original array.</returns>
		var g, output;
		// Convert the input geometry (a coordinate pair array) into an object that can be converted by Proj4js.
		g = { x: geometry[0], y: geometry[1] };
		g = Proj4js.transform(sourcePrj, destPrj, g);
		output = [g.x, g.y];
		return output;
	}

	function projectArrays(points, sourcePrj, destPrj) {
		var output, i, l, point;
		output = [];

		for (i = 0, l = points.length; i < l; i += 1) {
			point = points[i];

			if (point[0] instanceof Array) {
				output.push(projectArrays(point, sourcePrj, destPrj));
			} else {
				output.push(projectNumberPair(point, sourcePrj, destPrj));
			}
		}

		return output;
	}

	function projectEsriGeometry(geometry, sourcePrj, destPrj, outputParser) {
		/// <summary>Projects an esri.Geometry from one projection to another using Proj4js.</summary>
		/// <param name="geometry" type="esri.Geometry|object">An esri.Geometry object (or a JSON object that can be passed to a geometry constructor).</param>
		/// <param name="sourcePrj" type="Proj4js.Proj">Source Projection</param>
		/// <param name="destPrj" type="Proj4js.Proj">Destination Projection</param>
		/// <returns type="esri.Geometry">Returns a projected copy of the input geometry.</returns>

		var output;

		// Get the source projection from the geometry if not provided via parameter...
		if (!sourcePrj && geometry.spatialReference && geometry.spatialReference.wkid) {
			sourcePrj = new Proj4js.Proj(["EPSG", geometry.spatialReference.wkid].join(":"));
		}

		if (geometry.x !== undefined && geometry.y !== undefined) {
			output = Proj4js.transform(sourcePrj, destPrj, { x: geometry.x, y: geometry.y });
		} else if (geometry instanceof Array && geometry.length >= 2) {
			output = projectNumberPair(geometry, sourcePrj, destPrj);
		} else if (geometry.points !== undefined) { // multipoint
			output = { points: projectArrays(geometry.points, sourcePrj, destPrj) };
		} else if (geometry.paths !== undefined) { // polyline
			output = { paths: projectArrays(geometry.paths, sourcePrj, destPrj) };
		} else if (geometry.rings !== undefined) { // polygon
			output = { rings: projectArrays(geometry.rings, sourcePrj, destPrj) };
		}

		// Set the spatialReference property if the input geometry had this property defined...
		if (geometry.spatialReference) {
			output.spatialReference = { wkid: Number(destPrj.srsProjNumber) };
		}

		// Convert the output object into an esri.Geometry if that class is available.
		if (typeof outputParser === "function") {
			output = outputParser(output);
		}

		////if (esri !== undefined && esri.geometry !== undefined && esri.geometry.fromJson !== undefined) {
		////	output = esri.geometry.fromJson(output);
		////}

		return output;
	}



	function Projector(inputProj, outputProj, outputParser) {
		/// <summary>A class that can project an esri.Geometry from one projection to another.</summary>
		/// <param name="inputProj" type="Proj4js.Proj">The input projection system.</param>
		/// <param name="outputProj" type="Proj4js.Proj">The output projection system.</param>
		if (inputProj === null || inputProj === undefined || !(inputProj instanceof Proj4js.Proj)) {
			throw new Error("inputProj not defined");
		}
		if (outputProj === null || outputProj === undefined || !(outputProj instanceof Proj4js.Proj)) {
			throw new Error("outputProj not defined");
		}
		this.inputProj = inputProj;
		this.outputProj = outputProj;
		this.outputParser = outputParser;
	}

	Projector.prototype.project = function (geometry) {
		return projectEsriGeometry(geometry, this.inputProj, this.outputProj, this.outputParser);
	};

	////// Add the projectEsriGeometry method to the Proj4js module.
	////Proj4js.projectEsriGeometry = projectEsriGeometry;
	////Proj4js.EsriProjector = Projector;

	return {
		projectEsriGeometry: projectEsriGeometry,
		Projector: Projector
	};
}));