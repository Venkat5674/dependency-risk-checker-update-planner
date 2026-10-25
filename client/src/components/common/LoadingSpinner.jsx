/**
 * @file LoadingSpinner.jsx
 * @description Centered loading spinner component for asynchronous data fetching states.
 */

import React from 'react';

export default function LoadingSpinner({ message = 'Loading security data...' }) {
  return (
    <div className="loading-box">
      <div className="spinner" />
      <span className="muted" style={{ fontSize: '13px' }}>{message}</span>
    </div>
  );
}
