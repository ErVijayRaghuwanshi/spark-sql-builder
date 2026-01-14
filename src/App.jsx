import Home from "./components/Home"
import App_v1 from "./components/App_v1";
import App_v2 from "./components/App_v2";
import App_v3 from "./components/App_v3";
import { HashRouter, Routes, Route } from "react-router-dom";

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/1" element={<App_v1 />} />
                <Route path="/2" element={<App_v2 />} />
                <Route path="/3" element={<App_v3 />} />
            </Routes>
        </HashRouter>
    )
}

export default App;
