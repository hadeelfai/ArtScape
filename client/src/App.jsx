import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import Layout from './components/Layout'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route 
          path="/CommunityPage" 
          element={
            <Layout>
              <CommunityPage />
            </Layout>
          } 
        />   
    </Routes>  
  )
}

export default App
