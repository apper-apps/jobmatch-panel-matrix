import { toast } from "react-toastify";
import { userProfileService } from "@/services/api/userProfileService";
import { jobPreferencesService } from "@/services/api/jobPreferencesService";
export const jobMatchService = {
  async getAll() {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

const params = {
        "fields": [
          { "field": { "Name": "Name" } },
          { "field": { "Name": "title" } },
          { "field": { "Name": "company" } },
          { "field": { "Name": "location" } },
          { "field": { "Name": "salary" } },
          { "field": { "Name": "profile_match" } },
          { "field": { "Name": "preference_match" } },
          { "field": { "Name": "work_arrangement" } },
          { "field": { "Name": "job_type" } },
          { "field": { "Name": "description" } },
          { "field": { "Name": "company_description" } },
          { "field": { "Name": "url" } },
          { "field": { "Name": "logo" } },
          { "field": { "Name": "posted_date" } },
          { "field": { "Name": "benefits" } }
        ],
        "orderBy": [
          { "fieldName": "posted_date", "sorttype": "DESC" }
        ],
        "pagingInfo": { "limit": 50, "offset": 0 }
      };

const response = await apperClient.fetchRecords('job_match', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      // Transform data to include both snake_case and camelCase properties for compatibility
      const transformedData = (response.data || []).map(job => ({
        ...job,
        profileMatch: job.profile_match || 0,
        preferenceMatch: job.preference_match || 0
      }));

      return transformedData;
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
        "fields": [
          { "field": { "Name": "Name" } },
          { "field": { "Name": "title" } },
          { "field": { "Name": "company" } },
          { "field": { "Name": "location" } },
          { "field": { "Name": "salary" } },
          { "field": { "Name": "profile_match" } },
          { "field": { "Name": "preference_match" } },
          { "field": { "Name": "work_arrangement" } },
          { "field": { "Name": "job_type" } },
          { "field": { "Name": "description" } },
          { "field": { "Name": "company_description" } },
          { "field": { "Name": "url" } },
          { "field": { "Name": "logo" } },
          { "field": { "Name": "posted_date" } },
          { "field": { "Name": "benefits" } }
        ]
      };

const response = await apperClient.getRecordById('job_match', parseInt(id), params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      // Transform data to include both snake_case and camelCase properties for compatibility
      const job = response.data;
      if (job) {
        return {
          ...job,
          profileMatch: job.profile_match || 0,
          preferenceMatch: job.preference_match || 0
        };
      }

      return job;
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
  },

  // AI-powered job search and discovery methods
  async aiJobSearch(searchQuery) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      // Get user profile and preferences for AI context
      const profile = await userProfileService.getProfile();
      const preferences = await jobPreferencesService.getPreferences();

      if (!profile?.api_key) {
        throw new Error('AI API key not configured. Please set up your AI configuration in the Profile section.');
      }

      // Prepare AI prompt for job search
      const aiPrompt = this.buildJobSearchPrompt(searchQuery, profile, preferences);
      
      // Extract jobs using AI
      const aiJobs = await this.extractJobsWithAI(aiPrompt, profile.api_key, profile.api_service || 'google');
      
      // Score and rank jobs
      const scoredJobs = this.scoreJobs(aiJobs, profile, preferences);
      
      // Store discovered jobs in database
      await this.storeAIJobs(scoredJobs);
      
      toast.success(`AI found ${scoredJobs.length} relevant job opportunities!`);
      return scoredJobs;

    } catch (error) {
      console.error("Error in AI job search:", error);
      toast.error(`AI job search failed: ${error.message}`);
      throw error;
    }
  },

  async aiJobDiscovery() {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      // Get user profile and preferences
      const profile = await userProfileService.getProfile();
      const preferences = await jobPreferencesService.getPreferences();

      if (!profile?.api_key) {
        throw new Error('AI API key not configured. Please set up your AI configuration in the Profile section.');
      }

      // Build automatic discovery query based on profile
      const discoveryQuery = this.buildDiscoveryQuery(profile, preferences);
      
      // Use AI to find jobs automatically
      const aiPrompt = this.buildJobDiscoveryPrompt(profile, preferences);
      const discoveredJobs = await this.extractJobsWithAI(aiPrompt, profile.api_key, profile.api_service || 'google');
      
      // Score and rank discovered jobs
      const scoredJobs = this.scoreJobs(discoveredJobs, profile, preferences);
      
      // Store discovered jobs
      await this.storeAIJobs(scoredJobs);
      
      toast.success(`AI discovered ${scoredJobs.length} new job opportunities tailored for you!`);
      return scoredJobs;

    } catch (error) {
      console.error("Error in AI job discovery:", error);
      toast.error(`AI job discovery failed: ${error.message}`);
      throw error;
    }
  },

