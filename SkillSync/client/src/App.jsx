import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RequestOrganization from './pages/RequestOrganization';
import Gigs from './pages/Gigs';
import Volunteering from './pages/Volunteering';
import CreateGig from './pages/CreateGig';
import CreateEvent from './pages/CreateEvent';
import GigDetails from './pages/GigDetails';
import EventDetails from './pages/EventDetails';
import Profile from './pages/Profile';
import OrganizerVolunteers from './pages/OrganizerVolunteers';
import OrganizerProfile from './pages/OrganizerProfile';
import StudentProfile from './pages/StudentProfile';
import Network from './pages/Network';
import StudentPublicProfile from './pages/StudentPublicProfile';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/request-college" element={<RequestOrganization />} />
              <Route path="/gigs" element={<Gigs />} />
              <Route path="/volunteering" element={<Volunteering />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />

              {/* Base Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/gigs/:id" element={<GigDetails />} />
                <Route path="/volunteering/:id" element={<EventDetails />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Student Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/dashboard/student" element={<StudentDashboard />} />
                <Route path="/dashboard/student/profile" element={<StudentProfile />} />
                <Route path="/network" element={<Network />} />
              </Route>

              {/* Communications & Profiles (Shared) */}
              <Route element={<ProtectedRoute allowedRoles={['student', 'organizer', 'admin']} />}>
                <Route path="/messages" element={<Inbox />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/chat/group/:id" element={<Chat isGroup={true} />} />
                <Route path="/network/student/:id" element={<StudentPublicProfile />} />
              </Route>

              {/* Organizer Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['organizer', 'admin']} />}>
                <Route path="/dashboard/organizer" element={<OrganizerDashboard />} />
                <Route path="/dashboard/organizer/profile" element={<OrganizerProfile />} />
                <Route path="/dashboard/organizer/applications" element={<OrganizerVolunteers />} />
                <Route path="/gigs/create" element={<CreateGig />} />
                <Route path="/volunteering/create" element={<CreateEvent />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
