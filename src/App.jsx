import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "ol/ol.css";
import "./App.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import MVT from "ol/format/MVT";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { MdMenu } from "react-icons/md";
import { Style, Fill, Stroke, Text } from "ol/style";
import Overlay from "ol/Overlay";
import { defaults as defaultInteractions } from "ol/interaction";

// Function to create different base layers based on the type of map
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

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedWard, setSelectedWard] = useState(null);

  // Refs for map, popup, and vector tile layer
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const vtLayerRef = useRef(null);
  const hoverRef = useRef(null); // Ref to track hover state without causing re-render

  const chennaiExtent = useMemo(
    () => [8802010.0, 1367438.0, 9052010.0, 1557438.0],
    []
  );

  // Define styles for hover and selected features
  const getStyle = useCallback(
    (feature, isHovered = false, isSelected = false) => {
      const wardNumber = feature.get("Ward");
      const baseStrokeColor = isSelected ? "#FF0000" : "#0080ff";
      const baseFillColor = isSelected
        ? "rgba(255, 215, 0, 0.5)"
        : isHovered
        ? "rgba(255, 0, 0, 0.3)"
        : "rgba(0, 128, 255, 0.1)";
      return new Style({
        stroke: new Stroke({
          color: baseStrokeColor,
          width: isSelected ? 3 : 1,
        }),
        fill: new Fill({
          color: baseFillColor,
        }),
        text: new Text({
          text: isSelected ? wardNumber.toString() : "",
          fill: new Fill({ color: "#000" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
          font: isSelected ? 'bold 14px Arial' : '12px Arial',
        }),
      });
    },
    [selectedWard]
  );

  const memoizedGetStyle = useMemo(() => getStyle, [selectedWard]);

  // Initialize map and handle events
  useEffect(() => {
    if (mapRef.current) return; // Ensure we only initialize the map once

    const popupOverlay = new Overlay({
      element: document.createElement("div"),
      positioning: "bottom-center",
      offset: [0, -10],
      stopEvent: false,
      className: "ward-popup",
    });
    popupOverlay.getElement().className = "ol-popup";
    popupRef.current = popupOverlay;

    const vtLayer = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: "http://localhost:8000/tiles/{z}/{x}/{y}.mvt", // Adjust URL if needed
        maxZoom: 15,
        minZoom: 10,
        tilePixelRatio: 1,
        tileSize: 512,
      }),
      style: memoizedGetStyle,
    });
    vtLayerRef.current = vtLayer;

    const mapInstance = new Map({
      target: "map",
      layers: [createBaseLayer("carto"), vtLayer],
      view: new View({
        center: fromLonLat([80.237617, 13.067439]), // Center on Chennai
        zoom: 10,
        minZoom: 10,
        maxZoom: 15,
        extent: chennaiExtent,
      }),
      interactions: defaultInteractions({ mouseWheelZoom: true }),
    });

    mapInstance.addOverlay(popupOverlay);
    mapRef.current = mapInstance;

    const handlePointerMove = (event) => {
      const mapInstance = mapRef.current;
      if (!mapInstance) return;
    
      const pixel = mapInstance.getEventPixel(event.originalEvent);
      if (!pixel || pixel.length !== 2) return;
    
      const hit = mapInstance.hasFeatureAtPixel(pixel, {
        layerFilter: (layer) => layer === vtLayerRef.current,
        hitTolerance: 1,
      });
    
      mapInstance.getTargetElement().style.cursor = hit ? "pointer" : "grab";
    
      if (hit) {
        const feature = mapInstance.forEachFeatureAtPixel(
          pixel,
          (feature) => feature,
          { hitTolerance: 1, layerFilter: (layer) => layer === vtLayerRef.current }
        );
        
        if (feature) {
          const wardNumber = feature.get("Ward");
          if (hoverRef.current !== wardNumber) {
            hoverRef.current = wardNumber;
            const popupContent = document.createElement("div");
            popupContent.innerHTML = `Ward: ${wardNumber}`;
            popupRef.current.getElement().innerHTML = "";
            popupRef.current.getElement().appendChild(popupContent);
            popupRef.current.setPosition(event.coordinate);
            
            // Update the layer style instead of individual features
            vtLayerRef.current.setStyle((feature) => {
              const featureWard = feature.get("Ward");
              return getStyle(
                feature,
                featureWard === wardNumber,
                featureWard === selectedWard
              );
            });
          }
        }
      } else {
        hoverRef.current = null;
        popupRef.current.setPosition(undefined);
        
        // Reset styles
        vtLayerRef.current.setStyle((feature) => 
          getStyle(feature, false, feature.get("Ward") === selectedWard)
        );
      }
    };

    mapInstance.on("pointermove", handlePointerMove);

    const handleClick = (event) => {
      const feature = mapInstance.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature,
        { hitTolerance: 1, layerFilter: (layer) => layer === vtLayerRef.current }
      );

      if (feature) {
        const wardNumber = feature.get("Ward");
        setSelectedWard(wardNumber === selectedWard ? null : wardNumber);

        if (wardNumber !== selectedWard) {
          const popupContent = document.createElement("div");
          popupContent.innerHTML = `Ward: ${wardNumber}`;
          popupContent.className = "click-popup";
          popupRef.current.getElement().innerHTML = "";
          popupRef.current.getElement().appendChild(popupContent);
          popupRef.current.setPosition(event.coordinate);

          mapInstance.getView().animate({
            center: event.coordinate,
            zoom: 12,
            duration: 500,
          });
        } else {
          popupRef.current.setPosition(undefined);
        }
      } else {
        setSelectedWard(null);
        popupRef.current.setPosition(undefined);
      }
    };

    mapInstance.on("click", handleClick);

    return () => {
      if (mapRef.current) {
        const mapInstance = mapRef.current;
        mapInstance.un("pointermove", handlePointerMove);
        mapInstance.un("click", handleClick);
        popupRef.current.setPosition(undefined);
        mapRef.current.setTarget(null);
        mapRef.current = null;
      }
    };
  }, [chennaiExtent, memoizedGetStyle]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search logic here
  };

  return (
    <>
      <div id="map" style={{ width: "100%", height: "97vh" }}></div>
      <Button
        variant="primary"
        onClick={() => setMenuOpen(true)}
        style={{ position: "absolute", top: 10, left: 10 }}
      >
        <MdMenu />
      </Button>

      <Offcanvas show={menuOpen} onHide={() => setMenuOpen(false)} style={{ width: "25vw" }}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <form onSubmit={handleSearch}>
            <div>
              <label>
                Search for a location:
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name"
                />
              </label>
              <button type="submit">Search</button>
            </div>
          </form>

          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </Offcanvas.Body>
      </Offcanvas>

      <style>
        {`
          .ol-popup {
            position: absolute;
            background-color: white;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #cccccc;
            bottom: 12px;
            left: -50px;
            min-width: 100px;
            transform-origin: 50% 100%;
            transition: transform 0.2s ease-out, opacity 0.2s ease-out;
          }

          .click-popup {
            background-color: rgba(0,0,0,0.75);
            color: #fff;
          }

          .ward-popup {
            padding: 10px;
            color: #000;
          }
        `}
      </style>
    </>
  );
};

export default App;
