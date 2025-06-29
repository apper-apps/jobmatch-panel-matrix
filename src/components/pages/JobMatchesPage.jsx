import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Header from "@/components/organisms/Header";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import JobMatchCard from "@/components/molecules/JobMatchCard";
import SearchBar from "@/components/molecules/SearchBar";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Loading from "@/components/ui/Loading";
import { jobMatchService } from "@/services/api/jobMatchService";

const JobMatchesPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [lastSearchType, setLastSearchType] = useState('manual');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, jobId: null, jobTitle: '' });
  const [selectedJobs, setSelectedJobs] = useState(new Set());
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
      
      // Check if we received data or if database might not be connected
      if (!data || data.length === 0) {
        // This could indicate database connectivity issues
        setError('Database connection may not be available. Please check your connection or contact support.');
      } else {
        setJobs(data);
      }
    } catch (err) {
      // Enhanced error detection for database connectivity
      if (err.message?.includes('authentication') || err.message?.includes('unauthorized') || err.message?.includes('401')) {
        setError('Database authentication failed. Please check your connection and try again.');
      } else if (err.message?.includes('network') || err.message?.includes('timeout') || err.message?.includes('connection')) {
        setError('Database connection failed. Please check your network connection and try again.');
      } else if (err.message?.includes('server') || err.message?.includes('500')) {
        setError('Database server is not responding. Please try again later or contact support.');
      } else {
        setError('Failed to load job matches from database. Please check your connection and try again.');
      }
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

    // Enhanced geographic and role-based filtering to prevent mismatched jobs
    const validateJobAlignment = (job) => {
      // Check if job location contains common US indicators when user might be in Europe
      const usLocationIndicators = ['USA', 'United States', ', NY', ', CA', ', TX', ', FL', ', WA', ', IL'];
      const hasUSLocation = usLocationIndicators.some(indicator => 
        job.location && job.location.includes(indicator)
      );
      
      // Check if job title suggests developer role when user might be product manager
      const developerTitles = ['Software Engineer', 'Developer', 'Frontend', 'Backend', 'Full Stack', 'Software Developer'];
      const isDeveloperRole = developerTitles.some(title => 
        job.title && job.title.toLowerCase().includes(title.toLowerCase())
      );
      
      // If this looks like a potential mismatch, apply stricter filtering
      if (hasUSLocation || isDeveloperRole) {
        // Allow these jobs only if they have very high match scores (indicating AI validated them)
        const averageMatch = (job.profile_match + job.preference_match) / 2;
        return averageMatch >= 85; // Require higher threshold for potentially mismatched jobs
      }
      
      return true; // Allow other jobs through normal filtering
    };

    const passesAlignmentCheck = validateJobAlignment(job);

    return matchesSearch && matchesMinMatch && matchesJobType && matchesWorkArrangement && passesAlignmentCheck;
  });

  // Add profile mismatch detection and user feedback
  const detectProfileMismatch = () => {
    const potentialMismatches = jobs.filter(job => {
      const usLocationIndicators = ['USA', 'United States', ', NY', ', CA', ', TX', ', FL', ', WA', ', IL'];
      const hasUSLocation = usLocationIndicators.some(indicator => 
        job.location && job.location.includes(indicator)
      );
      
      const developerTitles = ['Software Engineer', 'Developer', 'Frontend', 'Backend', 'Full Stack'];
      const isDeveloperRole = developerTitles.some(title => 
        job.title && job.title.toLowerCase().includes(title.toLowerCase())
      );
      
      return hasUSLocation || isDeveloperRole;
    });

    if (potentialMismatches.length > filteredJobs.length * 0.3) {
      console.warn('Profile mismatch detected: Many jobs appear to be for different location/role than expected');
      if (potentialMismatches.length > 5) {
        setError('Job results may not match your profile. Please verify your location and role preferences are correctly set.');
      }
    }
  };

  // Run mismatch detection when jobs change
  React.useEffect(() => {
    if (jobs.length > 0) {
      detectProfileMismatch();
    }
  }, [jobs]);
const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setLastSearchType('manual');
  };

const handleAISearch = async (searchQuery) => {
    try {
      setAiSearching(true);
      setError('');
      setLastSearchType('ai');
      
      const aiJobs = await jobMatchService.aiJobSearch(searchQuery);
      setJobs(aiJobs);
      
      // Update search filter to show the AI query
      setFilters(prev => ({ ...prev, search: searchQuery }));
      
    } catch (err) {
      // Enhanced error handling for AI search
      if (err.message?.includes('AI API key not configured')) {
        setError('AI is not configured. Please set up your AI API key in the Profile section to use AI job search.');
      } else if (err.message?.includes('database') || err.message?.includes('connection') || err.message?.includes('authentication')) {
        setError('Database connection failed during AI search. Please check your connection and try again.');
      } else if (err.message?.includes('network') || err.message?.includes('timeout')) {
        setError('Network error during AI job search. Please check your connection and try again.');
      } else {
        setError('AI job search failed. Please check your AI configuration in the Profile section and try again.');
      }
      console.error('AI search error:', err);
    } finally {
      setAiSearching(false);
    }
  };

