import { toast } from 'react-toastify';

export const importLogService = {
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
          { field: { Name: "timestamp" } },
          { field: { Name: "status" } },
          { field: { Name: "extracted_fields" } },
          { field: { Name: "errors" } }
        ],
        orderBy: [
          { fieldName: "timestamp", sorttype: "DESC" }
        ],
        pagingInfo: { limit: 50, offset: 0 }
      };

      const response = await apperClient.fetchRecords('import_log', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return (response.data || []).map(log => ({
        Id: log.Id,
        timestamp: log.timestamp,
        status: log.status,
        extractedFields: log.extracted_fields ? JSON.parse(log.extracted_fields) : {},
        errors: log.errors ? log.errors.split('\n').filter(e => e.trim()) : []
      }));
    } catch (error) {
      console.error("Error fetching import logs:", error);
      toast.error("Failed to load import logs");
      return [];
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
          { field: { Name: "timestamp" } },
          { field: { Name: "status" } },
          { field: { Name: "extracted_fields" } },
          { field: { Name: "errors" } }
        ]
      };

      const response = await apperClient.getRecordById('import_log', parseInt(id), params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      const log = response.data;
      return {
        Id: log.Id,
        timestamp: log.timestamp,
        status: log.status,
        extractedFields: log.extracted_fields ? JSON.parse(log.extracted_fields) : {},
        errors: log.errors ? log.errors.split('\n').filter(e => e.trim()) : []
      };
    } catch (error) {
      console.error("Error fetching import log:", error);
      toast.error("Failed to load import log");
      return null;
    }
  },

  async create(logData) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        records: [{
          Name: `Import ${new Date().toISOString()}`,
          timestamp: new Date().toISOString(),
          status: logData.status,
          extracted_fields: JSON.stringify(logData.extractedFields || {}),
          errors: (logData.errors || []).join('\n')
        }]
      };

      const response = await apperClient.createRecord('import_log', params);
      
      if (!response.success) {
        console.error(response.message);
        return null;
      }

      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create import log:${JSON.stringify(failedRecords)}`);
        }
        
        if (successfulRecords.length > 0) {
          const data = successfulRecords[0].data;
          return {
            Id: data.Id,
            timestamp: data.timestamp,
            status: data.status,
            extractedFields: data.extracted_fields ? JSON.parse(data.extracted_fields) : {},
            errors: data.errors ? data.errors.split('\n').filter(e => e.trim()) : []
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error creating import log:", error);
      return null;
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

      const response = await apperClient.deleteRecord('import_log', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete import log:${JSON.stringify(failedDeletions)}`);
          return false;
        }
      }

      toast.success("Import log deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting import log:", error);
      toast.error("Failed to delete import log");
      return false;
    }
  },

  async clearAll() {
    try {
      const logs = await this.getAll();
      const deletePromises = logs.map(log => this.delete(log.Id));
      await Promise.all(deletePromises);
      return { success: true };
    } catch (error) {
      console.error("Error clearing all import logs:", error);
      toast.error("Failed to clear import logs");
      return { success: false };
    }
  }
};