buildJobSearchPrompt(searchQuery, profile, preferences) {
    // Extract user's likely location and role from profile for better targeting
    const userLocation = preferences.locations && preferences.locations.length > 0 
      ? preferences.locations[0] 
      : 'location not specified';
    
    const userRole = profile.experience && profile.experience.length > 0 
      ? profile.experience[0].title 
      : 'role not specified';

    return `
You are an expert job search AI that finds relevant job opportunities based on user queries and profiles. 

CRITICAL FILTERING REQUIREMENTS:
- STRICTLY match the user's geographic location preferences
- ONLY suggest jobs that align with the user's professional role and experience level
- DO NOT suggest jobs in different countries unless explicitly requested
- DO NOT suggest jobs in completely different career fields

USER SEARCH QUERY: "${searchQuery}"

USER PROFILE:
- Name: ${profile.name || 'Not specified'}
- Current Role: ${userRole}
- Primary Location: ${userLocation}
- Skills: ${(profile.skills || []).join(', ') || 'Not specified'}
- Experience: ${profile.experience?.map(exp => `${exp.title} at ${exp.company}`).join(', ') || 'Not specified'}

USER PREFERENCES:
- Salary: ${preferences.minSalary ? `${preferences.currency} ${preferences.minSalary}` : 'Not specified'}
- Preferred Locations: ${(preferences.locations || []).join(', ') || 'User location only'}
- Job Types: ${(preferences.jobTypes || []).join(', ') || 'Any type'}
- Work Arrangements: ${(preferences.workArrangements || []).join(', ') || 'Any arrangement'}
- Positive Keywords: ${(preferences.positiveKeywords || []).join(', ') || 'None specified'}
- Negative Keywords: ${(preferences.negativeKeywords || []).join(', ') || 'None specified'}

MANDATORY REQUIREMENTS:
1. Jobs MUST be in the user's preferred locations (${(preferences.locations || []).join(', ') || userLocation})
2. Jobs MUST align with the user's career field and experience level
3. Job titles should be relevant to "${userRole}" or similar roles
4. If user is in Europe, DO NOT suggest US-based positions unless "Remote" and explicitly global
5. Match the user's professional level (junior, mid-level, senior, executive)

Please generate 5-10 realistic job opportunities that STRICTLY match the user's location, role, and preferences. Return the results as a JSON array with this exact structure:

[
  {
    "title": "Job title relevant to ${userRole}",
    "company": "Company name",
    "location": "Must be in ${userLocation} or user's preferred locations",
    "salary": "Salary range in appropriate currency",
    "work_arrangement": "Remote/Hybrid/On-site",
    "job_type": "Full-time/Part-time/Contract",
    "description": "Detailed job description highlighting key responsibilities and requirements relevant to ${userRole}",
    "company_description": "Brief company description and what they do",
    "url": "https://example.com/job-url",
    "logo": "https://example.com/company-logo.png",
    "posted_date": "2024-01-15T10:00:00Z",
    "benefits": "Key benefits and perks",
    "profile_match": 85,
    "preference_match": 92
  }
]

VALIDATION: Before generating each job, verify:
- Location matches user preferences: ✓
- Role aligns with user experience: ✓
- Career level is appropriate: ✓
- No geographic mismatches: ✓
`;
  },