const handleAIJobDiscovery = async () => {
    try {
      setAiSearching(true);
      setError('');
      setLastSearchType('discovery');
      
      const discoveredJobs = await jobMatchService.aiJobDiscovery();
      setJobs(discoveredJobs);
      
      // Clear search filter for discovery mode
      setFilters(prev => ({ ...prev, search: '' }));
      
    } catch (err) {
      // Enhanced error handling for AI discovery
      if (err.message?.includes('AI API key not configured')) {
        setError('AI is not configured. Please set up your AI API key in the Profile section to use AI job discovery.');
      } else if (err.message?.includes('database') || err.message?.includes('connection') || err.message?.includes('authentication')) {
        setError('Database connection failed during AI discovery. Please check your connection and try again.');
      } else if (err.message?.includes('network') || err.message?.includes('timeout')) {
        setError('Network error during AI job discovery. Please check your connection and try again.');
      } else {
        setError('AI job discovery failed. Please check your AI configuration in the Profile section and try again.');
      }
      console.error('AI discovery error:', err);
    } finally {
      setAiSearching(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      setLoading(true);
      await jobMatchService.delete(jobId);
      await loadJobs(); // Refresh the job list
      setDeleteConfirm({ show: false, jobId: null, jobTitle: '' });
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.size === 0) return;
    
    try {
      setLoading(true);
      const deletePromises = Array.from(selectedJobs).map(jobId => 
        jobMatchService.delete(jobId)
      );
      await Promise.all(deletePromises);
      setSelectedJobs(new Set());
      await loadJobs();
    } catch (err) {
      console.error('Error deleting jobs:', err);
      setError('Failed to delete selected jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      {selectedJobs.size > 0 && (
        <Button
          variant="danger"
          icon="Trash2"
          onClick={handleBulkDelete}
          loading={loading}
        >
          Delete {selectedJobs.size} Selected
        </Button>
      )}
      <Button
        variant="secondary"
        icon="RefreshCw"
        onClick={loadJobs}
        loading={loading}
      >
        Refresh
      </Button>
      <Button
        variant="accent"
        icon="Sparkles"
        onClick={handleAIJobDiscovery}
        loading={aiSearching}
      >
        AI Job Discovery
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
        subtitle={`${filteredJobs.length} opportunities found${lastSearchType === 'ai' ? ' (AI Search)' : lastSearchType === 'discovery' ? ' (AI Discovery)' : ''}`}
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
                onAISearch={handleAISearch}
                loading={aiSearching}
                supportsAI={true}
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
              <Badge variant={lastSearchType === 'ai' ? 'accent' : 'default'} size="sm">
                <ApperIcon name={lastSearchType === 'ai' ? "Sparkles" : "Search"} size={12} className="mr-1" />
                "{filters.search}"
                {lastSearchType === 'ai' && <span className="ml-1 text-xs">(AI)</span>}
              </Badge>
            )}
            {lastSearchType === 'discovery' && (
              <Badge variant="accent" size="sm">
                <ApperIcon name="Bot" size={12} className="mr-1" />
                AI Discovery Mode
              </Badge>
            )}
          </div>
          
          {/* AI Search Status */}
{aiSearching && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <ApperIcon name="Loader2" size={20} className="animate-spin text-blue-600" />
                <div>
                  <div className="text-blue-800 font-medium">
                    {lastSearchType === 'discovery' ? 'AI is discovering new job opportunities from database...' : 'AI is searching for relevant positions in database...'}
                  </div>
                  <div className="text-blue-600 text-sm">
                    Using your profile and preferences to find the best matches from job database
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Job Matches */}
{filteredJobs.length === 0 && !aiSearching ? (
          <Empty
            icon={lastSearchType === 'ai' || lastSearchType === 'discovery' ? "Bot" : "Search"}
            title={lastSearchType === 'ai' || lastSearchType === 'discovery' ? "No AI matches found" : "No job matches found"}
            message={
              lastSearchType === 'ai' ? "AI couldn't find jobs matching your search. Try a different query or check your AI configuration." :
              lastSearchType === 'discovery' ? "AI discovery didn't find new opportunities. Try updating your profile or preferences." :
              "Try adjusting your filters, use AI search, or update your profile to get better matches."
            }
            actionLabel={lastSearchType === 'ai' || lastSearchType === 'discovery' ? "Try Regular Search" : "Try AI Discovery"}
            onAction={() => lastSearchType === 'ai' || lastSearchType === 'discovery' ? handleSearch('') : handleAIJobDiscovery()}
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
                <JobMatchCard 
                  job={job} 
                  onEdit={(jobId) => {
                    // Navigate to edit page or open edit modal
                    console.log('Edit job:', jobId);
                  }}
                  onDelete={(jobId, jobTitle) => {
                    setDeleteConfirm({ 
                      show: true, 
                      jobId, 
                      jobTitle 
                    });
                  }}
                  selected={selectedJobs.has(job.Id)}
                  onSelect={(jobId, selected) => {
                    const newSelected = new Set(selectedJobs);
                    if (selected) {
                      newSelected.add(jobId);
                    } else {
                      newSelected.delete(jobId);
                    }
                    setSelectedJobs(newSelected);
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ApperIcon name="AlertTriangle" size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Job Match</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{deleteConfirm.jobTitle}"? This will permanently remove this job match from your list.
              </p>
              
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setDeleteConfirm({ show: false, jobId: null, jobTitle: '' })}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  icon="Trash2"
                  onClick={() => handleDeleteJob(deleteConfirm.jobId)}
                  loading={loading}
                >
                  Delete Job
                </Button>
              </div>
            </motion.div>
          </div>
        )}
    </div>
  );
};

export default JobMatchesPage;