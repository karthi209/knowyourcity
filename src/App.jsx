import React, { useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "ol/ol.css";
import { Map, View } from "ol";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import Overlay from "ol/Overlay";
import MVT from "ol/format/MVT";
import { fromLonLat } from "ol/proj";
import { Style, Fill, Stroke, Text } from "ol/style";

const App = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const popupOverlayRef = useRef(null);

  // We need to make sure we initialize the map only once and never re-render during interactivity.
  // Openlayers and react has some weird friction, so we need to do styling and interactivity part outside the useEffect

  useEffect(() => {
    if (mapInstanceRef.current) return;

    // Creating the baselayer
    // More layer options can be added here in the future using switch statements, will figure out how
    const baseLayer = new TileLayer({
      source: new XYZ({
        url: "https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}@2x.png", // cartocdn's light themed map at 2x resolution
      }),
    });

    // Loading the actual vector tile layer here
    // Using the data from self hosted tileserver
    const vtLayer = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: "http://localhost:8000/tiles/gccwards/{z}/{x}/{y}.mvt",
        overlaps: false,
      }),
      style: (feature) => getFeatureStyle(feature),
    });

    // This is for the popup when we hover over specific feature
    const popupOverlay = new Overlay({
      element: document.createElement("div"),
      positioning: "bottom-center",
      offset: [0, -10],
      className: "ol-popup",
    });
    popupOverlayRef.current = popupOverlay;

    // The actual map initialization
    const map = new Map({
      target: mapContainerRef.current,
      layers: [baseLayer, vtLayer], // loading the base and vector layer here
      view: new View({
        center: fromLonLat([80.237617, 13.067439]), // Default view will focus on Chennai city
        zoom: 11,
        minZoom: 11,
        maxZoom: 18,
      }),
    });

    map.addOverlay(popupOverlay); // here we are adding the popup as an overlay over the map
    mapInstanceRef.current = map;

    // Add interactivity
    addMapInteractivity(map, vtLayer, popupOverlay);

    return () => {
      map.setTarget(null); // Clean up on unmount
      mapInstanceRef.current = null;
    };
  }, []);

  // Below code block is outside the useEffects to prevent any re-render or re-initialization of the map
  // Defining the feature styles here
  const getFeatureStyle = (feature, isHovered = false, isSelected = false) => {
    const wardNumber = feature.get("Ward");
    return new Style({
      stroke: new Stroke({
        color: isSelected ? "blue" : isHovered ? "green" : "gray", // Blue for selected, green for hovered
        width: isSelected ? 4 : isHovered ? 3 : 1, // Thicker stroke for selected
      }),
      fill: new Fill({
        color: isSelected
          ? "rgba(0, 0, 255, 0.3)" // Blue fill for selected
          : isHovered
          ? "rgba(0, 255, 0, 0.3)" // Green fill for hovered
          : "rgba(128, 128, 128, 0.1)", // Default fill for others
      }),
      text: new Text({
        text: wardNumber ? wardNumber.toString() : "",
        font: "12px Arial, sans-serif",
        fill: new Fill({ color: "black" }),
        stroke: new Stroke({ color: "white", width: 2 }),
      }),
    });
  };
  

  // This is mostly about interactivity, where the crux of the login on the hover and click is
  const addMapInteractivity = (map, vtLayer, popupOverlay) => {
    let hoveredWardNumber = null; // To track the last hovered ward number
    let selectedWardNumber = null;
  
    map.on("pointermove", (event) => {
      const pixel = map.getEventPixel(event.originalEvent);
      const feature = map.forEachFeatureAtPixel(pixel, (feat) => feat);
  
      if (feature) {
        const wardNumber = feature.get("Ward"); // Use Ward as the unique identifier
        if (hoveredWardNumber !== wardNumber) {
          hoveredWardNumber = wardNumber;
        }
      } else {
        // Clear hover when moving out of features
        hoveredWardNumber = null;
      }
  
      // Here we're only re-rendering the vector layer to apply the chaing styles.
      // Make sure to NEVER re-render the map itself, it'll just refresh everything and will make it annoying.
      vtLayer.setStyle((feat) => {
        const isHovered = feat.get("Ward") === hoveredWardNumber;
        const isSelected = feat.get("Ward") === selectedWardNumber;
        return getFeatureStyle(feat, isHovered, isSelected);
      });
    });
  
    map.on("click", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat);
      if (feature) {
        const wardNumber = feature.get("Ward");
        console.log(`Selected Ward: ${wardNumber}`);
        selectedWardNumber = wardNumber; // Update the selected ward number
      } else {
        selectedWardNumber = null; // Clear selection if no feature is clicked
      }
  
      // Re-render the vector layer to update styles
      vtLayer.setStyle((feat) => {
        const isHovered = feat.get("Ward") === hoveredWardNumber;
        const isSelected = feat.get("Ward") === selectedWardNumber;
        return getFeatureStyle(feat, isHovered, isSelected);
      });
    });
  };
  
  return <div ref={mapContainerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default App;
