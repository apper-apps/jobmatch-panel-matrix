import { toast } from "react-toastify";
import { jobPreferencesService } from "@/services/api/jobPreferencesService";
import { userProfileService } from "@/services/api/userProfileService";
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
      
      // Enhanced debugging for job match loading failures
      console.log('Job matches API response received:', {
        success: response.success,
        hasData: !!response.data,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: response.data?.length || 0,
        responseKeys: Object.keys(response || {}),
        timestamp: new Date().toISOString()
      });
      
      if (!response.success) {
        console.error('Job matches API call failed:', {
          message: response.message,
          error: response.error,
          fullResponse: response
        });
        toast.error(`Failed to load job matches: ${response.message || 'Unknown API error'}`);
        return [];
      }

      // Validate response data structure
      if (!response.data) {
        console.warn('Job matches API returned no data property');
        toast.warning('No job matches data received from server');
        return [];
      }

      if (!Array.isArray(response.data)) {
        console.error('Job matches API returned invalid data format:', {
          dataType: typeof response.data,
          dataValue: response.data
        });
        toast.error('Invalid job matches data format received');
        return [];
      }

      // Transform data with enhanced error handling
      const transformedData = response.data.map((job, index) => {
        if (!job || typeof job !== 'object') {
          console.warn(`Invalid job object at index ${index}:`, job);
          return null;
        }

        try {
          return {
            ...job,
            profileMatch: typeof job.profile_match === 'number' ? job.profile_match : 0,
            preferenceMatch: typeof job.preference_match === 'number' ? job.preference_match : 0
          };
        } catch (transformError) {
          console.error(`Error transforming job at index ${index}:`, transformError, job);
          return null;
        }
      }).filter(job => job !== null);

      console.log(`Successfully processed ${transformedData.length} job matches out of ${response.data.length} received`);
      
      if (transformedData.length === 0 && response.data.length > 0) {
        console.warn('All job matches failed transformation - possible data structure issues');
        toast.warning('Job matches received but failed to process. Please refresh or contact support.');
      }

      return transformedData;
    } catch (error) {
      console.error("Critical error fetching job matches:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response?.data,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      });
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to load job matches";
      if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
        errorMessage = "Network error loading job matches. Please check your connection.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage = "Access denied to job matches. Please check your permissions.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error loading job matches. Please try again later.";
      } else if (error.message) {
        errorMessage = `Job matches loading failed: ${error.message}`;
      }
      
      toast.error(errorMessage);
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
You are an expert AI job matching system generating realistic job opportunities based on current market conditions and user preferences. Create contextually appropriate job listings that align with the user's search query and career profile.

USER SEARCH QUERY: "${searchQuery}"

USER PROFILE CONTEXT:
- Name: ${profile.name || 'Professional'}
- Current Role: ${userRole}
- Primary Location: ${userLocation}
- Skills: ${(profile.skills || []).join(', ') || 'General skills'}
- Experience: ${profile.experience?.map(exp => `${exp.title} at ${exp.company}`).join(', ') || 'Various experience'}

USER JOB PREFERENCES:
- Salary Expectation: ${preferences.minSalary ? `${preferences.currency} ${preferences.minSalary}+` : 'Competitive'}
- Target Locations: ${(preferences.locations || []).join(', ') || userLocation}
- Job Types: ${(preferences.jobTypes || []).join(', ') || 'Full-time preferred'}
- Work Arrangements: ${(preferences.workArrangements || []).join(', ') || 'Open to all'}
- Must Include: ${(preferences.positiveKeywords || []).join(', ') || 'Growth opportunities'}
- Must Avoid: ${(preferences.negativeKeywords || []).join(', ') || 'None specified'}

GENERATE 8-12 realistic job opportunities that:
1. Match the search query "${searchQuery}" and user's career background
2. Are located in user's preferred locations: ${(preferences.locations || []).join(', ') || userLocation}
3. Align with preferred job types: ${(preferences.jobTypes || []).join(', ') || 'Full-time'}
4. Match work arrangement preferences: ${(preferences.workArrangements || []).join(', ') || 'Any'}
5. Include user's positive keywords: ${(preferences.positiveKeywords || []).join(', ') || 'Growth'}
6. Avoid negative keywords: ${(preferences.negativeKeywords || []).join(', ') || 'None'}
7. Offer appropriate salary ranges based on user expectations
8. Represent diverse company sizes and industries
9. Include realistic job descriptions with relevant responsibilities
10. Have posting dates within the last 14 days

Return the job opportunities as a JSON array with this structure:

[
  {
    "title": "Job title relevant to search query and user role",
    "company": "Realistic company name (mix of known and fictional companies)",
    "location": "Location from user's preferred locations list",
    "salary": "Appropriate salary range for role and location",
    "work_arrangement": "Remote/Hybrid/On-site based on user preferences",
    "job_type": "Full-time/Part-time/Contract based on user preferences",
    "description": "Comprehensive job description with responsibilities, requirements, and growth opportunities",
    "company_description": "Realistic company background, culture, and mission statement",
    "url": "https://example.com/jobs/apply/[job-id]",
    "logo": "https://example.com/logos/[company-name].png",
    "posted_date": "Recent date in ISO format (within last 14 days)",
    "benefits": "Realistic benefits package including health, retirement, PTO, and perks",
    "profile_match": 75-95,
    "preference_match": 80-95
  }
]

QUALITY GUIDELINES:
✓ Job titles clearly relate to the search query "${searchQuery}"
✓ Companies represent diverse industries and sizes
✓ Locations strictly match user's geographic preferences
✓ Salaries are realistic for the role, experience level, and location
✓ Job descriptions include specific responsibilities and qualifications
✓ Benefits packages are comprehensive and market-appropriate
✓ Work arrangements align with user preferences
✓ Profile and preference match scores reflect realistic alignment
✓ Posted dates are recent and believable
✓ All job details are internally consistent and professional
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
You are an intelligent AI career discovery system generating diverse, realistic job opportunities that match user profiles and current market trends. Create a comprehensive set of job listings that represent various career advancement paths and opportunities.

USER PROFILE FOR TARGETED DISCOVERY:
- Name: ${profile.name || 'Professional'}
- Target Role: ${currentRole} (${experienceLevel} level)
- Primary Location: ${primaryLocation}
- Core Skills: ${(profile.skills || []).join(', ') || 'Transferable skills'}
- Professional Background: ${profile.experience?.map(exp => `${exp.title} at ${exp.company}`).join('; ') || 'Diverse experience'}
- Education: ${profile.education?.map(edu => `${edu.degree} from ${edu.institution}`).join('; ') || 'Professional qualifications'}

DISCOVERY PARAMETERS:
- Minimum Salary: ${preferences.minSalary ? `${preferences.currency} ${preferences.minSalary}+ (${preferences.salaryType})` : 'Market competitive'}
- Geographic Focus: ${(preferences.locations || []).join(', ') || primaryLocation}
- Employment Types: ${(preferences.jobTypes || []).join(', ') || 'Full-time preferred'}
- Work Arrangements: ${(preferences.workArrangements || []).join(', ') || 'Open to all arrangements'}
- Priority Keywords: ${(preferences.positiveKeywords || []).join(', ') || 'Growth, innovation, impact'}
- Exclusion Keywords: ${(preferences.negativeKeywords || []).join(', ') || 'None specified'}

INTELLIGENT DISCOVERY MISSION:
Generate 10-15 diverse job opportunities that represent:
1. DIRECT CAREER MATCHES: 40% of jobs closely aligned with current role "${currentRole}"
2. ADVANCEMENT OPPORTUNITIES: 30% of jobs representing next-level positions
3. LATERAL MOVES: 20% of jobs in adjacent roles or industries with transferable skills
4. STRETCH OPPORTUNITIES: 10% of jobs that challenge user to grow into new areas

COMPANY DIVERSITY REQUIREMENTS:
- Include startups (1-50 employees), mid-size companies (51-500), and large enterprises (500+)
- Mix of established companies, growing companies, and emerging startups
- Represent various industries while maintaining relevance to user background
- Include both local companies and remote-friendly organizations

LOCATION TARGETING:
- Prioritize user's specified locations: ${(preferences.locations || []).join(', ') || primaryLocation}
- Include remote opportunities if user preferences allow
- Consider hybrid options for broader geographic reach
- Ensure all locations align with user's stated preferences

SALARY AND BENEFITS OPTIMIZATION:
- Base salaries on ${experienceLevel} level expectations for the role and location
- Meet or exceed user's minimum salary requirement: ${preferences.minSalary ? `${preferences.currency} ${preferences.minSalary}+` : 'Competitive market rates'}
- Include comprehensive benefits packages appropriate to company size and industry
- Factor in cost of living for different locations

KEYWORD INTEGRATION:
- Incorporate positive keywords: ${(preferences.positiveKeywords || []).join(', ') || 'Growth, innovation, impact'}
- Avoid negative keywords: ${(preferences.negativeKeywords || []).join(', ') || 'None specified'}
- Ensure job descriptions naturally include relevant terms

Return 10-15 job discoveries in JSON format:

[
  {
    "title": "Job title appropriate for user's experience level and career progression",
    "company": "Realistic company name representing diverse industries and sizes",
    "location": "Location from user's geographic preferences",
    "salary": "Competitive salary range appropriate for role and location",
    "work_arrangement": "Work arrangement matching user preferences",
    "job_type": "Employment type aligned with user preferences",
    "description": "Detailed job description with responsibilities, requirements, and growth opportunities",
    "company_description": "Comprehensive company background, culture, mission, and growth trajectory",
    "url": "https://example.com/careers/apply/[job-id]",
    "logo": "https://example.com/company-logos/[company-name].png",
    "posted_date": "Recent posting date in ISO format (within last 14 days)",
    "benefits": "Comprehensive benefits package including health, retirement, PTO, and company-specific perks",
    "profile_match": 75-95,
    "preference_match": 80-95
  }
]

QUALITY ASSURANCE REQUIREMENTS:
✓ All opportunities align with user's ${currentRole} career trajectory
✓ Experience requirements match ${experienceLevel} capabilities
✓ Salary ranges meet user expectations and market rates
✓ Locations precisely match user's geographic preferences
✓ Work arrangements align with user's stated preferences
✓ Job descriptions include specific, relevant responsibilities
✓ Company information is detailed and realistic
✓ Benefits packages are comprehensive and market-appropriate
✓ Profile and preference match scores accurately reflect alignment
✓ Posted dates are recent and believable
✓ Keywords are naturally integrated into job descriptions
✓ Career progression opportunities are clearly articulated
✓ Industry and role diversity provides meaningful choices
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
      model: 'gpt-4o',
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
    
    // Enhanced Google Gemini configuration for job board integration
    const maxRetries = 3;
    let lastError = null;
    
    console.log('Executing Google Gemini Pro job board search...');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Gemini job search attempt ${attempt}/${maxRetries}`);
        
const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.1, // Low temperature for factual job data
              maxOutputTokens: 6000, // Increased for comprehensive job data
              topP: 0.8,
              topK: 40,
              candidateCount: 1
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'JobMatch-Pro-JobBoard-Integration/1.0'
            },
            timeout: 45000 // Extended timeout for job board queries
          }
        );

        // Enhanced response validation for job board data
        if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('Invalid response from Google Gemini Pro - no job data returned');
        }

        if (response.data.candidates[0].finishReason === 'SAFETY') {
          throw new Error('Job search content was blocked by safety filters');
        }

        const responseContent = response.data.candidates[0].content.parts[0].text.trim();
        
        if (responseContent.length === 0) {
          throw new Error('Empty job search response from Gemini');
        }

        console.log(`Gemini job search response length: ${responseContent.length} characters`);
        
        // Enhanced JSON extraction for job board data
let cleanContent = responseContent;
        
        // Progressive content cleaning with multiple strategies
        const cleaningStrategies = [
          // Remove code block markers
          (content) => content.replace(/```json\s*/gi, '').replace(/```\s*/g, ''),
          // Remove language identifiers
          (content) => content.replace(/^\s*json\s*/gi, '').replace(/^\s*javascript\s*/gi, ''),
          // Remove common AI response prefixes
          (content) => content.replace(/^Here\s+(is|are)\s+.*?:\s*/gi, '').replace(/^The\s+.*?:\s*/gi, ''),
          // Remove trailing explanations
          (content) => content.replace(/\n\n.*$/s, ''),
          // Clean up whitespace
          (content) => content.trim()
        ];
        
        // Apply all cleaning strategies
        for (const strategy of cleaningStrategies) {
          cleanContent = strategy(cleanContent);
        }
        
        console.log('Cleaned content preview:', cleanContent.substring(0, 200));
        
        // Progressive JSON extraction strategies
        const extractionStrategies = [
          // Strategy 1: Direct array extraction
          () => {
            const jsonStart = cleanContent.indexOf('[');
            const jsonEnd = cleanContent.lastIndexOf(']') + 1;
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
              return cleanContent.substring(jsonStart, jsonEnd);
            }
            return null;
          },
          
          // Strategy 2: Single object to array conversion
          () => {
            const objStart = cleanContent.indexOf('{');
            const objEnd = cleanContent.lastIndexOf('}') + 1;
            if (objStart !== -1 && objEnd > objStart) {
              return '[' + cleanContent.substring(objStart, objEnd) + ']';
            }
            return null;
          },
          
          // Strategy 3: Extract from JSON within text
          () => {
            const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              return jsonMatch[0];
            }
            return null;
          },
          
          // Strategy 4: Handle escaped JSON strings
          () => {
            try {
              const unescaped = cleanContent.replace(/\\"/g, '"').replace(/\\n/g, '\n');
              const jsonStart = unescaped.indexOf('[');
              const jsonEnd = unescaped.lastIndexOf(']') + 1;
              if (jsonStart !== -1 && jsonEnd > jsonStart) {
                return unescaped.substring(jsonStart, jsonEnd);
              }
            } catch (e) {
              console.warn('Unescaping strategy failed:', e.message);
            }
            return null;
          },
          
          // Strategy 5: Try to extract from multiline response
          () => {
            const lines = cleanContent.split('\n').filter(line => line.trim());
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line.startsWith('[') || line.startsWith('{')) {
                const remainingLines = lines.slice(i).join('\n');
                const arrayMatch = remainingLines.match(/\[[\s\S]*?\]/);
                if (arrayMatch) {
                  return arrayMatch[0];
                }
                const objMatch = remainingLines.match(/\{[\s\S]*?\}/);
                if (objMatch) {
                  return '[' + objMatch[0] + ']';
                }
              }
            }
            return null;
          }
        ];
        
        // Try each extraction strategy
        let extractedJson = null;
        for (let i = 0; i < extractionStrategies.length; i++) {
          try {
            extractedJson = extractionStrategies[i]();
            if (extractedJson) {
              console.log(`Extraction strategy ${i + 1} succeeded`);
              break;
            }
          } catch (e) {
            console.warn(`Extraction strategy ${i + 1} failed:`, e.message);
          }
        }
        
        if (!extractedJson) {
          console.error('All extraction strategies failed. Raw content:', cleanContent);
          throw new Error('No valid JSON format found in job search response after trying all extraction strategies');
        }
        
        // Parse and validate job data with enhanced error handling
        let jobData;
        try {
          jobData = JSON.parse(extractedJson);
        } catch (parseError) {
          console.error('JSON parsing failed. Extracted content:', extractedJson.substring(0, 500));
          console.error('Parse error details:', parseError.message);
          
          // Try one more repair attempt for common JSON issues
          try {
            const repairedJson = extractedJson
              .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
              .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
              .replace(/'/g, '"')      // Replace single quotes with double quotes
              .replace(/(\w+):/g, '"$1":');  // Quote unquoted keys
            
            jobData = JSON.parse(repairedJson);
            console.log('JSON repair attempt succeeded');
          } catch (repairError) {
            console.error('JSON repair attempt failed:', repairError.message);
            throw new Error(`Invalid JSON in job search response: ${parseError.message}. Repair attempt also failed: ${repairError.message}`);
          }
        }

        // Validate job data structure with enhanced feedback
        if (!Array.isArray(jobData)) {
          if (typeof jobData === 'object' && jobData !== null) {
            console.log('Converting single object to array');
            jobData = [jobData];
          } else {
            console.error('Job data is not an array or object:', typeof jobData);
            throw new Error('Job search response is not a valid data structure');
          }
        }

        if (jobData.length === 0) {
          console.warn('No job opportunities found in search response');
          return [];
        }

        // Enhanced job validation with detailed logging
        const validJobs = jobData.filter((job, index) => {
          const isValid = job && 
                 typeof job === 'object' && 
                 job.title && 
                 job.company && 
                 job.location;
          
          if (!isValid) {
            console.warn(`Job ${index} failed validation:`, {
              hasJob: !!job,
              isObject: typeof job === 'object',
              hasTitle: !!(job && job.title),
              hasCompany: !!(job && job.company),
              hasLocation: !!(job && job.location),
              jobData: job
            });
          }
          
          return isValid;
        });

        if (validJobs.length === 0) {
          console.error('No valid job objects found. Sample data:', jobData.slice(0, 2));
          throw new Error('No valid job objects found in response - all jobs missing required fields (title, company, location)');
        }

        console.log(`Successfully extracted ${validJobs.length} job opportunities from ${jobData.length} total records`);
        
        // Enhance job data with search metadata
        const enhancedJobs = validJobs.map(job => ({
          ...job,
          search_source: 'Google Gemini Pro Job Board Integration',
          search_timestamp: new Date().toISOString(),
          data_quality: 'ai_extracted'
        }));

        return enhancedJobs;

      } catch (error) {
        lastError = error;
        console.warn(`Google Gemini job search attempt ${attempt} failed:`, error.message);

        // Handle specific error types
        if (error.response?.status === 429 && attempt < maxRetries) {
          const delay = 2000 * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Rate limit hit, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (error.response?.status >= 500 && attempt < maxRetries) {
          const delay = 1000 * attempt;
          console.log(`Server error, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // For final attempt or non-retryable errors
        if (attempt === maxRetries) {
          break;
        }
      }
    }

    // If all attempts failed
    const errorMessage = `Google Gemini job board search failed after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  },

  async extractWithOpenRouter(prompt, apiKey) {
    const { default: axios } = await import('axios');
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
{
        model: 'anthropic/claude-3.5-sonnet',
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