import React from 'react';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import ProgressRing from '@/components/atoms/ProgressRing';

const JobMatchCard = ({ job, className = '', onEdit, onDelete, selected, onSelect }) => {
  const {
    title,
    company,
    location,
    salary,
    profile_match,
    preference_match,
    profileMatch,
    preferenceMatch,
    work_arrangement: workArrangement,
    job_type: jobType,
    description,
    company_description: companyDescription,
    url,
    logo
  } = job;

  return (
    <motion.div
      className={`card p-6 hover:shadow-xl transition-all duration-300 ${className}`}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
<div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {onSelect && (
            <input
              type="checkbox"
              checked={selected || false}
              onChange={(e) => onSelect(job.Id, e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
            />
          )}
          
          {logo ? (
            <img 
              src={logo} 
              alt={`${company} logo`}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center ${logo ? 'hidden' : ''}`}
          >
            <ApperIcon name="Building2" size={24} className="text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h3>
            <p className="text-gray-600 font-medium">{company}</p>
            <div className="flex items-center gap-2 mt-1">
              <ApperIcon name="MapPin" size={14} className="text-gray-400" />
              <span className="text-sm text-gray-500">{location}</span>
            </div>
          </div>
        </div>
<div className="flex gap-3">
          <ProgressRing
            percentage={profileMatch || profile_match || 0}
            size={60}
            color="#2563eb"
            label="Profile"
          />
          <ProgressRing
            percentage={preferenceMatch || preference_match || 0}
            size={60}
            color="#10b981"
            label="Preference"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {jobType && <Badge variant="primary" size="sm">{jobType}</Badge>}
        {workArrangement && <Badge variant="accent" size="sm">{workArrangement}</Badge>}
        {salary && (
          <Badge variant="secondary" size="sm">
            <ApperIcon name="DollarSign" size={12} className="mr-1" />
            {salary}
          </Badge>
        )}
      </div>

      {companyDescription && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">About Company</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{companyDescription}</p>
        </div>
      )}

      {description && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Role Description</h4>
          <p className="text-sm text-gray-600 line-clamp-3">{description}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
<div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <ApperIcon name="Target" size={12} />
            <span>Profile: {profileMatch || profile_match || 0}%</span>
          </div>
          <div className="flex items-center gap-1">
            <ApperIcon name="Heart" size={12} />
            <span>Preference: {preferenceMatch || preference_match || 0}%</span>
          </div>
        </div>
        
<div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon="ExternalLink"
            onClick={() => window.open(url, '_blank')}
          >
            View Job
          </Button>
          {onEdit && (
            <Button
              variant="accent"
              size="sm"
              icon="Edit"
              onClick={() => onEdit(job.Id)}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              icon="Trash2"
              onClick={() => onDelete(job.Id, title)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default JobMatchCard;