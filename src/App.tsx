import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getAppData } from './data/loader';
import { Header } from './components/Layout/Header';
import { LandingPage } from './components/Landing/LandingPage';
import { ReadingPane } from './components/ReadingPane/ReadingPane';
import { StoryMap } from './components/StoryMap/StoryMap';
import { StatsPage } from './components/Stats/StatsPage';
import { AtlasPage } from './components/Atlas/AtlasPage';
import { StoryIndexPage } from './components/StoryIndex/StoryIndexPage';

const data = getAppData();

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-stone-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/read" element={<ReadingPane data={data} />} />
            <Route path="/map" element={<StoryMap data={data} />} />
            <Route path="/atlas" element={<AtlasPage data={data} />} />
            <Route path="/stories" element={<StoryIndexPage data={data} />} />
            <Route path="/stats" element={<StatsPage data={data} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
