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
import Profile from './pages/Profile';
import OrganizerVolunteers from './pages/OrganizerVolunteers';
import StudentProfile from './pages/StudentProfile';

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

              {/* Base Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/gigs/:id" element={<GigDetails />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Student Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/dashboard/student" element={<StudentDashboard />} />
                <Route path="/dashboard/student/profile" element={<StudentProfile />} />
              </Route>

              {/* Organizer Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['organizer', 'admin']} />}>
                <Route path="/dashboard/organizer" element={<OrganizerDashboard />} />
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
