import React, { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { AuthContext } from "@/App";
import ApperIcon from "@/components/ApperIcon";
import Header from "@/components/organisms/Header";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import FileUpload from "@/components/molecules/FileUpload";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Loading from "@/components/ui/Loading";
import { userProfileService } from "@/services/api/userProfileService";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiSettings, setApiSettings] = useState({
    apiKey: '',
    apiService: 'openai'
  });
  const [savingApiSettings, setSavingApiSettings] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userProfileService.getProfile();
      setProfile(data);
      
      // Load API settings if profile exists
      if (data && data.api_key) {
        setApiSettings({
          apiKey: data.api_key,
          apiService: data.api_service || 'openai'
        });
      }
} catch (err) {
      setError('Unable to load your profile. Please check your connection and try again.');
      console.error('Error loading profile:', err);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    if (!file.type.includes('pdf')) {
      toast.error('Please select a PDF file.');
      return;
}

    setUploading(true);
    setError('');

    try {
      const data = await userProfileService.importResume(file);
      
      if (!data) {
        throw new Error('No data received from upload');
      }
      // Parse extracted data with validation
      let experience = [];
      let education = [];
      let skills = [];

      try {
        if (data.experience && data.experience.trim()) {
          experience = JSON.parse(data.experience);
          if (!Array.isArray(experience)) {
            experience = [];
          }
        }
      } catch (e) {
        console.warn('Failed to parse experience data:', e);
        experience = [];
      }

      try {
        if (data.education && data.education.trim()) {
          education = JSON.parse(data.education);
          if (!Array.isArray(education)) {
            education = [];
          }
        }
} catch (e) {
        console.warn('Failed to parse education data:', e);
        education = [];
      }

      try {
        if (data.skills && typeof data.skills === 'string' && data.skills.trim()) {
          skills = data.skills.split('\n').filter(s => s.trim()).slice(0, 50); // Limit skills
        }
      } catch (e) {
        console.warn('Failed to parse skills data:', e);
        skills = [];
      }
// Validate email format before including in profile data
      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email && emailRegex.test(email.trim());
      };

      const profileData = {
        name: data.name || data.Name || 'Name not available',
        experience,
        education,
        skills,
        imported_at: data.imported_at || new Date().toISOString()
      };

      // Only include email if it's valid
      if (isValidEmail(data.email)) {
        profileData.email = data.email.trim();
      }

      setProfile(profileData);
      
      // Show appropriate success message based on what was extracted
      if (profileData.name === 'Name not available' || !profileData.email) {
        toast.success('Resume uploaded with partial information. Please review and update missing details.');
      } else {
        toast.success('Resume uploaded and processed successfully!');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to import resume. Please try again.';
      toast.error(errorMessage);
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
};

  const handleSaveApiSettings = async () => {
    if (!apiSettings.apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setSavingApiSettings(true);
    try {
      await userProfileService.updateApiSettings(apiSettings);
      toast.success('API settings saved successfully');
      setShowApiConfig(false);
      // Reload profile to get updated settings
      await loadProfile();
    } catch (err) {
      toast.error('Failed to save API settings');
      console.error('Error saving API settings:', err);
    } finally {
      setSavingApiSettings(false);
    }
  };
// Data management states
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [deletingData, setDeletingData] = useState(null);
  const [editProfileData, setEditProfileData] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        icon="Settings"
        onClick={() => setShowApiConfig(!showApiConfig)}
      >
        AI Configuration
      </Button>
      <Button
        variant="secondary"
        icon="Database"
        onClick={() => setShowDataManagement(!showDataManagement)}
      >
        Manage Data
      </Button>
      <Button
        variant="secondary"
        icon="Download"
      >
        Export Profile
      </Button>
      <Button
        variant="primary"
        icon="Edit"
        onClick={() => {
          setEditProfileData({
            name: profile?.name || '',
            email: profile?.email || '',
            experience: profile?.experience || [],
            education: profile?.education || [],
            skills: profile?.skills || []
          });
          setEditingProfile(true);
        }}
      >
        Edit Profile
      </Button>
    </div>
  );

  // Handle profile editing
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await userProfileService.updateProfile(editProfileData);
      toast.success('Profile updated successfully');
      setEditingProfile(false);
      await loadProfile(); // Reload profile data
    } catch (err) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle data deletion
  const handleDeleteData = async (dataType) => {
    if (!window.confirm(`Are you sure you want to delete all ${dataType}? This action cannot be undone.`)) {
      return;
    }

    setDeletingData(dataType);
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      let tableName = '';
      switch (dataType) {
        case 'job matches':
          tableName = 'job_match';
          break;
        case 'preferences':
          tableName = 'job_preference';
          break;
        case 'import logs':
          tableName = 'import_log';
          break;
        case 'uploaded files':
          tableName = 'uploaded_file';
          break;
        case 'PDF imports':
          tableName = 'pdf_import_data';
          break;
        default:
          throw new Error('Unknown data type');
      }

      // Get all records for this data type
      const records = await apperClient.fetchRecords(tableName, {
        fields: [{ field: { Name: "Id" } }],
        pagingInfo: { limit: 1000, offset: 0 }
      });

      if (records.success && records.data?.length > 0) {
        const recordIds = records.data.map(record => record.Id);
        
        const deleteResponse = await apperClient.deleteRecord(tableName, {
          RecordIds: recordIds
        });

        if (!deleteResponse.success) {
          throw new Error(deleteResponse.message || 'Failed to delete records');
        }

        toast.success(`Successfully deleted all ${dataType}`);
      } else {
        toast.info(`No ${dataType} found to delete`);
      }
    } catch (error) {
      console.error(`Error deleting ${dataType}:`, error);
      toast.error(`Failed to delete ${dataType}: ${error.message}`);
    } finally {
      setDeletingData(null);
    }
  };

  // Handle complete account deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: This will permanently delete your account and ALL associated data. This action cannot be undone. Type "DELETE" to confirm.')) {
      return;
    }

    const confirmation = prompt('Please type "DELETE" to confirm account deletion:');
    if (confirmation !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    setDeletingData('account');
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      // Delete data in order: dependent records first, then main profile
      const tablesToDelete = [
        'job_match',
        'job_preference', 
        'import_log',
        'pdf_import_data',
        'uploaded_file',
        'data_extraction_config',
        'user_profile'
      ];

      for (const tableName of tablesToDelete) {
        try {
          const records = await apperClient.fetchRecords(tableName, {
            fields: [{ field: { Name: "Id" } }],
            pagingInfo: { limit: 1000, offset: 0 }
          });

          if (records.success && records.data?.length > 0) {
            const recordIds = records.data.map(record => record.Id);
            
            await apperClient.deleteRecord(tableName, {
              RecordIds: recordIds
            });
          }
        } catch (err) {
          console.warn(`Failed to delete from ${tableName}:`, err);
        }
      }

      toast.success('Account and all data deleted successfully');
// Logout and redirect
      const authContext = useContext(AuthContext);
      if (authContext?.logout) {
        authContext.logout();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(`Failed to delete account: ${error.message}`);
    } finally {
      setDeletingData(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <Header 
          title="Profile" 
          subtitle="Manage your professional profile"
          actions={headerActions}
        />
        <div className="flex-1 p-6">
          <Loading type="profile" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <Header 
          title="Profile" 
          subtitle="Manage your professional profile"
          actions={headerActions}
        />
        <div className="flex-1 flex items-center justify-center">
          <Error
            title="Failed to Load Profile"
            message={error}
            onRetry={loadProfile}
          />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full flex flex-col">
        <Header 
          title="Profile" 
          subtitle="Import your resume to get started"
        />
<div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <Empty
              icon="User"
              title="No profile found"
              message="Upload your resume to create your professional profile and start getting job matches."
            />
            
            {/* API Configuration Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ApperIcon name="Zap" size={20} className="text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">AI-Powered Extraction</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={showApiConfig ? "ChevronUp" : "ChevronDown"}
                    onClick={() => setShowApiConfig(!showApiConfig)}
                  >
                    Configure
                  </Button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Configure your AI service to extract maximum information from your resume with enhanced accuracy.
                </p>
                
                {showApiConfig && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          AI Service
                        </label>
                        <select
                          value={apiSettings.apiService}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, apiService: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="openai">OpenAI (GPT-4)</option>
                          <option value="google">Google (Gemini)</option>
                          <option value="openrouter">OpenRouter</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={apiSettings.apiKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                          placeholder="Enter your API key"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2">
                        {apiSettings.apiKey ? (
                          <>
                            <ApperIcon name="CheckCircle" size={16} className="text-green-600" />
                            <span className="text-sm text-green-600">API key configured</span>
                          </>
                        ) : (
                          <>
                            <ApperIcon name="AlertCircle" size={16} className="text-yellow-600" />
                            <span className="text-sm text-yellow-600">Using basic extraction</span>
                          </>
                        )}
                      </div>
                      
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveApiSettings}
                        disabled={savingApiSettings || !apiSettings.apiKey.trim()}
                        icon={savingApiSettings ? "Loader2" : "Save"}
                      >
                        {savingApiSettings ? 'Saving...' : 'Save Settings'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
            
            <div className="mt-8">
              <FileUpload
                onFileSelect={handleFileUpload}
                className="max-w-lg mx-auto"
              />
              
              {uploading && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <ApperIcon name="Loader2" size={20} className="animate-spin text-blue-600" />
                    <span className="text-blue-800 font-medium">
                      {apiSettings.apiKey ? 'Processing with AI enhancement...' : 'Processing your resume...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header 
        title="Profile" 
subtitle={`Last updated ${new Date(profile.imported_at).toLocaleDateString()}`}
        actions={headerActions}
      />
<div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* API Configuration Section for existing profiles */}
          {showApiConfig && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <ApperIcon name="Zap" size={20} className="text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI Configuration</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Service
                  </label>
                  <select
                    value={apiSettings.apiService}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, apiService: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="openai">OpenAI (GPT-4)</option>
                    <option value="google">Google (Gemini)</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiSettings.apiKey}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  {apiSettings.apiKey ? (
                    <>
                      <ApperIcon name="CheckCircle" size={16} className="text-green-600" />
                      <span className="text-sm text-green-600">AI enhancement active</span>
                    </>
                  ) : (
                    <>
                      <ApperIcon name="AlertCircle" size={16} className="text-yellow-600" />
                      <span className="text-sm text-yellow-600">Using basic extraction</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiConfig(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveApiSettings}
                    disabled={savingApiSettings || !apiSettings.apiKey.trim()}
                    icon={savingApiSettings ? "Loader2" : "Save"}
                  >
                    {savingApiSettings ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <ApperIcon name="User" size={40} className="text-white" />
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.name}
                </h2>
                <p className="text-gray-600 mb-2">{profile.email}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="accent" size="sm">
                    <ApperIcon name="CheckCircle" size={12} className="mr-1" />
                    Profile Complete
                  </Badge>
                  <Badge variant="primary" size="sm">
                    {profile.skills?.length || 0} Skills
                  </Badge>
                  {profile.api_key && (
                    <Badge variant="secondary" size="sm">
                      <ApperIcon name="Zap" size={12} className="mr-1" />
                      AI Enhanced
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <Button
                  variant="secondary"
                  icon="Upload"
                  size="sm"
                  onClick={() => document.getElementById('profile-upload')?.click()}
                >
                  Update Resume
                </Button>
                <input
                  id="profile-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Experience */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <ApperIcon name="Briefcase" size={20} className="text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
              </div>
{profile.experience?.length > 0 ? (
                <div className="space-y-4">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="border-l-2 border-primary-200 pl-4">
                      <h4 className="font-semibold text-gray-900">
                        {exp.title || 'Position title not extracted'}
                      </h4>
                      <p className="text-primary-600 font-medium">
                        {exp.company || 'Company not extracted'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {exp.duration || 'Duration not specified'}
                      </p>
                      {exp.description && exp.description.trim() && (
                        <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ApperIcon name="AlertCircle" size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 font-medium">No experience data extracted from PDF</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Ensure your resume has a clearly labeled "Experience" section
                  </p>
                </div>
              )}
            </motion.div>

            {/* Education */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <ApperIcon name="GraduationCap" size={20} className="text-secondary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Education</h3>
              </div>
              
{profile.education?.length > 0 ? (
                <div className="space-y-4">
                  {profile.education.map((edu, index) => (
                    <div key={index} className="border-l-2 border-secondary-200 pl-4">
                      <h4 className="font-semibold text-gray-900">
                        {edu.degree || 'Degree information not extracted'}
                      </h4>
                      <p className="text-secondary-600 font-medium">
                        {edu.institution || 'Institution not extracted'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {edu.year || 'Year not specified'}
                      </p>
                      {edu.gpa && (
                        <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                      )}
                      {edu.honors && (
                        <p className="text-sm text-gray-600">Honors: {edu.honors}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ApperIcon name="AlertCircle" size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 font-medium">No education data extracted from PDF</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Ensure your resume has a clearly labeled "Education" section
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <ApperIcon name="Zap" size={20} className="text-accent-600" />
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
            </div>
            
{profile.skills?.length > 0 ? (
              <div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="accent"
                      size="md"
                      className="cursor-pointer hover:bg-accent-200 transition-colors"
                      title={`Extracted from PDF: ${skill}`}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {profile.skills.length} skills extracted from your resume
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <ApperIcon name="AlertCircle" size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">No skills extracted from PDF</p>
                <p className="text-sm text-gray-400 mt-1">
                  Ensure your resume has a clearly labeled "Skills" section
                </p>
              </div>
            )}
</motion.div>

          {/* Data Management Section */}
          {showDataManagement && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <ApperIcon name="Database" size={20} className="text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Job Matches</h4>
                  <p className="text-sm text-gray-600 mb-3">Delete all your job match records</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="Trash2"
                    onClick={() => handleDeleteData('job matches')}
                    disabled={deletingData === 'job matches'}
                  >
                    {deletingData === 'job matches' ? 'Deleting...' : 'Delete All Matches'}
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Job Preferences</h4>
                  <p className="text-sm text-gray-600 mb-3">Delete all your job preference settings</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="Trash2"
                    onClick={() => handleDeleteData('preferences')}
                    disabled={deletingData === 'preferences'}
                  >
                    {deletingData === 'preferences' ? 'Deleting...' : 'Delete All Preferences'}
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Import Logs</h4>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="Trash2"
                    onClick={() => handleDeleteData('import logs')}
                    disabled={deletingData === 'import logs'}
                  >
                    {deletingData === 'import logs' ? 'Deleting...' : 'Delete All Logs'}
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Uploaded Files</h4>
                  <p className="text-sm text-gray-600 mb-3">Delete all uploaded resume files</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="Trash2"
                    onClick={() => handleDeleteData('uploaded files')}
                    disabled={deletingData === 'uploaded files'}
                  >
                    {deletingData === 'uploaded files' ? 'Deleting...' : 'Delete All Files'}
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ApperIcon name="AlertTriangle" size={20} className="text-red-600" />
                    <h4 className="font-medium text-red-900">Danger Zone</h4>
                  </div>
                  <p className="text-sm text-red-700 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    icon="UserX"
                    onClick={handleDeleteAccount}
                    disabled={deletingData === 'account'}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  >
                    {deletingData === 'account' ? 'Deleting Account...' : 'Delete Account & All Data'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile Edit Modal */}
          {editingProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="X"
                      onClick={() => setEditingProfile(false)}
                    />
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={editProfileData.name || ''}
                      onChange={(e) => setEditProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editProfileData.email || ''}
                      onChange={(e) => setEditProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills (one per line)</label>
                    <textarea
                      value={editProfileData.skills?.join('\n') || ''}
                      onChange={(e) => setEditProfileData(prev => ({ 
                        ...prev, 
                        skills: e.target.value.split('\n').filter(skill => skill.trim()) 
                      }))}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="JavaScript\nReact\nNode.js\n..."
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setEditingProfile(false)}
                    disabled={savingProfile}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    icon={savingProfile ? "Loader2" : "Save"}
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;