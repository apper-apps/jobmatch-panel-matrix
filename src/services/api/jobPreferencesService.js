import mockJobPreferences from '@/services/mockData/jobPreferences.json';

const delay = () => new Promise(resolve => setTimeout(resolve, 400));

let currentPreferences = { ...mockJobPreferences };

export const jobPreferencesService = {
  async getPreferences() {
    await delay();
    return { ...currentPreferences };
  },

  async updatePreferences(preferences) {
    await delay();
    currentPreferences = { ...preferences };
    return { ...currentPreferences };
  },

  async resetPreferences() {
    await delay();
    currentPreferences = { ...mockJobPreferences };
    return { ...currentPreferences };
  }
};