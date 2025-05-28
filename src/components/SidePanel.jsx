import { useState } from 'react';
import { FaMapMarkedAlt, FaLayerGroup, FaInfoCircle, FaCity } from 'react-icons/fa';
import { HiMenuAlt3 } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';

const SidePanel = ({ onToggleLayer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    cmaBoundary: true,
    corporationLimits: false
  });

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const handleLayerToggle = (layerId) => {
    const newActiveLayers = {
      ...activeLayers,
      [layerId]: !activeLayers[layerId]
    };
    setActiveLayers(newActiveLayers);
    onToggleLayer(layerId, !activeLayers[layerId]);
  };

  return (
    <>
      <button 
        className="panel-toggle"
        onClick={togglePanel}
        aria-label={isOpen ? 'Close panel' : 'Open panel'}
      >
        {isOpen ? <IoClose className="w-6 h-6" /> : <HiMenuAlt3 className="w-6 h-6" />}
      </button>

      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <div className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-gray-200 mb-3">Map Layers</h2>
          
          <button
            className={`option-button ${activeLayers.cmaBoundary ? 'active' : ''}`}
            onClick={() => handleLayerToggle('cmaBoundary')}
          >
            <FaMapMarkedAlt className="icon" />
            <span className="text-sm">Chennai Metropolitan Area Boundary</span>
          </button>

          <button
            className={`option-button ${activeLayers.corporationLimits ? 'active' : ''}`}
            onClick={() => handleLayerToggle('corporationLimits')}
          >
            <FaCity className="icon" />
            <span className="text-sm">Corporation Limits</span>
          </button>

          <button
            className={`option-button ${activeLayers.otherLayer ? 'active' : ''}`}
            onClick={() => handleLayerToggle('otherLayer')}
          >
            <FaLayerGroup className="icon" />
            <span className="text-sm">Other Layer</span>
          </button>

          <button
            className={`option-button ${activeLayers.info ? 'active' : ''}`}
            onClick={() => handleLayerToggle('info')}
          >
            <FaInfoCircle className="icon" />
            <span className="text-sm">Information</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SidePanel; 