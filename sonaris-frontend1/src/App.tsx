import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { SonarAnalysis } from './pages/SonarAnalysis';
import { LiveDetection } from './pages/LiveDetection';
import { MissionMap } from './pages/MissionMap';
import { CaseStudies } from './pages/CaseStudies';
import { DetectionHistory } from './pages/DetectionHistory';
import { Reports } from './pages/Reports';
import { DataAI } from './pages/DataAI';
import { Architecture } from './pages/Architecture';
import { Performance } from './pages/Performance';
import { About } from './pages/About';
import { JudgeModeProvider } from './components/judge/JudgeModeContext';
import { JudgeModeOverlay } from './components/judge/JudgeModeOverlay';

function App() {
  return (
    <BrowserRouter>
      <JudgeModeProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sonar-analysis" element={<SonarAnalysis />} />
            <Route path="/live-detection" element={<LiveDetection />} />
            <Route path="/mission-map" element={<MissionMap />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/detection-history" element={<DetectionHistory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/data-ai" element={<DataAI />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
        <JudgeModeOverlay />
      </JudgeModeProvider>
    </BrowserRouter>
  );
}

export default App;
