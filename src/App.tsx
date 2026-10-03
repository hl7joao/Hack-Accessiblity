import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { PreferencesProvider } from './context/Preferences';
import { TripProvider } from './context/Trip';
import { Alerts } from './screens/Alerts';
import { Arrive } from './screens/Arrive';
import { Home } from './screens/Home';
import { PlanTrip } from './screens/PlanTrip';
import { Platform } from './screens/Platform';
import { Ride } from './screens/Ride';
import { Settings } from './screens/Settings';
import { StationGuide } from './screens/StationGuide';

export default function App() {
  return (
    <PreferencesProvider>
      <TripProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Home />} />
              <Route path="plan" element={<PlanTrip />} />
              <Route path="trip" element={<StationGuide />} />
              <Route path="trip/platform" element={<Platform />} />
              <Route path="trip/ride" element={<Ride />} />
              <Route path="trip/arrive" element={<Arrive />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TripProvider>
    </PreferencesProvider>
  );
}