buildJobDiscoveryPrompt(profile, preferences) {
    // Determine user's primary location and role for strict targeting
    const primaryLocation = preferences.locations && preferences.locations.length > 0 
      ? preferences.locations[0] 
      : 'location preferences not set';
    
    const currentRole = profile.experience && profile.experience.length > 0 
      ? profile.experience[0].title 
      : 'role not clearly defined';

    const experienceLevel = profile.experience && profile.experience.length > 0 
      ? (profile.experience.length >= 3 ? 'Senior' : 'Mid-level') 
      : 'Entry-level';

    return `
You are an intelligent job discovery AI that automatically finds the best job opportunities for users based on their profiles and preferences.

CRITICAL DISCOVERY CONSTRAINTS:
- ABSOLUTE LOCATION MATCH: Only suggest jobs in user's specified locations
- ROLE ALIGNMENT: Jobs must match user's career trajectory and experience
- NO GEOGRAPHIC MISMATCHES: European users get European jobs, US users get US jobs
- CAREER PROGRESSION: Suggest roles appropriate for user's experience level

USER PROFILE ANALYSIS:
- Name: ${profile.name || 'Professional'}
- Current Role: ${currentRole}
- Experience Level: ${experienceLevel}
- Primary Location: ${primaryLocation}
- Skills: ${(profile.skills || []).join(', ') || 'General skills'}
- Experience: ${profile.experience?.map(exp => `${exp.title} at ${exp.company} (${exp.duration || 'duration not specified'})`).join('; ') || 'Various experience'}
- Education: ${profile.education?.map(edu => `${edu.degree} from ${edu.institution}`).join('; ') || 'Educational background'}

USER PREFERENCES:
- Salary Expectation: ${preferences.minSalary ? `${preferences.currency} ${preferences.minSalary}+ (${preferences.salaryType})` : 'Competitive salary'}
- REQUIRED Locations: ${(preferences.locations || []).join(', ') || 'Must respect user location'}
- Job Types: ${(preferences.jobTypes || []).join(', ') || 'Open to various types'}
- Work Arrangements: ${(preferences.workArrangements || []).join(', ') || 'Flexible arrangements'}
- Seeking: ${(preferences.positiveKeywords || []).join(', ') || 'Growth opportunities'}
- Avoiding: ${(preferences.negativeKeywords || []).join(', ') || 'None specified'}

DISCOVERY RULES:
1. LOCATION CONSTRAINT: Every job MUST be in "${primaryLocation}" or user's other preferred locations
2. ROLE RELEVANCE: Jobs must be relevant to "${currentRole}" or natural career progression
3. EXPERIENCE MATCH: Suggest ${experienceLevel} positions appropriate for user's background
4. NO CAREER FIELD SWITCHING: Don't suggest developer jobs for product managers, etc.
5. GEOGRAPHIC CONSISTENCY: Respect regional job markets and salary expectations

Based on this profile, discover 8-12 high-quality job opportunities that would be perfect matches. Focus on:
1. Jobs that utilize the user's skills and experience in ${currentRole}
2. Opportunities in ${primaryLocation} or user's preferred locations ONLY
3. ${experienceLevel} roles that match career progression
4. Roles that include positive keywords and avoid negative ones
5. Companies and positions that offer career growth in user's field

Return results as a JSON array with this structure:

[
  {
    "title": "${experienceLevel} ${currentRole} or related role",
    "company": "Reputable company name",
    "location": "MUST be in ${primaryLocation} or user's preferred locations",
    "salary": "Competitive salary range in ${preferences.currency || 'local currency'}",
    "work_arrangement": "Preferred work arrangement",
    "job_type": "Preferred job type",
    "description": "Compelling job description that matches user's ${currentRole} background and interests",
    "company_description": "Attractive company description highlighting culture and growth",
    "url": "https://realistic-job-url.com",
    "logo": "https://company-logo-url.com",
    "posted_date": "Recent date in ISO format",
    "benefits": "Attractive benefits package",
    "profile_match": 90,
    "preference_match": 88
  }
]

FINAL VALIDATION CHECKLIST:
✓ All jobs in user's geographic region (${primaryLocation})
✓ All roles relevant to ${currentRole} career path
✓ Experience level matches ${experienceLevel}
✓ No cross-continental job suggestions
✓ Career field consistency maintained

Make each job highly relevant and appealing to this specific user profile. Ensure high match scores (80-95) since these are targeted discoveries.
`;
  },

  buildDiscoveryQuery(profile, preferences) {
    const skills = (profile.skills || []).slice(0, 3).join(' ');
    const locations = (preferences.locations || []).slice(0, 2).join(' OR ');
    const jobTypes = (preferences.jobTypes || []).join(' ');
    
    return `${skills} ${jobTypes} ${locations}`.trim();
  },

  async extractJobsWithAI(prompt, apiKey, service = 'google') {
    try {
      let extractedJobs = null;

      switch (service) {
        case 'openai':
          extractedJobs = await this.extractWithOpenAI(prompt, apiKey);
          break;
        case 'google':
          extractedJobs = await this.extractWithGoogle(prompt, apiKey);
          break;
        case 'openrouter':
          extractedJobs = await this.extractWithOpenRouter(prompt, apiKey);
          break;
        default:
          throw new Error(`Unsupported AI service: ${service}`);
      }

      return Array.isArray(extractedJobs) ? extractedJobs : [];
    } catch (error) {
      console.error('AI job extraction failed:', error);
      throw error;
    }
  },

  async extractWithOpenAI(prompt, apiKey) {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: "system",
          content: "You are a job search AI that finds and returns job opportunities as valid JSON arrays."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    });

    const responseContent = completion.choices[0].message.content.trim();
    return JSON.parse(responseContent);
  },

  async extractWithGoogle(prompt, apiKey) {
    const { default: axios } = await import('axios');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4000,
          topP: 0.8,
          topK: 40
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Google AI');
    }

    const responseContent = response.data.candidates[0].content.parts[0].text.trim();
    
    // Clean and parse JSON
    let cleanContent = responseContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonStart = cleanContent.indexOf('[');
    const jsonEnd = cleanContent.lastIndexOf(']') + 1;
    
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      throw new Error('No valid JSON array found in AI response');
    }
    
    cleanContent = cleanContent.substring(jsonStart, jsonEnd);
    return JSON.parse(cleanContent);
  },

  async extractWithOpenRouter(prompt, apiKey) {
    const { default: axios } = await import('axios');
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: "system",
            content: "You are a job search AI that finds and returns job opportunities as valid JSON arrays."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'JobMatch Pro Job Search'
        }
      }
    );

    const responseContent = response.data.choices[0].message.content.trim();
    return JSON.parse(responseContent);
  },

  scoreJobs(jobs, profile, preferences) {
    return jobs.map(job => {
      let profileScore = this.calculateProfileMatch(job, profile);
      let preferenceScore = this.calculatePreferenceMatch(job, preferences);
      
      return {
        ...job,
        Name: `${job.title} at ${job.company}`,
        profile_match: Math.min(100, profileScore),
        preference_match: Math.min(100, preferenceScore)
      };
    });
  },

  calculateProfileMatch(job, profile) {
    let score = 0;
    const userSkills = (profile.skills || []).map(s => s.toLowerCase());
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    
    // Skills matching
    const skillMatches = userSkills.filter(skill => jobText.includes(skill));
    score += (skillMatches.length / Math.max(userSkills.length, 1)) * 60;
    
    // Experience level matching
    if (profile.experience && profile.experience.length > 0) {
      const userTitles = profile.experience.map(exp => exp.title?.toLowerCase() || '');
      const titleMatch = userTitles.some(title => 
        title && jobText.includes(title.split(' ')[0])
      );
      if (titleMatch) score += 20;
    }
    
    // Education matching
    if (profile.education && profile.education.length > 0) {
      const hasEducation = profile.education.some(edu => edu.degree);
      if (hasEducation) score += 10;
    }
    
    // Base score for AI-generated matches
    score += 10;
    
    return Math.min(100, score);
  },

  calculatePreferenceMatch(job, preferences) {
    let score = 0;
    
    // Salary matching
    if (preferences.minSalary && job.salary && job.salary !== 'Competitive') {
      const salaryNumbers = job.salary.match(/\d+/g);
      if (salaryNumbers && parseInt(salaryNumbers[0]) >= preferences.minSalary) {
        score += 25;
      }
    } else {
      score += 15; // Partial score if salary not specified
    }
    
    // Location matching
    if (preferences.locations && preferences.locations.length > 0) {
      const locationMatch = preferences.locations.some(prefLoc => 
        job.location.toLowerCase().includes(prefLoc.toLowerCase()) ||
        prefLoc.toLowerCase().includes('remote') && job.work_arrangement === 'Remote'
      );
      if (locationMatch) score += 20;
    } else {
      score += 15;
    }
    
    // Job type matching
    if (preferences.jobTypes && preferences.jobTypes.includes(job.job_type)) {
      score += 15;
    }
    
    // Work arrangement matching
    if (preferences.workArrangements && preferences.workArrangements.includes(job.work_arrangement)) {
      score += 15;
    }
    
    // Positive keywords
    if (preferences.positiveKeywords && preferences.positiveKeywords.length > 0) {
      const jobText = `${job.title} ${job.description} ${job.company_description}`.toLowerCase();
      const positiveMatches = preferences.positiveKeywords.filter(keyword =>
        jobText.includes(keyword.toLowerCase())
      );
      score += (positiveMatches.length / preferences.positiveKeywords.length) * 15;
    }
    
    // Negative keywords (subtract score)
    if (preferences.negativeKeywords && preferences.negativeKeywords.length > 0) {
      const jobText = `${job.title} ${job.description} ${job.company_description}`.toLowerCase();
      const negativeMatches = preferences.negativeKeywords.filter(keyword =>
        jobText.includes(keyword.toLowerCase())
      );
      score -= negativeMatches.length * 10;
    }
    
    // Base score for preferences
    score += 10;
    
    return Math.max(0, Math.min(100, score));
  },

  async storeAIJobs(jobs) {
    if (!jobs || jobs.length === 0) return;

    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const records = jobs.map(job => ({
        Name: job.Name,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        profile_match: job.profile_match,
        preference_match: job.preference_match,
        work_arrangement: job.work_arrangement,
        job_type: job.job_type,
        description: job.description,
        company_description: job.company_description,
        url: job.url,
        logo: job.logo,
        posted_date: job.posted_date,
        benefits: job.benefits
      }));

      const params = { records };
      const response = await apperClient.createRecord('job_match', params);
      
      if (!response.success) {
        console.warn('Failed to store some AI jobs:', response.message);
      }
    } catch (error) {
console.warn('Error storing AI jobs:', error);
      // Don't throw - this is not critical for the user experience
    }
  }
};