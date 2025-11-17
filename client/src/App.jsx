import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import Layout from './components/Layout'
import { Toaster } from 'sonner';

const App = () => {
  return (
    <>
    <Toaster position="top-center"/>
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
      <Route path="/" element={<ProfilePage isOwnProfile={true} />} />
      <Route path="/profile" element={<ProfilePage isOwnProfile={true} />} />
      <Route path="/edit-profile" element={<EditProfilePage />} />
    </Routes>  
    </>
  )
}

export default App
