import { toast } from 'react-toastify';

export const jobPreferencesService = {
  async getPreferences() {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "min_salary" } },
          { field: { Name: "locations" } },
          { field: { Name: "job_types" } },
          { field: { Name: "work_arrangements" } },
          { field: { Name: "positive_keywords" } },
          { field: { Name: "negative_keywords" } }
        ],
        pagingInfo: { limit: 1, offset: 0 }
      };

      const response = await apperClient.fetchRecords('job_preference', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return {
          minSalary: '',
          locations: [],
          jobTypes: [],
          workArrangements: [],
          positiveKeywords: [],
          negativeKeywords: []
        };
      }

      const data = response.data?.[0];
      if (!data) {
        return {
          minSalary: '',
          locations: [],
          jobTypes: [],
          workArrangements: [],
          positiveKeywords: [],
          negativeKeywords: []
        };
      }

      return {
        minSalary: data.min_salary || '',
        locations: data.locations ? data.locations.split('\n').filter(l => l.trim()) : [],
        jobTypes: data.job_types ? data.job_types.split(',').filter(t => t.trim()) : [],
        workArrangements: data.work_arrangements ? data.work_arrangements.split(',').filter(a => a.trim()) : [],
        positiveKeywords: data.positive_keywords ? data.positive_keywords.split('\n').filter(k => k.trim()) : [],
        negativeKeywords: data.negative_keywords ? data.negative_keywords.split('\n').filter(k => k.trim()) : []
      };
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast.error("Failed to load preferences");
      throw error;
    }
  },

  async updatePreferences(preferences) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      // First try to get existing record
      const existingResponse = await apperClient.fetchRecords('job_preference', {
        fields: [{ field: { Name: "Id" } }],
        pagingInfo: { limit: 1, offset: 0 }
      });

      const recordData = {
        Name: 'User Preferences',
        min_salary: preferences.minSalary || 0,
        locations: preferences.locations?.join('\n') || '',
        job_types: preferences.jobTypes?.join(',') || '',
        work_arrangements: preferences.workArrangements?.join(',') || '',
        positive_keywords: preferences.positiveKeywords?.join('\n') || '',
        negative_keywords: preferences.negativeKeywords?.join('\n') || ''
      };

      let response;

      if (existingResponse.success && existingResponse.data?.length > 0) {
        // Update existing record
        const params = {
          records: [{
            Id: existingResponse.data[0].Id,
            ...recordData
          }]
        };
        response = await apperClient.updateRecord('job_preference', params);
      } else {
        // Create new record
        const params = {
          records: [recordData]
        };
        response = await apperClient.createRecord('job_preference', params);
      }
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return preferences;
      }

      if (response.results) {
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to save preferences:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
        }
      }

      toast.success("Preferences saved successfully");
      return preferences;
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to save preferences");
      throw error;
    }
  },

  async resetPreferences() {
    try {
      const defaultPreferences = {
        minSalary: '',
        locations: [],
        jobTypes: [],
        workArrangements: [],
        positiveKeywords: [],
        negativeKeywords: []
      };
      
      return await this.updatePreferences(defaultPreferences);
    } catch (error) {
      console.error("Error resetting preferences:", error);
      toast.error("Failed to reset preferences");
      throw error;
    }
  }
};