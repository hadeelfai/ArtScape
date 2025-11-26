import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import News from './pages/News';
import ArticleDetailPage from "./pages/ArticleDetailPage";
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import FollowerPage from './pages/FollowerPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import Layout from './components/Layout';
import { Toaster } from 'sonner';
import GalleryPage from './pages/GalleryPage';
import AdminProfile from './pages/AdminProfile';
import ContactUs from './pages/ContactUs';


const App = () => {
  return (
    <>
      <Toaster position="top-center" />

      <Routes>

        {/* Auth Routes */}
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<SignInPage />} /> {/* Alias */}

        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/GalleryPage" element={<GalleryPage />} />

        <Route 
          path="/CommunityPage" element={
            <Layout>
              <CommunityPage />
            </Layout>
          }
        />
        <Route path="/contact" element={<ContactUs /> }/>

        <Route path="/News" element={<News />} />
        <Route path="/news/:id" element={<ArticleDetailPage />} />
        <Route path="/articles/:id" element={<ArticleDetailPage />} />

        {/* Profile Routes */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />

        {/* Followers / Following */}
        <Route path="/profile/followers" element={<FollowerPage />} />
        <Route path="/profile/following" element={<FollowerPage />} />
        <Route path="/profile/:userId/followers" element={<FollowerPage />} />
        <Route path="/profile/:userId/following" element={<FollowerPage />} />

        {/* Edit Profile */}
        <Route path="/edit-profile" element={<EditProfilePage />} />

        {/* Admin Profile */}

        <Route path="/admin" element={<AdminProfile />} />

      </Routes>
    </>
  );
};

export default App;
