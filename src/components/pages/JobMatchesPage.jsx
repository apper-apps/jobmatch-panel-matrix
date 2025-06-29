import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/organisms/Header';
import JobMatchCard from '@/components/molecules/JobMatchCard';
import SearchBar from '@/components/molecules/SearchBar';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import Empty from '@/components/ui/Empty';
import ApperIcon from '@/components/ApperIcon';
import { jobMatchService } from '@/services/api/jobMatchService';

const JobMatchesPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    minMatch: 80,
    jobType: 'all',
    workArrangement: 'all'
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await jobMatchService.getAll();
      setJobs(data);
    } catch (err) {
      setError('Failed to load job matches. Please try again.');
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = filters.search === '' || 
      job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.company.toLowerCase().includes(filters.search.toLowerCase());
    
const matchesMinMatch = (job.profile_match + job.preference_match) / 2 >= filters.minMatch;
    
const matchesJobType = filters.jobType === 'all' || job.job_type === filters.jobType;
    
const matchesWorkArrangement = filters.workArrangement === 'all' || 
      job.work_arrangement === filters.workArrangement;

    return matchesSearch && matchesMinMatch && matchesJobType && matchesWorkArrangement;
  });

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        icon="RefreshCw"
        onClick={loadJobs}
        loading={loading}
      >
        Refresh
      </Button>
      <Button
        variant="primary"
        icon="Filter"
      >
        Advanced Filters
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <Header 
          title="Job Matches" 
          subtitle="Finding your perfect career opportunities"
          actions={headerActions}
        />
        <div className="flex-1 p-6">
          <Loading type="jobs" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <Header 
          title="Job Matches" 
          subtitle="Finding your perfect career opportunities"
          actions={headerActions}
        />
        <div className="flex-1 flex items-center justify-center">
          <Error
            title="Failed to Load Job Matches"
            message={error}
            onRetry={loadJobs}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header 
        title="Job Matches" 
        subtitle={`${filteredJobs.length} opportunities found`}
        actions={headerActions}
      />
      
      <div className="flex-1 p-6">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search by job title or company..."
                onSearch={handleSearch}
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={filters.minMatch}
                onChange={(e) => setFilters(prev => ({ ...prev, minMatch: parseInt(e.target.value) }))}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={70}>70%+ Match</option>
                <option value={80}>80%+ Match</option>
                <option value={90}>90%+ Match</option>
              </select>
              
              <select
                value={filters.jobType}
                onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
              
              <select
                value={filters.workArrangement}
                onChange={(e) => setFilters(prev => ({ ...prev, workArrangement: e.target.value }))}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Arrangements</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-600">Active filters:</span>
            <Badge variant="primary" size="sm">
              {filters.minMatch}%+ Match
            </Badge>
            {filters.jobType !== 'all' && (
              <Badge variant="secondary" size="sm">{filters.jobType}</Badge>
            )}
            {filters.workArrangement !== 'all' && (
              <Badge variant="accent" size="sm">{filters.workArrangement}</Badge>
            )}
            {filters.search && (
              <Badge variant="default" size="sm">
                <ApperIcon name="Search" size={12} className="mr-1" />
                "{filters.search}"
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Job Matches */}
        {filteredJobs.length === 0 ? (
          <Empty
            icon="Search"
            title="No job matches found"
            message="Try adjusting your filters or update your profile to get better matches."
            actionLabel="Update Profile"
            onAction={() => window.location.href = '/profile'}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.Id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <JobMatchCard job={job} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default JobMatchesPage;