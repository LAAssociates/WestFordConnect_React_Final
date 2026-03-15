import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/routes/RouteGuards';
import AppLayout from './components/layout/AppLayout';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import GoogleCallback from './pages/auth/GoogleCallback';
import Profile from './pages/Profile';
import CourseBrochures from './pages/CourseBrochures';
import NewsAndUpdates from './pages/NewsAndUpdates';
import Notes from './pages/Notes';
import MyWork from './pages/MyWork';
import Calendar from './pages/Calendar';
import Organization from './pages/Organization';
import Resources from './pages/Resources';
import Messenger from './pages/Messenger';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Logout from './pages/auth/Logout';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public routes - redirect to dashboard if already logged in */}
                    <Route element={<PublicRoute />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                    </Route>

                    {/* Google OAuth callback - no guard needed */}
                    <Route path="/auth/google/callback" element={<GoogleCallback />} />

                    {/* Protected routes - require authentication */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/logout" element={<Logout />} />
                            <Route path="/my-profile" element={<Profile />} />
                            <Route path="/course-brochures" element={<CourseBrochures />} />
                            <Route path="/news-and-updates" element={<NewsAndUpdates />} />
                            <Route path="/notes" element={<Notes />} />
                            <Route path="/my-work" element={<MyWork />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/organization" element={<Organization />} />
                            <Route path="/resources" element={<Resources />} />
                            <Route path="/messenger" element={<Messenger />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />

                            <Route path="*" element={<NotFound />} />
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
