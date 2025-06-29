import mockJobMatches from '@/services/mockData/jobMatches.json';

const delay = () => new Promise(resolve => setTimeout(resolve, 300));

export const jobMatchService = {
  async getAll() {
    await delay();
    return [...mockJobMatches];
  },

  async getById(id) {
    await delay();
    const job = mockJobMatches.find(j => j.Id === parseInt(id));
    if (!job) {
      throw new Error('Job match not found');
    }
    return { ...job };
  },

  async create(jobData) {
    await delay();
    const newId = Math.max(...mockJobMatches.map(j => j.Id), 0) + 1;
    const newJob = {
      ...jobData,
      Id: newId,
      createdAt: new Date().toISOString()
    };
    mockJobMatches.push(newJob);
    return { ...newJob };
  },

  async update(id, jobData) {
    await delay();
    const index = mockJobMatches.findIndex(j => j.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Job match not found');
    }
    mockJobMatches[index] = { ...mockJobMatches[index], ...jobData };
    return { ...mockJobMatches[index] };
  },

  async delete(id) {
    await delay();
    const index = mockJobMatches.findIndex(j => j.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Job match not found');
    }
    const deletedJob = mockJobMatches.splice(index, 1)[0];
    return { ...deletedJob };
  },

  async searchByFilters(filters) {
    await delay();
    return mockJobMatches.filter(job => {
      if (filters.minMatch && (job.profileMatch + job.preferenceMatch) / 2 < filters.minMatch) {
        return false;
      }
      if (filters.jobType && job.jobType !== filters.jobType) {
        return false;
      }
      if (filters.workArrangement && job.workArrangement !== filters.workArrangement) {
        return false;
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return job.title.toLowerCase().includes(searchTerm) ||
               job.company.toLowerCase().includes(searchTerm) ||
               job.description.toLowerCase().includes(searchTerm);
      }
      return true;
    });
  }
};