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
      setError('AI job search failed. Please try again or check your AI configuration.');
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
      setError('AI job discovery failed. Please check your AI configuration and try again.');
      console.error('AI discovery error:', err);
    } finally {
      setAiSearching(false);
    }
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
                    {lastSearchType === 'discovery' ? 'AI is discovering new job opportunities...' : 'AI is searching for relevant positions...'}
                  </div>
                  <div className="text-blue-600 text-sm">
                    Using your profile and preferences to find the best matches
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