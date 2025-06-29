import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { motion } from 'framer-motion';
import Layout from '@/components/organisms/Layout';
import ProfilePage from '@/components/pages/ProfilePage';
import PreferencesPage from '@/components/pages/PreferencesPage';
import JobMatchesPage from '@/components/pages/JobMatchesPage';
import ImportStatusPage from '@/components/pages/ImportStatusPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Layout>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            <Routes>
              <Route path="/" element={<JobMatchesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              <Route path="/job-matches" element={<JobMatchesPage />} />
              <Route path="/import-status" element={<ImportStatusPage />} />
            </Routes>
          </motion.div>
        </Layout>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          className="z-50"
        />
      </div>
    </Router>
  );
}

export default App;