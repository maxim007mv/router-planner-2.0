import React from 'react';
import { Link } from 'react-router-dom';
import { People } from '@mui/icons-material';

const Navigation = () => {
  return (
    <nav>
      {/* Существующие элементы навигации */}
      <Link to="/community" className="nav-link">
        <People />
        <span>Сообщество</span>
      </Link>
    </nav>
  );
}; 