import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./lib/auth";
import { isConfigured } from "./lib/supabase";
import { Home } from "./pages/Home";
import { HowItWorks } from "./pages/HowItWorks";
import { OrganismPage } from "./pages/OrganismPage";
import { OrganismWorkshop } from "./pages/OrganismWorkshop";
import { PlanetBuilder } from "./pages/PlanetBuilder";
import { PlanetView } from "./pages/PlanetView";
import { RegionEditor } from "./pages/RegionEditor";

export default function App() {
  if (!isConfigured) {
    return <main className="page"><p className="error">The site isn't connected to its database yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.</p></main>;
  }
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/planets/new" element={<PlanetBuilder />} />
            <Route path="/planets/:id" element={<PlanetView />} />
            <Route path="/planets/:id/edit" element={<PlanetBuilder />} />
            <Route path="/planets/:id/regions/new" element={<RegionEditor />} />
            <Route path="/planets/:id/regions/:regionId/edit" element={<RegionEditor />} />
            <Route path="/planets/:id/organisms/new" element={<OrganismWorkshop />} />
            <Route path="/planets/:id/organisms/:orgId" element={<OrganismPage />} />
            <Route path="/planets/:id/organisms/:orgId/edit" element={<OrganismWorkshop />} />
            <Route path="*" element={<p className="notice">Page not found.</p>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
