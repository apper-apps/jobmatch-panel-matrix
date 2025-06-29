import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Header from '@/components/organisms/Header';
import FileUpload from '@/components/molecules/FileUpload';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import Empty from '@/components/ui/Empty';
import ApperIcon from '@/components/ApperIcon';
import { userProfileService } from '@/services/api/userProfileService';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userProfileService.getProfile();
      setProfile(data);
    } catch (err) {
      setError('Failed to load profile. Please try again.');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      const result = await userProfileService.importResume(file);
      setProfile(result);
      toast.success('Resume imported successfully!');
    } catch (err) {
      toast.error('Failed to import resume. Please try again.');
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        icon="Download"
      >
        Export Profile
      </Button>
      <Button
        variant="primary"
        icon="Edit"
      >
        Edit Profile
      </Button>
    </div>
  );

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
                      Processing your resume...
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
        subtitle={`Last updated ${new Date(profile.importedAt).toLocaleDateString()}`}
        actions={headerActions}
      />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
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
                      <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                      <p className="text-primary-600 font-medium">{exp.company}</p>
                      <p className="text-sm text-gray-500">{exp.duration}</p>
                      {exp.description && (
                        <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No experience data found</p>
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
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <p className="text-secondary-600 font-medium">{edu.institution}</p>
                      <p className="text-sm text-gray-500">{edu.year}</p>
                      {edu.gpa && (
                        <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No education data found</p>
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
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="accent"
                    size="md"
                    className="cursor-pointer hover:bg-accent-200 transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills data found</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;