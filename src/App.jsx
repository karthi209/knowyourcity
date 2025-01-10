import React, { useEffect, useState } from "react";
import { Button, ListGroup, Offcanvas } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "ol/ol.css";
import "./App.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { Zoom } from "ol/control";
import { MdMenu } from "react-icons/md";
import { Style, Fill, Stroke } from "ol/style";

const createBaseLayer = (type) => {
  switch (type) {
    case "carto":
      return new TileLayer({
        source: new XYZ({
          url: "https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
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
  const [map, setMap] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedWards, setSelectedWards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const chennaiExtent = [8802010.0, 1367438.0, 9052010.0, 1557438.0 ];
    const mapInstance = new Map({
      target: "map",
      layers: [createBaseLayer("carto")],
      view: new View({
        center: fromLonLat([80.237617, 13.067439]), // Chennai coordinates
        zoom: 10,
        minZoom: 10,
        maxZoom: 15,
        extent: chennaiExtent,
      }),
      controls: [new Zoom({ className: "custom-zoom-control" })],
    });

    // Load all wards layer
    const allWardsLayer = new VectorLayer({
      source: new VectorSource({
        url: "/geojson/all_wards.geojson", // Combined GeoJSON file for all wards
        format: new GeoJSON(),
      }),
      style: new Style({
        stroke: new Stroke({
          color: "purple", // Ward border color
          width: 1, // Border width
        }),
        fill: new Fill({
          color: "rgba(131, 134, 198, 0.11)", // Ward fill color with transparency
        }),
      }),
    });

    mapInstance.addLayer(allWardsLayer);
    setMap(mapInstance);

    return () => mapInstance.setTarget(null);
  }, []);

  const handleWardSelection = async (wardNumber) => {
    if (!map) return;
  
    try {
      // Fetch the ward's GeoJSON
      const response = await fetch(`/geojson/ward_${wardNumber}.geojson`);
      if (!response.ok) throw new Error(`Failed to fetch ward ${wardNumber}`);
      const wardGeoJSON = await response.json();
  
      const features = new GeoJSON().readFeatures(wardGeoJSON);
      const wardLayer = new VectorLayer({
        source: new VectorSource({ features }),
        style: new Style({
          stroke: new Stroke({ color: "#FF0000", width: 2 }),
          fill: new Fill({ color: "rgba(255, 215, 0, 0.5)" }),
        }),
      });
  
      map.getLayers().forEach((layer) => {
        if (layer !== allWardsLayer) map.removeLayer(layer); // Remove other layers
      });
  
      map.addLayer(wardLayer);
  
      setSelectedWards([wardNumber]);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleInspectWard = async (wardNumber) => {
    if (!map) return;
  
    try {
      const response = await fetch(`/geojson/ward_${wardNumber}.geojson`);
      if (!response.ok) throw new Error(`Failed to fetch ward ${wardNumber}`);
      const wardGeoJSON = await response.json();
  
      const features = new GeoJSON().readFeatures(wardGeoJSON);
      const wardLayer = new VectorLayer({
        source: new VectorSource({ features }),
        style: new Style({
          stroke: new Stroke({ color: "#FF0000", width: 2 }),
          fill: new Fill({ color: "rgba(255, 215, 0, 0.5)" }),
        }),
      });
  
      map.getLayers().forEach((layer) => {
        map.removeLayer(layer); // Clear all layers
      });
  
      map.addLayer(wardLayer);
      map.getView().fit(wardLayer.getSource().getExtent(), { padding: [20, 20, 20, 20] });
  
      setSelectedWards([wardNumber]);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleShowAllWards = () => {
    if (!map) return;
  
    map.getLayers().forEach((layer) => {
      if (layer !== allWardsLayer) map.removeLayer(layer); // Remove other layers
    });
  
    map.addLayer(allWardsLayer);
    setSelectedWards([]);
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json`
      );
      if (!response.ok) throw new Error("Failed to fetch location data");
      const results = await response.json();
      if (results.length === 0) throw new Error("No results found");

      const { lat, lon } = results[0];
      map.getView().setCenter(fromLonLat([parseFloat(lon), parseFloat(lat)]));
      map.getView().setZoom(12);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <>
      <div id="map" style={{ width: "100%", height: "97vh" }}></div>

      {/* Hamburger Menu */}
      <Button
        variant="primary"
        className="d-flex align-items-center justify-content-center"
        style={{
          position: "absolute",
          top: "15px",
          left: "10px",
          zIndex: 1000,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "#282828", // Material Design 3 color
          border: "none"
        }}
        onClick={() => setMenuOpen(true)}
      >
        <MdMenu size={24} color="white" /> {/* Material Design icon */}
      </Button>

      {/* Offcanvas Menu */}
      <Offcanvas show={menuOpen} onHide={() => setMenuOpen(false)}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Greater Chennai Corporation Wards</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ListGroup>
            {/* All Wards Option */}
            <ListGroup.Item
              action
              active={selectedWards.length === 0}
              onClick={handleShowAllWards}
            >
              All Wards
            </ListGroup.Item>

            {/* Individual Ward Options */}
            {[...Array(200)].map((_, index) => {
              const wardNumber = index + 1;
              return (
                <ListGroup.Item
                  key={wardNumber}
                  action
                  active={selectedWards.includes(wardNumber)}
                  onClick={() => handleWardSelection(wardNumber)}
                >
                  Ward {wardNumber}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>
      {/* Locate Me Button */}
            <Button
              variant="success"
              className="d-flex justify-content-center align-items-center"
              style={{
                position: "absolute",
                top: "15px",
                right: "2%",
                zIndex: 1000,
                width: "35px",
                height: "35px",
                borderRadius: "50%", // Circular button for MD3
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)", // Subtle shadow for MD3 elevation
                padding: 0, // Remove extra padding
                backgroundColor: "whitesmoke",
                border: "none"
              }}
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      map.getView().setCenter(fromLonLat([longitude, latitude]));
                      map.getView().setZoom(12);
                    },
                    (error) => console.error("Geolocation error:", error)
                  );
                }
              }}
            >
              <img
                src="/crosshair.svg"
                alt="Locate Me"
                style={{
                  width: "18px", // Adjust size for MD3 iconography
                  height: "18px",
                }}
              />
            </Button>

      {/* Search Bar */}
      <div className="search-bar" style={{ position: 'absolute', top: '15px', left: '70px' }}>
        <input
          type="text"
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '10px',
            paddingLeft: '20px',
            width: '300px',
            borderRadius: '25px',
            border: '0px solid #ccc',
            backgroundColor: 'whitesmoke',
            fontSize: '14px', // Material Design font size
          }}
        />
        <Button onClick={handleSearch} className="md3-search-button">
          <i className="material-icons">search</i>
        </Button>
      </div>

      {/* Inspect Button */}
      <Button
        variant="warning"
        onClick={() => selectedWards.length === 1 && handleInspectWard(selectedWards[0])}
        disabled={selectedWards.length !== 1}
      >
        Inspect
      </Button>

      {/* Error Message */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </>
  );
}

export default App;
