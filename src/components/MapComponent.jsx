// src/MapComponent.js
import React, { useEffect, useRef, useState } from "react";
import { Map, View } from "ol";
import { fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import { OSM, XYZ } from "ol/source";
import { Style, Fill, Stroke } from "ol/style";
import Overlay from 'ol/Overlay';
import { Select } from "ol/interaction";
import { click } from "ol/events/condition";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import MVT from "ol/format/MVT";
import { Zoom } from "ol/control";

const createBaseLayer = (type) => {
  switch (type) {
    case "carto":
      return new TileLayer({
        source: new XYZ({
          url: "https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          minZoom: 10,
          maxZoom: 15,
        }),
      });
    case "osm":
    default:
      return new TileLayer({
        source: new OSM(),
      });
  }
};

const MapComponent = ({ onSelectWard, selectedWards, onErrorMessage }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!mapRef.current) {
      // Return early if the mapRef is not yet set.
      return;
    }

    const chennaiExtent = [8802010.0, 1367438.0, 9052010.0, 1557438.0];

    const vectorTileLayer = new TileLayer({
      source: new MVT({
        url: "http://localhost:8000/tiles/{z}/{x}/{y}.mvt",
        maxZoom: 15,
        minZoom: 10,
        tilePixelRatio: 1,
        tileSize: 512,
      }),
      style: new Style({
        stroke: new Stroke({
          color: "#0080ff",
          width: 1,
        }),
        fill: new Fill({
          color: "rgba(0, 128, 255, 0.1)",
        }),
      }),
      declutter: true,
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      preload: 2,
    });

    const mapInstance = new Map({
      target: mapRef.current, // The div that holds the map
      layers: [createBaseLayer("carto"), vectorTileLayer],
      view: new View({
        center: fromLonLat([80.237617, 13.067439]), // Chennai coordinates
        zoom: 10,
        minZoom: 10,
        maxZoom: 15,
        extent: chennaiExtent,
      }),
      controls: [new Zoom({ className: "custom-zoom-control" })],
    });

    // Popup Overlay
    const popup = new Overlay({
      element: document.getElementById("popup"),
      positioning: "bottom-center",
      stopEvent: false,
    });
    mapInstance.addOverlay(popup);

    // Select interaction for click
    const select = new Select({
      condition: click,
      style: new Style({
        stroke: new Stroke({
          color: "yellow",
          width: 3,
        }),
        fill: new Fill({
          color: "rgba(255, 255, 0, 0.3)",
        }),
      }),
    });

    select.on("select", (e) => {
      const selectedFeature = e.selected[0]; // Get the selected feature
      if (selectedFeature) {
        const coordinates = selectedFeature.getGeometry().getCoordinates();
        const wardName = selectedFeature.get("name") || "No name";
        onSelectWard(wardName); // Send the ward name to the parent
        popup.setPosition(coordinates); // Set position for popup
      }
    });

    mapInstance.addInteraction(select);
    setMap(mapInstance);

    return () => {
      // Clean up the map and overlays when the component unmounts
      mapInstance.setTarget(null);
      popup.getElement()?.remove();
    };
  }, [mapRef.current]);

  useEffect(() => {
    if (selectedWards.length > 0) {
      // Fetch ward data based on selectedWards
      // Example: You can implement your fetch logic here if you want to load data
      console.log("Selected wards:", selectedWards);
    }
  }, [selectedWards]);

  return <div ref={mapRef} style={{ width: "100%", height: "97vh" }} />;
};

export default MapComponent;
