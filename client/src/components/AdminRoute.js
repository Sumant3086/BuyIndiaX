import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  console.log('AdminRoute - Loading:', loading, 'User:', user); // Debug log

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('AdminRoute - No user, redirecting to login'); // Debug log
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    console.log('AdminRoute - User is not admin, role:', user.role); // Debug log
    return <Navigate to="/" replace />;
  }

  console.log('AdminRoute - Access granted for admin'); // Debug log
  return children;
};

export default AdminRoute;