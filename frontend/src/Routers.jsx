import { BrowserRouter, Route, Routes } from "react-router";

// ALL PAGES
import RecommendedDish from "./pages/RecommendedDish";


function Routers() {

    return (
        <BrowserRouter>
            <Routes>
                <Route index element={<RecommendedDish />} />
            </Routes>
        </BrowserRouter>
    )
}

export default Routers
