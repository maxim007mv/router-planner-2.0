import React from 'react';
import { motion } from 'framer-motion';
import { FaUtensils, FaMapMarkerAlt, FaClock, FaSubway, FaInfoCircle, FaCamera, FaWalking, FaCoffee } from 'react-icons/fa';
import './GastroRoutes.css';

const GastroRoutes = () => {
  return (
    <motion.div 
      className="gastro-routes-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1>Gastro Routes</h1>
      <p>Coming soon...</p>
    </motion.div>
  );
};

export default GastroRoutes; 