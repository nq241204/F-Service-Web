// frontend/src/components/MemberRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import authUtilsEnhanced from '../utils/authUtilsEnhanced';

const MemberRoute = ({ user, children }) => {
  // Use authUtils to check authentication state with fallback
  const token = authUtilsEnhanced.getToken();
  const userData = authUtilsEnhanced.getUserData();
  
  // Use user prop if available, otherwise check authUtils
  let currentUser = user;
  
  if (!user && token && userData) {
    // Handle corrupted userData
    if (!userData) {
      authUtilsEnhanced.clearAuth();
      return <Navigate to="/login" />;
    }
    
    if (userData.role === 'member' || userData.role === 'admin') {
      currentUser = userData;
    } else {
      authUtilsEnhanced.clearAuth();
      return <Navigate to="/login" />;
    }
  }

  // Missing token/userData - redirect to login
  if (!currentUser && (!token || !userData)) {
    return <Navigate to="/login" />;
  }

  // Check if user is member or admin
  if (currentUser && !['member', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/login" />;
  }

  // No user found after all checks
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return React.cloneElement(children, { user: currentUser });
};

export default MemberRoute;
