import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { Zoom } from "ol/control";
import { MdMenu } from "react-icons/md";
import { Style, Fill, Stroke } from "ol/style";
import Overlay from "ol/Overlay";
import { defaults as defaultInteractions } from "ol/interaction";

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

const getStyle = (feature) => {
  if (!feature) return null;

  const wardNumber = feature.get("Ward");
  const isHovered = hoveredWard === wardNumber;
  const isSelected = selectedWard === wardNumber;

  return new Style({
    stroke: new Stroke({
      color: isSelected ? "#FF0000" : isHovered ? "#005bb5" : "#0080ff",
      width: isSelected ? 3 : isHovered ? 2 : 1,
    }),
    fill: new Fill({
      color: isSelected
        ? "rgba(255, 215, 0, 0.5)"
        : isHovered
        ? "rgba(0, 128, 255, 0.3)"
        : "rgba(0, 128, 255, 0.1)",
    }),
  });
};

let hoveredWard = null; // Declare outside the component
let selectedWard = null;// Declare outside the component

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const chennaiExtent = useMemo(
    () => [8802010.0, 1367438.0, 9052010.0, 1557438.0],
    []
  );

  useEffect(() => {
    if (mapRef.current) return;

    const popupOverlay = new Overlay({
      element: document.createElement("div"),
      positioning: "bottom-center",
      offset: [0, -10],
      stopEvent: false,
    });
    popupOverlay.getElement().className = "ol-popup";
    popupRef.current = popupOverlay;

    const vtLayer = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: "http://localhost:8000/tiles/{z}/{x}/{y}.mvt",
        maxZoom: 15,
        minZoom: 10,
        tilePixelRatio: 1,
        tileSize: 512,
      }),
    });

    const mapInstance = new Map({
      target: "map",
      layers: [createBaseLayer("carto"), vtLayer],
      view: new View({
        center: fromLonLat([80.237617, 13.067439]),
        zoom: 10,
        minZoom: 10,
        maxZoom: 15,
        extent: chennaiExtent,
      }),
      interactions: defaultInteractions({ mouseWheelZoom: true }),
    });

    mapInstance.addOverlay(popupOverlay);
    mapRef.current = mapInstance;
    vtLayer.setStyle(getStyle); // Set style on layer

    mapInstance.on("pointerdown", () => {
      mapInstance.getTargetElement().style.cursor = "grabbing";
    });

    mapInstance.on("pointerup", () => {
      mapInstance.getTargetElement().style.cursor = "grab";
    });

    mapInstance.on("pointermove", (event) => {
      const feature = mapInstance.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature,
        { hitTolerance: 1, layerFilter: (layer) => layer === vtLayer }
      );

      const mapTarget = mapInstance.getTargetElement();

      if (feature) {
        const wardNumber = feature.get("Ward");
        hoveredWard = wardNumber; // Update global variable
        mapInstance.changed(); // Force redraw

        const element = popupOverlay.getElement();
        element.innerHTML = `Ward ${wardNumber}`;
        popupOverlay.setPosition(event.coordinate);

        mapTarget.style.cursor = "pointer";
      } else {
        if (hoveredWard !== null) {
          hoveredWard = null;
          mapInstance.changed();// Force redraw
        }

        popupOverlay.setPosition(undefined);
        mapTarget.style.cursor = "grab";
      }
    });

    const handleClick = (event) => {
      const feature = mapInstance.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature,
        { hitTolerance: 1, layerFilter: (layer) => layer === vtLayer }
      );

      if (feature) {
        const wardNumber = feature.get("Ward");
        selectedWard = wardNumber;
        mapInstance.changed();// Force redraw
        mapInstance.getView().setCenter(event.coordinate);
        mapInstance.getView().setZoom(12);
      }
    };

    mapInstance.on("click", handleClick);

    return () => {
      if (mapRef.current) {
        const mapInstance = mapRef.current;
        mapInstance.un("pointerdown");
        mapInstance.un("pointerup");
        mapInstance.un("pointermove");
        mapInstance.un("click", handleClick);
        popupOverlay.setPosition(undefined);
        mapRef.current.setTarget(null);
        mapRef.current = null;
      }
    };
  }, [chennaiExtent]); // Removed getStyle from dependency array

  // ... rest of your component code (handleSearch, return JSX)
    const handleSearch = async (event) => {
    event.preventDefault();

    if (!searchQuery.trim()) {
      setErrorMessage("Please enter a location to search.");
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json`
      );
      if (!response.ok) throw new Error("Failed to fetch location data");

      const results = await response.json();
      if (!results || results.length === 0) {
        throw new Error("No results found for your search query.");
      }

      const { lat, lon } = results[0];
      mapRef.current.getView().setCenter(fromLonLat([parseFloat(lon), parseFloat(lat)]));
      mapRef.current.getView().setZoom(12);
      setErrorMessage(""); // Clear any previous error messages
    } catch (error) {
      setErrorMessage(error.message);
    }
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

      <Offcanvas
        show={menuOpen}
        onHide={() => setMenuOpen(false)}
        style={{ width: "25vw" }}
      >
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
    </>
  );
}

export default App;
