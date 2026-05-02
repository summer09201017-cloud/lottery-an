import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { MarqueeMode } from './components/modes/MarqueeMode';
import { WheelMode } from './components/modes/WheelMode';
import { SlotMode } from './components/modes/SlotMode';
import { GachaMode } from './components/modes/GachaMode';
import { useAppStore } from './store/useAppStore';

function App() {
  const { mode, setItems } = useAppStore();

  useEffect(() => {
    // Check URL for shared list
    const params = new URLSearchParams(window.location.search);
    const listParam = params.get('list');
    
    if (listParam) {
      try {
        const decodedStr = decodeURIComponent(atob(listParam));
        const parsedData = JSON.parse(decodedStr);
        
        if (Array.isArray(parsedData)) {
          const newItems = parsedData.map((itemStr: string) => {
            const parts = itemStr.split(',');
            const name = parts[0].trim();
            let weight = 1;
            
            if (parts.length > 1) {
              const parsedWeight = parseFloat(parts[1]);
              if (!isNaN(parsedWeight) && parsedWeight > 0) {
                weight = parsedWeight;
              }
            }
            
            return {
              id: crypto.randomUUID(),
              name,
              weight,
            };
          });
          
          setItems(newItems);
          
          // Optional: clear the URL parameter after loading so it doesn't get stuck
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (e) {
        console.error('Failed to parse shared list:', e);
      }
    }
  }, [setItems]);

  return (
    <MainLayout>
      {mode === 'marquee' && <MarqueeMode />}
      {mode === 'wheel' && <WheelMode />}
      {mode === 'slot' && <SlotMode />}
      {mode === 'gacha' && <GachaMode />}
    </MainLayout>
  );
}

export default App;
