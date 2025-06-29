import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Header from '@/components/organisms/Header';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import ApperIcon from '@/components/ApperIcon';
import { jobPreferencesService } from '@/services/api/jobPreferencesService';

const PreferencesPage = () => {
  const [preferences, setPreferences] = useState({
    minSalary: '',
    locations: [],
    jobTypes: [],
    workArrangements: [],
    positiveKeywords: [],
    negativeKeywords: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [newPositiveKeyword, setNewPositiveKeyword] = useState('');
  const [newNegativeKeyword, setNewNegativeKeyword] = useState('');

  // Suggestion arrays
  const locationSuggestions = [
    'New York, NY', 'San Francisco, CA', 'Seattle, WA', 'Austin, TX', 'Boston, MA',
    'Los Angeles, CA', 'Chicago, IL', 'Denver, CO', 'Atlanta, GA', 'Miami, FL',
    'London, UK', 'Berlin, Germany', 'Toronto, Canada', 'Sydney, Australia',
    'Amsterdam, Netherlands', 'Paris, France', 'Tokyo, Japan', 'Singapore',
    'Remote', 'Worldwide', 'United States', 'Europe', 'North America',
    'San Jose, CA', 'Palo Alto, CA', 'Mountain View, CA', 'Portland, OR',
    'Washington, DC', 'Philadelphia, PA', 'Dallas, TX', 'Houston, TX'
  ];

  const keywordSuggestions = [
    // Technologies
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java', 'AWS',
    'Docker', 'Kubernetes', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Redis',
    'Machine Learning', 'AI', 'Data Science', 'DevOps', 'CI/CD', 'Microservices',
    
    // Roles & Levels
    'Senior', 'Lead', 'Principal', 'Staff', 'Manager', 'Director', 'VP',
    'Frontend', 'Backend', 'Full Stack', 'Mobile', 'iOS', 'Android',
    
    // Benefits & Culture
    'Remote Work', 'Flexible Hours', 'Health Insurance', 'Stock Options',
    'Equity', '401k', 'Unlimited PTO', 'Learning Budget', 'Startup',
    'Enterprise', 'Agile', 'Scrum', 'Innovation', 'Growth', 'Mentorship',
    
    // Industries
    'Fintech', 'Healthcare', 'EdTech', 'E-commerce', 'Gaming', 'SaaS',
    'Blockchain', 'Cybersecurity', 'IoT', 'Clean Energy', 'Biotech'
  ];

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await jobPreferencesService.getPreferences();
      setPreferences(data);
    } catch (err) {
      setError('Failed to load preferences. Please try again.');
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await jobPreferencesService.updatePreferences(preferences);
      toast.success('Preferences saved successfully!');
    } catch (err) {
      toast.error('Failed to save preferences. Please try again.');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

const addLocation = () => {
    if (newLocation.trim()) {
      setPreferences(prev => ({
        ...prev,
        locations: [...prev.locations, newLocation.trim()]
      }));
      setNewLocation('');
    }
  };

  const handleLocationSuggestionSelect = (suggestion) => {
    setPreferences(prev => ({
      ...prev,
      locations: [...prev.locations, suggestion]
    }));
    setNewLocation('');
  };

  const removeLocation = (index) => {
    setPreferences(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const addPositiveKeyword = () => {
    if (newPositiveKeyword.trim()) {
      setPreferences(prev => ({
        ...prev,
        positiveKeywords: [...prev.positiveKeywords, newPositiveKeyword.trim()]
      }));
      setNewPositiveKeyword('');
    }
  };

  const removePositiveKeyword = (index) => {
    setPreferences(prev => ({
      ...prev,
      positiveKeywords: prev.positiveKeywords.filter((_, i) => i !== index)
    }));
  };

const addNegativeKeyword = () => {
    if (newNegativeKeyword.trim()) {
      setPreferences(prev => ({
        ...prev,
        negativeKeywords: [...prev.negativeKeywords, newNegativeKeyword.trim()]
      }));
      setNewNegativeKeyword('');
    }
  };

  const handlePositiveKeywordSuggestionSelect = (suggestion) => {
    setPreferences(prev => ({
      ...prev,
      positiveKeywords: [...prev.positiveKeywords, suggestion]
    }));
    setNewPositiveKeyword('');
  };

  const handleNegativeKeywordSuggestionSelect = (suggestion) => {
    setPreferences(prev => ({
      ...prev,
      negativeKeywords: [...prev.negativeKeywords, suggestion]
    }));
    setNewNegativeKeyword('');
  };

  const removeNegativeKeyword = (index) => {
    setPreferences(prev => ({
      ...prev,
      negativeKeywords: prev.negativeKeywords.filter((_, i) => i !== index)
    }));
  };

  const toggleJobType = (type) => {
    setPreferences(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type]
    }));
  };

  const toggleWorkArrangement = (arrangement) => {
    setPreferences(prev => ({
      ...prev,
      workArrangements: prev.workArrangements.includes(arrangement)
        ? prev.workArrangements.filter(a => a !== arrangement)
        : [...prev.workArrangements, arrangement]
    }));
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        icon="RotateCcw"
        onClick={loadPreferences}
      >
        Reset
      </Button>
      <Button
        variant="primary"
        icon="Save"
        onClick={handleSave}
        loading={saving}
      >
        Save Preferences
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <Header 
          title="Job Preferences" 
          subtitle="Set your ideal job criteria"
          actions={headerActions}
        />
        <div className="flex-1 p-6">
          <Loading type="form" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <Header 
          title="Job Preferences" 
          subtitle="Set your ideal job criteria"
          actions={headerActions}
        />
        <div className="flex-1 flex items-center justify-center">
          <Error
            title="Failed to Load Preferences"
            message={error}
            onRetry={loadPreferences}
          />
        </div>
      </div>
    );
  }

  const jobTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
  const workArrangementOptions = ['Remote', 'Hybrid', 'On-site'];

  return (
    <div className="h-full flex flex-col">
      <Header 
        title="Job Preferences" 
        subtitle="Configure your ideal job search criteria"
        actions={headerActions}
      />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Salary Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <ApperIcon name="DollarSign" size={20} className="text-accent-600" />
              <h3 className="text-lg font-semibold text-gray-900">Salary Expectations</h3>
            </div>
            
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Base Annual Salary (Gross)"
                type="number"
                placeholder="e.g., 80000"
                value={preferences.minSalary}
                onChange={(e) => setPreferences(prev => ({ ...prev, minSalary: e.target.value }))}
                icon="DollarSign"
              />
              <div className="flex items-end">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-700">
                  <ApperIcon name="Info" size={16} className="inline mr-1 text-blue-600" />
                  <div className="space-y-1">
                    <div className="font-medium">Gross annual base salary</div>
                    <div className="text-xs text-blue-600">
                      • Before taxes and deductions<br/>
                      • Excludes bonuses, equity, benefits<br/>
                      • Upper limit open for negotiation
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Location Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <ApperIcon name="MapPin" size={20} className="text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Preferred Locations</h3>
            </div>
            
<div className="flex gap-2 mb-4">
              <Input
                placeholder="Add location (city, country, region, or 'worldwide')"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                icon="MapPin"
                className="flex-1"
                suggestions={locationSuggestions}
                showSuggestions={true}
                onSuggestionSelect={handleLocationSuggestionSelect}
              />
              <Button
                variant="primary"
                icon="Plus"
                onClick={addLocation}
              >
                Add
              </Button>
            </div>
            
            {preferences.locations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preferences.locations.map((location, index) => (
                  <Badge
                    key={index}
                    variant="primary"
                    className="cursor-pointer hover:bg-primary-200 transition-colors"
                    onClick={() => removeLocation(index)}
                  >
                    {location}
                    <ApperIcon name="X" size={12} className="ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>

          {/* Job Type and Work Arrangement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <ApperIcon name="Briefcase" size={20} className="text-secondary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Job Types</h3>
              </div>
              
              <div className="space-y-2">
                {jobTypeOptions.map(type => (
                  <label key={type} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.jobTypes.includes(type)}
                      onChange={() => toggleJobType(type)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <ApperIcon name="Home" size={20} className="text-accent-600" />
                <h3 className="text-lg font-semibold text-gray-900">Work Arrangements</h3>
              </div>
              
              <div className="space-y-2">
                {workArrangementOptions.map(arrangement => (
                  <label key={arrangement} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.workArrangements.includes(arrangement)}
                      onChange={() => toggleWorkArrangement(arrangement)}
                      className="w-4 h-4 text-accent-600 rounded focus:ring-accent-500"
                    />
                    <span className="text-gray-700">{arrangement}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Keywords */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <ApperIcon name="Plus" size={20} className="text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Positive Keywords</h3>
              </div>
              
<div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add keywords you want to see"
                  value={newPositiveKeyword}
                  onChange={(e) => setNewPositiveKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPositiveKeyword()}
                  className="flex-1"
                  suggestions={keywordSuggestions}
                  showSuggestions={true}
                  onSuggestionSelect={handlePositiveKeywordSuggestionSelect}
                />
                <Button
                  variant="accent"
                  icon="Plus"
                  onClick={addPositiveKeyword}
                >
                  Add
                </Button>
              </div>
              
              {preferences.positiveKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {preferences.positiveKeywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="success"
                      className="cursor-pointer hover:bg-green-200 transition-colors"
                      onClick={() => removePositiveKeyword(index)}
                    >
                      {keyword}
                      <ApperIcon name="X" size={12} className="ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <ApperIcon name="Minus" size={20} className="text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Negative Keywords</h3>
              </div>
              
<div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add keywords to avoid"
                  value={newNegativeKeyword}
                  onChange={(e) => setNewNegativeKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNegativeKeyword()}
                  className="flex-1"
                  suggestions={keywordSuggestions}
                  showSuggestions={true}
                  onSuggestionSelect={handleNegativeKeywordSuggestionSelect}
                />
                <Button
                  variant="secondary"
                  icon="Plus"
                  onClick={addNegativeKeyword}
                >
                  Add
                </Button>
              </div>
              
              {preferences.negativeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {preferences.negativeKeywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="error"
                      className="cursor-pointer hover:bg-red-200 transition-colors"
                      onClick={() => removeNegativeKeyword(index)}
                    >
                      {keyword}
                      <ApperIcon name="X" size={12} className="ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;