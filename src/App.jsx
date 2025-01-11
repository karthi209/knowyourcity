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
import { Zoom } from "ol/control";
import { MdMenu } from "react-icons/md";
import { Style, Fill, Stroke } from "ol/style";
import Overlay from "ol/Overlay";
import { defaults as defaultInteractions } from "ol/interaction";
import { throttle } from "lodash";

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

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [hoveredWard, setHoveredWard] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  const mapRef = useRef(null); // Reference for the map instance
  const popupRef = useRef(null); // Reference for the popup overlay

  const chennaiExtent = useMemo(
    () => [8802010.0, 1367438.0, 9052010.0, 1557438.0],
    []
  );

  const getStyle = useCallback(
    (feature) => {
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
    },
    [hoveredWard, selectedWard]
  );

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize the popup overlay once
      const popupOverlay = new Overlay({
        element: document.createElement("div"),
        positioning: "bottom-center",
        offset: [0, -10],
        stopEvent: false,
      });
      popupOverlay.getElement().className = "ol-popup";
      popupRef.current = popupOverlay;

      // Initialize the map instance only once
      const vtLayer = new VectorTileLayer({
        source: new VectorTileSource({
          format: new MVT(),
          url: "http://localhost:8000/tiles/{z}/{x}/{y}.mvt",
          maxZoom: 15,
          minZoom: 10,
          tilePixelRatio: 1,
          tileSize: 512,
        }),
        style: getStyle,
        declutter: true,
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

      // Define event handlers for interaction
      const handlePointerMove = throttle((event) => {
        const feature = mapInstance.forEachFeatureAtPixel(
          event.pixel,
          (feature) => feature,
          { hitTolerance: 1, layerFilter: (layer) => layer === vtLayer }
        );

        if (feature) {
          const wardNumber = feature.get("Ward");
          if (hoveredWard !== wardNumber) {
            setHoveredWard(wardNumber); // Only update when necessary
          }

          const element = popupOverlay.getElement();
          element.innerHTML = `Ward ${wardNumber}`;
          popupOverlay.setPosition(event.coordinate);

          mapInstance.getTargetElement().style.cursor = "pointer";
        } else {
          if (hoveredWard !== null) {
            setHoveredWard(null); // Only update when necessary
          }
          popupOverlay.setPosition(undefined);
          mapInstance.getTargetElement().style.cursor = "";
        }
      }, 100);

      const handleClick = (event) => {
        const feature = mapInstance.forEachFeatureAtPixel(
          event.pixel,
          (feature) => feature,
          { hitTolerance: 1, layerFilter: (layer) => layer === vtLayer }
        );

        if (feature) {
          const wardNumber = feature.get("Ward");
          setSelectedWard(wardNumber);
          mapInstance.getView().setCenter(event.coordinate);
          mapInstance.getView().setZoom(12);
        }
      };

      // Bind event listeners
      mapInstance.on("pointermove", handlePointerMove);
      mapInstance.on("click", handleClick);

      // Ensure cleanup of listeners on component unmount
      return () => {
        mapInstance.un("pointermove", handlePointerMove);
        mapInstance.un("click", handleClick);
        popupOverlay.setPosition(undefined);
        mapInstance.setTarget(null);
      };
    }
  }, [chennaiExtent, getStyle, hoveredWard, selectedWard]);

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
        placement="start"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Chennai Map</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location"
            />
            <Button variant="secondary" type="submit">
              Search
            </Button>
          </form>
          {errorMessage && <div>{errorMessage}</div>}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default App;
