import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke } from 'ol/style';
import 'ol/ol.css';

const MapComponent = ({ onMapControlsReady }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [cmaLayer, setCmaLayer] = useState(null);
  const [gccLayer, setGccLayer] = useState(null);
  const [avadiLayer, setAvadiLayer] = useState(null);
  const [kanchipuramLayer, setKanchipuramLayer] = useState(null);
  const [tambaramLayer, setTambaramLayer] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attributions: '© OpenStreetMap contributors, © CARTO'
          })
        })
      ],
      view: new View({
        center: fromLonLat([80.2707, 13.0827]), // Chennai coordinates
        zoom: 10,
        maxZoom: 19,
        minZoom: 5
      })
    });

    // Create CMA boundary layer
    const cmaSource = new VectorSource({
      url: './metropolitan_limits/cma-boundary.geojson',
      format: new GeoJSON()
    });

    const cmaVectorLayer = new VectorLayer({
      source: cmaSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(168, 85, 247, 0.1)'
        }),
        stroke: new Stroke({
          color: '#A855F7',
          width: 2
        })
      })
    });

    // Create GCC boundary layer
    const gccSource = new VectorSource({
      url: './corporation_limits/gcc.geojson',
      format: new GeoJSON()
    });

    const gccVectorLayer = new VectorLayer({
      source: gccSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(168, 85, 247, 0.05)'
        }),
        stroke: new Stroke({
          color: '#A855F7',
          width: 1.5
        })
      })
    });

    // Create Avadi boundary layer
    const avadiSource = new VectorSource({
      url: './corporation_limits/avadi.geojson',
      format: new GeoJSON()
    });

    const avadiVectorLayer = new VectorLayer({
      source: avadiSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(168, 85, 247, 0.05)'
        }),
        stroke: new Stroke({
          color: '#A855F7',
          width: 1.5
        })
      })
    });

    // Create Kanchipuram boundary layer
    const kanchipuramSource = new VectorSource({
      url: '/corporation_limits/kanchipuram.geojson',
      format: new GeoJSON({
      })
    });

    const kanchipuramVectorLayer = new VectorLayer({
      source: kanchipuramSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(168, 85, 247, 0.05)'
        }),
        stroke: new Stroke({
          color: '#A855F7',
          width: 1.5
        })
      })
    });

    // Create Tambaram boundary layer
    const tambaramSource = new VectorSource({
      url: './corporation_limits/tambaram.geojson',
      format: new GeoJSON()
    });

    const tambaramVectorLayer = new VectorLayer({
      source: tambaramSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(168, 85, 247, 0.05)'
        }),
        stroke: new Stroke({
          color: '#A855F7',
          width: 1.5
        })
      })
    });

    // Add layers to map
    initialMap.addLayer(cmaVectorLayer);
    initialMap.addLayer(gccVectorLayer);
    initialMap.addLayer(avadiVectorLayer);
    initialMap.addLayer(kanchipuramVectorLayer);
    initialMap.addLayer(tambaramVectorLayer);

    // Set initial state
    setMap(initialMap);
    setCmaLayer(cmaVectorLayer);
    setGccLayer(gccVectorLayer);
    setAvadiLayer(avadiVectorLayer);
    setKanchipuramLayer(kanchipuramVectorLayer);
    setTambaramLayer(tambaramVectorLayer);

    // Set up map controls
    const mapControls = {
      toggleLayer: (layerId, isActive) => {
        switch (layerId) {
          case 'cmaBoundary':
            cmaVectorLayer.setVisible(isActive);
            break;
          case 'corporationLimits':
            gccVectorLayer.setVisible(isActive);
            avadiVectorLayer.setVisible(isActive);
            kanchipuramVectorLayer.setVisible(isActive);
            tambaramVectorLayer.setVisible(isActive);
            break;
        }
      }
    };

    onMapControlsReady(mapControls);

    // Fit view to CMA boundary when loaded
    cmaSource.once('change', () => {
      if (cmaSource.getState() === 'ready') {
        const extent = cmaSource.getExtent();
        initialMap.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 1000
        });
      }
    });

    return () => {
      if (initialMap) {
        initialMap.setTarget(undefined);
      }
    };
  }, [onMapControlsReady]);

  return (
    <div ref={mapRef} className="w-full h-full" />
  );
};

export default MapComponent; 