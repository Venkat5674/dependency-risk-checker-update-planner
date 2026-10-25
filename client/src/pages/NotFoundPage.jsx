/**
 * @file NotFoundPage.jsx
 * @description 404 Error page shown for unmatched client routes.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <div style={{ display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
        <ShieldX size={48} color="var(--violet)" />
      </div>
      <div className="eyebrow">ERROR 404</div>
      <h1>Page Not Found</h1>
      <p>The requested page or security resource does not exist.</p>
      <Link to="/app" className="button">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
    </div>
  );
}
