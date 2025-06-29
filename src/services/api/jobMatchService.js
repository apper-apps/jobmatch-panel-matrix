import { toast } from 'react-toastify';

export const jobMatchService = {
  async getAll() {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title" } },
          { field: { Name: "company" } },
          { field: { Name: "location" } },
          { field: { Name: "salary" } },
          { field: { Name: "profile_match" } },
          { field: { Name: "preference_match" } },
          { field: { Name: "work_arrangement" } },
          { field: { Name: "job_type" } },
          { field: { Name: "description" } },
          { field: { Name: "company_description" } },
          { field: { Name: "url" } },
          { field: { Name: "logo" } },
          { field: { Name: "posted_date" } },
          { field: { Name: "benefits" } }
        ],
        orderBy: [
          { fieldName: "posted_date", sorttype: "DESC" }
        ],
        pagingInfo: { limit: 50, offset: 0 }
      };

      const response = await apperClient.fetchRecords('job_match', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching job matches:", error);
      toast.error("Failed to load job matches");
      throw error;
    }
  },

  async getById(id) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title" } },
          { field: { Name: "company" } },
          { field: { Name: "location" } },
          { field: { Name: "salary" } },
          { field: { Name: "profile_match" } },
          { field: { Name: "preference_match" } },
          { field: { Name: "work_arrangement" } },
          { field: { Name: "job_type" } },
          { field: { Name: "description" } },
          { field: { Name: "company_description" } },
          { field: { Name: "url" } },
          { field: { Name: "logo" } },
          { field: { Name: "posted_date" } },
          { field: { Name: "benefits" } }
        ]
      };

      const response = await apperClient.getRecordById('job_match', parseInt(id), params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching job match:", error);
      toast.error("Failed to load job match");
      throw error;
    }
  },

  async create(jobData) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        records: [{
          Name: jobData.Name,
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          salary: jobData.salary,
          profile_match: jobData.profile_match,
          preference_match: jobData.preference_match,
          work_arrangement: jobData.work_arrangement,
          job_type: jobData.job_type,
          description: jobData.description,
          company_description: jobData.company_description,
          url: jobData.url,
          logo: jobData.logo,
          posted_date: jobData.posted_date,
          benefits: jobData.benefits
        }]
      };

      const response = await apperClient.createRecord('job_match', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
        }
        
        if (successfulRecords.length > 0) {
          toast.success("Job match created successfully");
          return successfulRecords[0].data;
        }
      }

      return null;
    } catch (error) {
      console.error("Error creating job match:", error);
      toast.error("Failed to create job match");
      throw error;
    }
  },

  async update(id, jobData) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        records: [{
          Id: parseInt(id),
          ...(jobData.Name && { Name: jobData.Name }),
          ...(jobData.title && { title: jobData.title }),
          ...(jobData.company && { company: jobData.company }),
          ...(jobData.location && { location: jobData.location }),
          ...(jobData.salary && { salary: jobData.salary }),
          ...(jobData.profile_match !== undefined && { profile_match: jobData.profile_match }),
          ...(jobData.preference_match !== undefined && { preference_match: jobData.preference_match }),
          ...(jobData.work_arrangement && { work_arrangement: jobData.work_arrangement }),
          ...(jobData.job_type && { job_type: jobData.job_type }),
          ...(jobData.description && { description: jobData.description }),
          ...(jobData.company_description && { company_description: jobData.company_description }),
          ...(jobData.url && { url: jobData.url }),
          ...(jobData.logo && { logo: jobData.logo }),
          ...(jobData.posted_date && { posted_date: jobData.posted_date }),
          ...(jobData.benefits && { benefits: jobData.benefits })
        }]
      };

      const response = await apperClient.updateRecord('job_match', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const successfulUpdates = response.results.filter(result => result.success);
        const failedUpdates = response.results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
          console.error(`Failed to update ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
          
          failedUpdates.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
        }
        
        if (successfulUpdates.length > 0) {
          toast.success("Job match updated successfully");
          return successfulUpdates[0].data;
        }
      }

      return null;
    } catch (error) {
      console.error("Error updating job match:", error);
      toast.error("Failed to update job match");
      throw error;
    }
  },

  async delete(id) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        RecordIds: [parseInt(id)]
      };

      const response = await apperClient.deleteRecord('job_match', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const successfulDeletions = response.results.filter(result => result.success);
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
          
          failedDeletions.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }
        
        if (successfulDeletions.length > 0) {
          toast.success("Job match deleted successfully");
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error deleting job match:", error);
      toast.error("Failed to delete job match");
      throw error;
    }
  }
};