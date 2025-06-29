const delay = () => new Promise(resolve => setTimeout(resolve, 300));

let importLogs = [
  {
    Id: 1,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'success',
    extractedFields: {
      experience: [
        { title: "Senior Software Engineer", company: "TechCorp Inc." }
      ],
      education: [
        { degree: "Bachelor of Computer Science", institution: "University of Technology" }
      ],
      skills: ["JavaScript", "React", "Node.js", "Python"],
      personalInfo: { name: "John Smith", email: "john.smith@email.com" }
    },
    errors: []
  },
  {
    Id: 2,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    status: 'warning',
    extractedFields: {
      experience: [
        { title: "Software Developer", company: "StartupXYZ" }
      ],
      skills: ["JavaScript", "React"],
      personalInfo: { name: "John Smith" }
    },
    errors: [
      "Email address not clearly identified in resume",
      "Education section partially parsed - some details may be missing"
    ]
  }
];

export const importLogService = {
  async getAll() {
    await delay();
    return [...importLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async getById(id) {
    await delay();
    const log = importLogs.find(l => l.Id === parseInt(id));
    if (!log) {
      throw new Error('Import log not found');
    }
    return { ...log };
  },

  async create(logData) {
    await delay();
    const newId = Math.max(...importLogs.map(l => l.Id), 0) + 1;
    const newLog = {
      ...logData,
      Id: newId,
      timestamp: new Date().toISOString()
    };
    importLogs.push(newLog);
    return { ...newLog };
  },

  async delete(id) {
    await delay();
    const index = importLogs.findIndex(l => l.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Import log not found');
    }
    const deletedLog = importLogs.splice(index, 1)[0];
    return { ...deletedLog };
  },

  async clearAll() {
    await delay();
    importLogs = [];
    return { success: true };
  }
};