import mockUserProfile from '@/services/mockData/userProfile.json';
import { importLogService } from './importLogService';

const delay = () => new Promise(resolve => setTimeout(resolve, 500));

let currentProfile = null;

export const userProfileService = {
  async getProfile() {
    await delay();
    return currentProfile ? { ...currentProfile } : null;
  },

  async importResume(file) {
    await delay();
    
    // Simulate PDF parsing
    const extractedData = {
      name: "John Smith",
      email: "john.smith@email.com",
      experience: [
        {
          title: "Senior Software Engineer",
          company: "TechCorp Inc.",
          duration: "2021 - Present",
          description: "Led development of microservices architecture, mentored junior developers, and improved system performance by 40%."
        },
        {
          title: "Software Developer",
          company: "StartupXYZ",
          duration: "2019 - 2021",
          description: "Developed full-stack web applications using React and Node.js, implemented CI/CD pipelines."
        },
        {
          title: "Junior Developer",
          company: "WebAgency",
          duration: "2017 - 2019",
          description: "Built responsive websites and web applications, collaborated with design team on UI/UX improvements."
        }
      ],
      education: [
        {
          degree: "Bachelor of Science in Computer Science",
          institution: "University of Technology",
          year: "2017",
          gpa: "3.8"
        }
      ],
      skills: [
        "JavaScript", "React", "Node.js", "Python", "TypeScript", 
        "AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB",
        "Git", "Agile", "Team Leadership", "System Design"
      ],
      importedAt: new Date().toISOString()
    };

    currentProfile = extractedData;

    // Log the import
    await importLogService.create({
      status: 'success',
      extractedFields: {
        experience: extractedData.experience,
        education: extractedData.education,
        skills: extractedData.skills,
        personalInfo: { name: extractedData.name, email: extractedData.email }
      },
      errors: []
    });

    return { ...extractedData };
  },

  async updateProfile(profileData) {
    await delay();
    if (!currentProfile) {
      throw new Error('No profile found');
    }
    currentProfile = { ...currentProfile, ...profileData };
    return { ...currentProfile };
  },

  async deleteProfile() {
    await delay();
    currentProfile = null;
    return { success: true };
  }
};