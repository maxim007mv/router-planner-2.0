import React from 'react';
import { motion } from 'framer-motion';
import { FaLandmark, FaMapMarkerAlt, FaClock, FaSubway, FaInfoCircle, FaCamera, FaWalking, FaCoffee } from 'react-icons/fa';
import './HistoricalRoutes.css';

const HistoricalRoutes = () => {
  return (
    <motion.div 
      className="historical-routes-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1>Historical Routes</h1>
      <p>Coming soon...</p>
    </motion.div>
  );
};

export default HistoricalRoutes; 