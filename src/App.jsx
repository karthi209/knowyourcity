import { useState } from 'react'
import Map from './components/Map'
import SidePanel from './components/SidePanel'

function App() {
  const [mapControls, setMapControls] = useState(null);

  const handleToggleLayer = (layerId, isActive) => {
    if (mapControls?.toggleLayer) {
      mapControls.toggleLayer(layerId, isActive);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-900">
      <Map onMapControlsReady={setMapControls} />
      <SidePanel onToggleLayer={handleToggleLayer} />
    </div>
  )
}

export default App
