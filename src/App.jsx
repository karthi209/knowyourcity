import { useEffect, useState } from 'react';
import './App.css';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';  // Import XYZ for Carto base layer
import { fromLonLat } from 'ol/proj';  // To transform lon/lat to map projection
import { getBottomLeft, getTopRight } from 'ol/extent';  // Helper functions for working with extents

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
  const [isLocating, setIsLocating] = useState(false);  // State to track geolocation trigger
  const [searchQuery, setSearchQuery] = useState('');  // State for search query

  useEffect(() => {

    const chennaiExtent = [8802010.0, 1367438.0, 9052010.0, 1557438.0 ];

    const mapInstance = new Map({
      target: 'map',
      layers: [createBaseLayer('osm')],  // Carto base layer
      view: new View({
        center: fromLonLat([80.237617, 13.067439]), // Chennai coordinates
        zoom: 10,
        minZoom: 10, // Minimum zoom level
        maxZoom: 15, // Maximum zoom level
        extent: chennaiExtent,
      }),
    });

    setMap(mapInstance);

    return () => mapInstance.setTarget(null); // Cleanup on unmount
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        // Update the map view with the user's location
        map.getView().setCenter(fromLonLat([longitude, latitude]));
        map.getView().setZoom(12); // Zoom in on the user's location
      }, (error) => {
        console.error("Geolocation error:", error);
      });
    } else {
      console.log("Geolocation not supported by this browser.");
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = () => {
    // Implement your search functionality here
    console.log('Searching for:', searchQuery);
    // For example, convert searchQuery to a latitude and longitude and update the map view
    // map.getView().setCenter(fromLonLat([longitude, latitude]));
  };

  return (
    <>
      <div id="map" style={{ width: '100%', height: '100vh' }}></div>
      
      {/* Floating Search Bar */}
      <div className="search-bar" style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <input
          type="text"
          placeholder="Search location..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ padding: '8px', width: '250px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '8px 12px',
            marginLeft: '8px',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </div>

      {/* Locate Me Button */}
      <button
        onClick={handleLocateMe}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          padding: '8px 12px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Locate Me
      </button>
    </>
  );
}

export default App;
