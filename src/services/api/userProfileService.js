import { toast } from "react-toastify";
import { importLogService } from "@/services/api/importLogService";
import OpenAI from "openai";
import axios from "axios";
// AI service configurations with enhanced settings for robust extraction
const AI_SERVICES = {
  openai: {
    model: 'gpt-4o-mini',
    baseURL: 'https://api.openai.com/v1',
    maxTokens: 4000,
    temperature: 0.1
  },
  google: {
    model: 'gemini-1.5-flash',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    maxTokens: 4000,
    temperature: 0.1,
    timeout: 45000, // Extended timeout for complex documents
    retryAttempts: 3,
    retryDelay: 2000
  },
  openrouter: {
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    baseURL: 'https://openrouter.ai/api/v1',
    maxTokens: 4000,
    temperature: 0.1
  }
};

// Enhanced AI prompt for robust and comprehensive resume extraction
const AI_EXTRACTION_PROMPT = `
You are an expert AI resume parser with advanced understanding of diverse resume formats, layouts, and content structures. Your task is to extract ALL available information from the provided resume text with maximum accuracy and completeness, then return it as a perfectly formatted JSON object.

TARGET JSON STRUCTURE:
{
  "name": "Full name of the person",
  "email": "Email address",
  "phone": "Phone number with country code if available",
  "address": "Complete address or location information",
  "linkedin": "LinkedIn profile URL",
  "website": "Personal website or portfolio URL",
  "summary": "Professional summary, objective, or career statement",
  "experience": [
    {
      "title": "Exact job title as written",
      "company": "Complete company name",
      "location": "Job location (city, state/country)",
      "duration": "Employment period (e.g., 'January 2020 - Present', '2018-2022')",
      "description": "Comprehensive job description including key achievements, responsibilities, and accomplishments"
    }
  ],
  "education": [
    {
      "degree": "Complete degree name and field of study",
      "institution": "Full institution name",
      "location": "Institution location if available",
      "year": "Graduation year or study period",
      "gpa": "GPA or academic performance if mentioned",
      "honors": "Academic honors, distinctions, or achievements"
    }
  ],
  "skills": [
    "Comprehensive list of all technical and professional skills, including programming languages, frameworks, tools, methodologies, soft skills, and domain expertise"
  ],
  "certifications": [
    {
      "name": "Full certification name",
      "issuer": "Issuing organization or authority",
      "year": "Year obtained, renewed, or expires",
      "credential_id": "Certificate ID or credential number if available"
    }
  ],
  "projects": [
    {
      "name": "Project title or name",
      "description": "Detailed project description and scope",
      "technologies": "Technologies, tools, and frameworks used",
      "duration": "Project timeline or development period",
      "url": "Project URL, GitHub link, or demo site if available"
    }
  ],
  "languages": [
    {
      "language": "Language name",
      "proficiency": "Proficiency level (native, fluent, conversational, basic, etc.)"
    }
  ],
  "awards": [
    {
      "name": "Award or recognition name",
      "issuer": "Organization or entity that granted the award",
      "year": "Year received",
      "description": "Details about the award or achievement"
    }
  ]
}

CRITICAL EXTRACTION REQUIREMENTS:

ACCURACY & COMPLETENESS:
1. Extract EVERY piece of information present in the resume, regardless of formatting inconsistencies or unconventional layouts
2. Maintain absolute fidelity to the original text - preserve exact company names, job titles, dates, and technical terms
3. If partial information is available for any field, include it rather than omitting the entire entry
4. For missing fields, use null or empty arrays - NEVER use placeholder text like "Not specified" or "N/A"

ADVANCED PARSING STRATEGIES:
5. Handle multi-column layouts by following logical reading order and content flow
6. Recognize and parse various section naming conventions (e.g., "Work History", "Professional Experience", "Career Summary", "Employment Record")
7. Extract information from headers, footers, sidebars, and any other resume areas
8. Process poorly formatted or inconsistent text by focusing on content patterns and context clues
9. Identify and extract embedded information within narrative descriptions

CONTENT-SPECIFIC GUIDELINES:
10. EXPERIENCE: Capture all employment history including internships, freelance work, and volunteer positions
11. SKILLS: Include technical skills, programming languages, frameworks, tools, methodologies, soft skills, and industry-specific expertise
12. EDUCATION: Extract all educational background including degrees, certifications, courses, workshops, and training programs
13. CONTACT INFO: Find contact details regardless of their position in the document (header, footer, contact section)
14. DATES: Preserve exact date formats and ranges as written (e.g., "Jan 2020 - Present", "2018-2022", "Spring 2019")

DATA QUALITY ASSURANCE:
15. Validate JSON structure and ensure all brackets, quotes, and commas are properly formatted
16. Ensure arrays contain objects with consistent field structures
17. Cross-reference extracted information for consistency and logical coherence
18. If name extraction is challenging, look for patterns in email addresses (e.g., john.doe@company.com → "John Doe")
19. For poor-quality documents, prioritize essential fields: name, email, most recent experience, and key skills

OUTPUT REQUIREMENTS:
- Return ONLY the JSON object with no additional text, explanations, or markdown formatting
- Ensure the JSON is valid and can be parsed without errors
- Include comprehensive data while maintaining structure integrity
- If text quality is extremely poor, extract what is possible and mark uncertain fields appropriately

SPECIAL HANDLING:
- Multi-page documents: Process all pages and combine information intelligently
- Image-based or scanned documents: Work with the available text extraction
- Foreign language content: Extract information while preserving original language in appropriate fields
- Non-standard formats: Adapt parsing strategies to handle creative or unconventional resume layouts

Resume text to parse and extract:
`;

export const userProfileService = {
  async getProfile() {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "email" } },
          { field: { Name: "experience" } },
          { field: { Name: "education" } },
          { field: { Name: "skills" } },
          { field: { Name: "imported_at" } },
          { field: { Name: "api_key" } },
          { field: { Name: "api_service" } }
        ],
        pagingInfo: { limit: 1, offset: 0 }
      };

      const response = await apperClient.fetchRecords('user_profile', params);
      
if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      const data = response.data?.[0];
      if (!data) {
        return null;
      }

return {
        name: data.Name,
        email: data.email,
        experience: (() => {
          try {
            return data.experience && data.experience.trim() ? JSON.parse(data.experience) : [];
          } catch (e) {
            console.warn('Failed to parse experience data:', e);
            return [];
          }
        })(),
        education: (() => {
          try {
            return data.education && data.education.trim() ? JSON.parse(data.education) : [];
          } catch (e) {
            console.warn('Failed to parse education data:', e);
            return [];
          }
        })(),
        skills: data.skills ? data.skills.split('\n').filter(s => s.trim()) : [],
        imported_at: data.imported_at ? new Date(data.imported_at).toISOString() : new Date().toISOString(),
        api_key: data.api_key || '',
        api_service: data.api_service || 'openai'
      };
} catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to connect to the server. Please check your connection and try again.");
      return null;
    }
},

  // AI-powered extraction methods
  async extractWithAI(text, apiKey, service = 'openai') {
    try {
      const serviceConfig = AI_SERVICES[service];
      if (!serviceConfig) {
        throw new Error(`Unsupported AI service: ${service}`);
      }

      let extractedData = null;

      switch (service) {
        case 'openai':
          extractedData = await this.extractWithOpenAI(text, apiKey, serviceConfig);
          break;
        case 'google':
          extractedData = await this.extractWithGoogle(text, apiKey, serviceConfig);
          break;
        case 'openrouter':
          extractedData = await this.extractWithOpenRouter(text, apiKey, serviceConfig);
          break;
        default:
          throw new Error(`Unsupported service: ${service}`);
      }

      return extractedData;
    } catch (error) {
      console.error('AI extraction failed:', error);
      throw error;
    }
  },

  async extractWithOpenAI(text, apiKey, config) {
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "You are a professional resume parser that extracts comprehensive information and returns only valid JSON."
        },
        {
          role: "user",
          content: AI_EXTRACTION_PROMPT + text
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    });

    const responseContent = completion.choices[0].message.content.trim();
    return JSON.parse(responseContent);
  },

async extractWithGoogle(text, apiKey, config) {
    const maxRetries = config.retryAttempts || 3;
    let lastError = null;
    let baseDelay = config.retryDelay || 2000;

    // Pre-validate input parameters
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('Invalid or missing Google API key');
    }

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      throw new Error('Invalid or insufficient text content for extraction');
    }

    console.log(`Starting Google Gemini extraction with ${config.model}...`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Gemini extraction attempt ${attempt}/${maxRetries}`);
        
        // Enhanced request payload with robust configuration
        const requestPayload = {
          contents: [{
            parts: [{
              text: AI_EXTRACTION_PROMPT + text
            }]
          }],
          generationConfig: {
            temperature: config.temperature || 0.1,
            maxOutputTokens: config.maxTokens || 4000,
            topP: 0.8,
            topK: 40,
            candidateCount: 1,
            stopSequences: []
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
        };

        const response = await axios.post(
          `${config.baseURL}/models/${config.model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          requestPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'JobMatch-Pro/1.0',
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate'
            },
            timeout: config.timeout || 45000,
            maxContentLength: 50 * 1024 * 1024, // 50MB limit
            validateStatus: (status) => status < 500 // Don't throw on 4xx errors, handle them explicitly
          }
        );

        // Comprehensive response validation
        if (!response.data) {
          throw new Error('Empty response from Google Gemini API');
        }

        if (response.data.error) {
          const error = response.data.error;
          throw new Error(`Gemini API Error: ${error.message || error.code || 'Unknown API error'}`);
        }

        if (!response.data.candidates || !Array.isArray(response.data.candidates) || response.data.candidates.length === 0) {
          throw new Error('No candidates returned from Gemini API - content may have been blocked by safety filters');
        }

        const candidate = response.data.candidates[0];
        
        // Check for finish reason that indicates issues
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          console.warn(`Gemini finished with reason: ${candidate.finishReason}`);
          if (candidate.finishReason === 'SAFETY') {
            throw new Error('Content was blocked by Gemini safety filters');
          } else if (candidate.finishReason === 'MAX_TOKENS') {
            console.warn('Gemini response was truncated due to token limit');
          }
        }

        if (!candidate.content?.parts?.[0]?.text) {
          throw new Error('Invalid response structure from Google Gemini API - no text content found');
        }

        const responseContent = candidate.content.parts[0].text.trim();
        
        if (responseContent.length === 0) {
          throw new Error('Empty response content from Gemini');
        }

        console.log(`Gemini response length: ${responseContent.length} characters`);
        
        // Enhanced content cleaning for robust JSON extraction
        let cleanContent = responseContent;
        
        // Remove various markdown formatting patterns
        cleanContent = cleanContent.replace(/```json\s*/gi, '');
        cleanContent = cleanContent.replace(/```\s*/g, '');
        cleanContent = cleanContent.replace(/^\s*json\s*/gi, '');
        cleanContent = cleanContent.trim();
        
        // Find JSON object boundaries more robustly
        const jsonStart = cleanContent.indexOf('{');
        const jsonEnd = cleanContent.lastIndexOf('}') + 1;
        
        if (jsonStart === -1 || jsonEnd <= jsonStart) {
          throw new Error('No valid JSON object found in Gemini response');
        }
        
        cleanContent = cleanContent.substring(jsonStart, jsonEnd);
        
        // Validate and parse JSON with detailed error reporting
        let parsedData;
        try {
          parsedData = JSON.parse(cleanContent);
        } catch (parseError) {
          console.error('JSON parsing failed. Content preview:', cleanContent.substring(0, 200));
          throw new Error(`Invalid JSON response from Gemini: ${parseError.message}. Content preview: ${cleanContent.substring(0, 100)}...`);
        }

        // Validate the structure and content quality of parsed data
        if (typeof parsedData !== 'object' || parsedData === null) {
          throw new Error('Gemini returned invalid data structure - expected object');
        }

        // Basic data quality validation
        const hasValidData = parsedData.name || parsedData.email || 
                           (Array.isArray(parsedData.experience) && parsedData.experience.length > 0) ||
                           (Array.isArray(parsedData.skills) && parsedData.skills.length > 0);

        if (!hasValidData) {
          console.warn('Gemini extraction returned minimal useful data');
        }

        console.log(`Gemini extraction successful on attempt ${attempt}:`, {
          name: parsedData.name ? 'Found' : 'Missing',
          email: parsedData.email ? 'Found' : 'Missing',
          experience: Array.isArray(parsedData.experience) ? parsedData.experience.length : 0,
          education: Array.isArray(parsedData.education) ? parsedData.education.length : 0,
          skills: Array.isArray(parsedData.skills) ? parsedData.skills.length : 0
        });

        return parsedData;

      } catch (error) {
        lastError = error;
        console.warn(`Google Gemini extraction attempt ${attempt} failed:`, error.message);

        // Handle specific HTTP status codes
        if (error.response?.status === 400) {
          throw new Error(`Invalid request to Gemini API: ${error.response.data?.error?.message || 'Bad request'}`);
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid Google API key. Please verify your API key is correct and has the necessary permissions.');
        }
        if (error.response?.status === 403) {
          throw new Error('Google API access denied. Please check your API key permissions and ensure the Generative AI API is enabled.');
        }
        if (error.response?.status === 404) {
          throw new Error(`Gemini model '${config.model}' not found. Please check the model name is correct.`);
        }
        if (error.response?.status === 429) {
          console.warn(`Rate limit hit on attempt ${attempt}`);
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Google API rate limit exceeded. Please try again later or check your quota.');
        }
        if (error.response?.status >= 500) {
          console.warn(`Server error ${error.response.status} on attempt ${attempt}`);
          if (attempt < maxRetries) {
            const delay = baseDelay * attempt;
            console.log(`Server error, waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Google API server error. Please try again later.');
        }

        // Handle network and timeout errors
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          console.warn(`Request timeout on attempt ${attempt}`);
          if (attempt < maxRetries) {
            const delay = baseDelay * attempt;
            console.log(`Timeout error, waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Request timeout. The document may be too large or complex for processing.');
        }

        // For other errors, retry if attempts remain
        if (attempt < maxRetries) {
          const delay = baseDelay * attempt;
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If all retries failed, provide comprehensive error information
    const errorMessage = `Google Gemini extraction failed after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  },

  async extractWithOpenRouter(text, apiKey, config) {
    const response = await axios.post(
      `${config.baseURL}/chat/completions`,
      {
        model: config.model,
        messages: [
          {
            role: "system",
            content: "You are a professional resume parser that extracts comprehensive information and returns only valid JSON."
          },
          {
            role: "user",
            content: AI_EXTRACTION_PROMPT + text
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
          'X-Title': 'JobMatch Pro Resume Parser'
        }
      }
    );

const responseContent = response.data.choices[0].message.content.trim();
    return JSON.parse(responseContent);
  },

  // Enhanced AI extraction method for direct PDF processing
  async extractWithAIPDF(base64Content, apiKey, service = 'google') {
    try {
      const serviceConfig = AI_SERVICES[service];
      if (!serviceConfig) {
        throw new Error(`Unsupported AI service for PDF processing: ${service}`);
      }

      let extractedData = null;

      switch (service) {
        case 'google':
          extractedData = await this.extractWithGooglePDF(base64Content, apiKey, serviceConfig);
          break;
        case 'openai':
          // OpenAI doesn't directly support PDF files in the chat API, would need vision API
          throw new Error('OpenAI direct PDF processing not supported. Use Google Gemini for direct PDF processing.');
        case 'openrouter':
          // Most OpenRouter models don't support direct PDF processing
          throw new Error('OpenRouter direct PDF processing not supported. Use Google Gemini for direct PDF processing.');
        default:
          throw new Error(`Unsupported service for direct PDF processing: ${service}`);
      }

      return extractedData;
    } catch (error) {
      console.error('Direct AI PDF extraction failed:', error);
      throw error;
    }
  },

  async extractWithGooglePDF(base64Content, apiKey, config) {
    const maxRetries = config.retryAttempts || 3;
    let lastError = null;
    let baseDelay = config.retryDelay || 2000;

    // Pre-validate input parameters
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('Invalid or missing Google API key');
    }

    if (!base64Content || typeof base64Content !== 'string' || base64Content.trim().length === 0) {
      throw new Error('Invalid or missing PDF content for processing');
    }

    console.log(`Starting Google Gemini direct PDF extraction with ${config.model}...`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Gemini PDF extraction attempt ${attempt}/${maxRetries}`);
        
        // Enhanced request payload for direct PDF processing
        const requestPayload = {
          contents: [{
            parts: [
              {
                text: AI_EXTRACTION_PROMPT
              },
              {
                inline_data: {
                  mime_type: "application/pdf",
                  data: base64Content
                }
              }
            ]
          }],
          generationConfig: {
            temperature: config.temperature || 0.1,
            maxOutputTokens: config.maxTokens || 4000,
            topP: 0.8,
            topK: 40,
            candidateCount: 1,
            stopSequences: []
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
        };

        const response = await axios.post(
          `${config.baseURL}/models/${config.model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          requestPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'JobMatch-Pro/1.0',
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate'
            },
            timeout: config.timeout || 60000, // Extended timeout for PDF processing
            maxContentLength: 100 * 1024 * 1024, // 100MB limit for PDF files
            validateStatus: (status) => status < 500
          }
        );

        // Response validation for PDF processing
        if (!response.data) {
          throw new Error('Empty response from Google Gemini PDF API');
        }

        if (response.data.error) {
          const error = response.data.error;
          throw new Error(`Gemini PDF API Error: ${error.message || error.code || 'Unknown API error'}`);
        }

        if (!response.data.candidates || !Array.isArray(response.data.candidates) || response.data.candidates.length === 0) {
          throw new Error('No candidates returned from Gemini PDF API - content may have been blocked or PDF format unsupported');
        }

        const candidate = response.data.candidates[0];
        
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          console.warn(`Gemini PDF processing finished with reason: ${candidate.finishReason}`);
          if (candidate.finishReason === 'SAFETY') {
            throw new Error('PDF content was blocked by Gemini safety filters');
          } else if (candidate.finishReason === 'MAX_TOKENS') {
            console.warn('Gemini PDF response was truncated due to token limit');
          }
        }

        if (!candidate.content?.parts?.[0]?.text) {
          throw new Error('Invalid response structure from Google Gemini PDF API - no text content found');
        }

        const responseContent = candidate.content.parts[0].text.trim();
        
        if (responseContent.length === 0) {
          throw new Error('Empty response content from Gemini PDF processing');
        }

        console.log(`Gemini PDF response length: ${responseContent.length} characters`);
        
        // Enhanced content cleaning for JSON extraction from PDF processing
        let cleanContent = responseContent;
        
        cleanContent = cleanContent.replace(/```json\s*/gi, '');
        cleanContent = cleanContent.replace(/```\s*/g, '');
        cleanContent = cleanContent.replace(/^\s*json\s*/gi, '');
        cleanContent = cleanContent.trim();
        
        const jsonStart = cleanContent.indexOf('{');
        const jsonEnd = cleanContent.lastIndexOf('}') + 1;
        
        if (jsonStart === -1 || jsonEnd <= jsonStart) {
          throw new Error('No valid JSON object found in Gemini PDF response');
        }
        
        cleanContent = cleanContent.substring(jsonStart, jsonEnd);
        
        let parsedData;
        try {
          parsedData = JSON.parse(cleanContent);
        } catch (parseError) {
          console.error('JSON parsing failed for PDF processing. Content preview:', cleanContent.substring(0, 200));
          throw new Error(`Invalid JSON response from Gemini PDF processing: ${parseError.message}`);
        }

        if (typeof parsedData !== 'object' || parsedData === null) {
          throw new Error('Gemini PDF processing returned invalid data structure - expected object');
        }

        // Validate PDF extraction quality
        const hasValidData = parsedData.name || parsedData.email || 
                           (Array.isArray(parsedData.experience) && parsedData.experience.length > 0) ||
                           (Array.isArray(parsedData.skills) && parsedData.skills.length > 0);

        if (!hasValidData) {
          console.warn('Gemini PDF extraction returned minimal useful data');
        }

        console.log(`Gemini PDF extraction successful on attempt ${attempt}:`, {
          name: parsedData.name ? 'Found' : 'Missing',
          email: parsedData.email ? 'Found' : 'Missing',
          experience: Array.isArray(parsedData.experience) ? parsedData.experience.length : 0,
          education: Array.isArray(parsedData.education) ? parsedData.education.length : 0,
          skills: Array.isArray(parsedData.skills) ? parsedData.skills.length : 0
        });

        return parsedData;

      } catch (error) {
        lastError = error;
        console.warn(`Google Gemini PDF extraction attempt ${attempt} failed:`, error.message);

        // Handle specific errors for PDF processing
        if (error.response?.status === 400) {
          throw new Error(`Invalid PDF request to Gemini API: ${error.response.data?.error?.message || 'Bad request - PDF may be corrupted or unsupported format'}`);
        }
        if (error.response?.status === 413) {
          throw new Error('PDF file too large for Gemini API processing. Please reduce file size or split into smaller documents.');
        }

        // Standard error handling for other HTTP status codes
        if (error.response?.status === 401) {
          throw new Error('Invalid Google API key for PDF processing. Please verify your API key.');
        }
        if (error.response?.status === 403) {
          throw new Error('Google API access denied for PDF processing. Check API key permissions and ensure Generative AI API is enabled.');
        }
        if (error.response?.status === 429) {
          console.warn(`Rate limit hit on PDF processing attempt ${attempt}`);
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Google API rate limit exceeded for PDF processing. Please try again later.');
        }

        // For other errors, retry if attempts remain
        if (attempt < maxRetries) {
          const delay = baseDelay * attempt;
          console.log(`PDF processing error, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

const errorMessage = `Google Gemini PDF extraction failed after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  },

  async importResume(file) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });
      
      // Validate file type
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Please upload a valid PDF file');
      }

      // Get current API settings
      let apiSettings = { apiKey: '', apiService: 'google' }; // Default to Google Gemini Flash
      try {
        const existingProfile = await apperClient.fetchRecords('user_profile', {
          fields: [
            { field: { Name: "api_key" } },
            { field: { Name: "api_service" } }
          ],
          pagingInfo: { limit: 1, offset: 0 }
        });

        if (existingProfile.success && existingProfile.data?.length > 0) {
          apiSettings.apiKey = existingProfile.data[0].api_key || '';
          apiSettings.apiService = existingProfile.data[0].api_service || 'google';
        }
      } catch (err) {
        console.warn('Could not load API settings:', err);
      }

      // Read PDF file as base64 for AI processing
      const fileReader = new FileReader();
      const fileContentBase64 = await new Promise((resolve, reject) => {
        fileReader.onload = (e) => {
          // Extract base64 content from data URL
          const base64Content = e.target.result.split(',')[1];
          resolve(base64Content);
        };
        fileReader.onerror = (e) => reject(new Error('Failed to read PDF file'));
        fileReader.readAsDataURL(file);
      });

      // Read file as data URL for storage
      const fileStorageReader = new FileReader();
      const fileContentForStorage = await new Promise((resolve, reject) => {
        fileStorageReader.onload = (e) => resolve(e.target.result);
        fileStorageReader.onerror = (e) => reject(new Error('Failed to read PDF file content'));
        fileStorageReader.readAsDataURL(file);
      });

      // Save uploaded file locally first with complete metadata
      console.log('Saving uploaded file locally...');
      const uploadedFileParams = {
        records: [{
          Name: `Resume Upload - ${file.name}`,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          upload_date: new Date().toISOString(),
          file_content: fileContentForStorage // Store complete file content
        }]
      };

      const uploadedFileResponse = await apperClient.createRecord('uploaded_file', uploadedFileParams);
      let uploadedFileId = null;

      if (uploadedFileResponse.success && uploadedFileResponse.results?.[0]?.success) {
        uploadedFileId = uploadedFileResponse.results[0].data.Id;
        console.log(`File saved locally with ID: ${uploadedFileId}`);
      } else {
        console.warn('Failed to save file locally, continuing with processing...');
      }

      // Store PDF import data for tracking
      const pdfImportParams = {
        records: [{
          Name: `PDF Import - ${file.name}`,
          file_name: file.name,
          import_date: new Date().toISOString(),
          text_content: 'Direct AI processing - no text extraction',
          page_count: 1 // Unknown for direct processing
        }]
      };

      const pdfImportResponse = await apperClient.createRecord('pdf_import_data', pdfImportParams);
      let pdfImportId = null;

      if (pdfImportResponse.success && pdfImportResponse.results?.[0]?.success) {
        pdfImportId = pdfImportResponse.results[0].data.Id;
      }

      // Get extraction configuration
      const configResponse = await apperClient.fetchRecords('data_extraction_config', {
        fields: [
          { field: { Name: "xpath_selectors" } },
          { field: { Name: "css_selectors" } },
          { field: { Name: "parsing_logic_version" } }
        ],
        where: [{ FieldName: "is_active", Operator: "EqualTo", Values: [true] }],
        pagingInfo: { limit: 1, offset: 0 }
      });

      let extractionConfig = {};
      if (configResponse.success && configResponse.data?.length > 0) {
        extractionConfig = configResponse.data[0];
      }

      // Initialize extraction variables for direct AI processing
      let extractionErrors = [];
      let extractedData = {
        name: '',
        email: '',
        experience: [],
        education: [],
        skills: [],
        imported_at: new Date().toISOString()
      };
      let aiExtractionUsed = false;
      
      try {
        // Direct AI processing without PDF.js - send PDF file directly to AI
console.log('Processing PDF directly with AI API...');
        
        // Direct AI processing without PDF.js - use AI for direct PDF processing
        if (apiSettings.apiKey) {
          try {
            console.log(`Attempting direct PDF AI extraction with ${apiSettings.apiService}...`);
            const aiData = await this.extractWithAIPDF(fileContentBase64, apiSettings.apiKey, apiSettings.apiService);
            
            if (aiData && typeof aiData === 'object') {
              // Validate and map AI extracted data to our format
              extractedData = {
                name: (aiData.name && typeof aiData.name === 'string' && aiData.name.trim()) ? aiData.name.trim() : '',
                email: (aiData.email && typeof aiData.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(aiData.email.trim())) ? aiData.email.trim() : '',
                experience: Array.isArray(aiData.experience) ? aiData.experience.filter(exp => 
                  exp && typeof exp === 'object' && (exp.title || exp.company)
                ) : [],
                education: Array.isArray(aiData.education) ? aiData.education.filter(edu => 
                  edu && typeof edu === 'object' && (edu.degree || edu.institution)
                ) : [],
                skills: Array.isArray(aiData.skills) ? aiData.skills.filter(skill => 
                  skill && typeof skill === 'string' && skill.trim().length > 1
                ).map(skill => skill.trim()) : [],
                imported_at: new Date().toISOString()
              };
              
              // Quality check - ensure we got meaningful data
              const hasValidData = extractedData.name || extractedData.email || 
                                 extractedData.experience.length > 0 || 
                                 extractedData.education.length > 0 || 
                                 extractedData.skills.length > 0;
              
              if (hasValidData) {
                aiExtractionUsed = true;
                console.log('Direct PDF AI extraction successful:', {
                  name: extractedData.name ? 'Found' : 'Missing',
                  email: extractedData.email ? 'Found' : 'Missing',
                  experience: extractedData.experience.length,
                  education: extractedData.education.length,
                  skills: extractedData.skills.length,
                  service: apiSettings.apiService
                });
              } else {
                console.warn('Direct AI extraction returned empty or invalid data');
                extractionErrors.push('Direct AI extraction returned no valid data');
                aiExtractionUsed = false;
              }
            } else {
              console.warn('Direct AI extraction returned invalid data structure');
              extractionErrors.push('Direct AI extraction returned invalid data structure');
            }
          } catch (aiError) {
            console.warn('Direct AI extraction failed:', aiError);
            extractionErrors.push(`Direct AI extraction failed (${apiSettings.apiService}): ${aiError.message}`);
            
            // Log specific error details for debugging
            if (aiError.response?.data) {
              console.error('AI API Error Response:', aiError.response.data);
            }
          }
        } else {
          // No API key available - cannot process PDF without AI
          extractionErrors.push('No AI API key configured. PDF processing requires AI API for direct parsing.');
          console.warn('No AI API key available for direct PDF processing');
        }

        // If AI extraction failed and no API key is available, provide minimal data
        if (!aiExtractionUsed) {
          extractedData = {
            name: 'Name extraction failed - AI required',
            email: '',
            experience: [],
            education: [],
            skills: [],
            imported_at: new Date().toISOString()
          };
          extractionErrors.push('Direct PDF processing requires AI API. Please configure your API key in the AI Configuration section.');
        }
      } catch (processingError) {
        console.error('Direct PDF processing error:', processingError);
        if (processingError.message.includes('Invalid PDF')) {
          extractionErrors.push('Invalid PDF format. Please ensure the file is a valid PDF document.');
        } else if (processingError.message.includes('API key')) {
          extractionErrors.push('AI API configuration required for PDF processing. Please set up your API key.');
        } else {
          extractionErrors.push(`Direct PDF processing failed: ${processingError.message}`);
        }
      }

      // Skip the following complex text extraction code since we're using direct AI processing

      // Update PDF import record with extracted text
// Update PDF import record with processing details
      if (pdfImportId) {
        await apperClient.updateRecord('pdf_import_data', {
          records: [{
            Id: pdfImportId,
            text_content: `Direct AI processing completed. Extraction method: ${aiExtractionUsed ? apiSettings.apiService : 'Failed - No API key'}`,
            page_count: 1 // Direct processing doesn't provide page count
          }]
        });
      }

// Comprehensive extraction quality assessment and validation for direct AI processing
      const extractionQuality = {
        essential: {
          name: !!extractedData.name && !extractedData.name.includes('extraction failed'),
          email: !!extractedData.email
        },
        content: {
          experience: extractedData.experience.length,
          education: extractedData.education.length,
          skills: extractedData.skills.length
        },
        metadata: {
          aiUsed: aiExtractionUsed,
          service: apiSettings.apiService,
          processingMethod: 'Direct AI PDF Processing',
          fileSize: file.size,
          errorCount: extractionErrors.length
        }
      };

      // Calculate overall extraction score
      let extractionScore = 0;
      if (extractedData.name && !extractedData.name.includes('extraction failed')) extractionScore += 30;
      if (extractedData.email) extractionScore += 30;
      if (extractedData.experience.length > 0) extractionScore += 20;
      if (extractedData.education.length > 0) extractionScore += 10;
      if (extractedData.skills.length > 0) extractionScore += 10;

      extractionQuality.score = extractionScore;
      extractionQuality.quality = extractionScore >= 80 ? 'excellent' : 
                                 extractionScore >= 60 ? 'good' : 
                                 extractionScore >= 40 ? 'fair' : 'poor';

      // Log comprehensive extraction results
      console.log('Direct AI PDF extraction quality assessment:', extractionQuality);
        // Provide specific feedback based on extraction results
        const extractionSummary = {
          found: [],
          missing: [],
          suggestions: []
        };
        
        if (extractedData.name) extractionSummary.found.push('name');
        else {
          extractionSummary.missing.push('name');
          extractionSummary.suggestions.push('Ensure your name appears prominently at the top of the resume');
        }
        
        if (extractedData.email) extractionSummary.found.push('email');
        else {
          extractionSummary.missing.push('email');
          extractionSummary.suggestions.push('Include your email address in the contact information section');
        }

if (extractedData.experience.length === 0 && aiExtractionUsed) {
          extractionSummary.suggestions.push('Experience section not extracted - ensure clear job titles and company names in your PDF');
        }

        if (extractedData.skills.length === 0 && aiExtractionUsed) {
          extractionSummary.suggestions.push('Skills section not extracted - use bullet points or comma-separated lists in your PDF');
        }

        if (!aiExtractionUsed) {
          extractionSummary.suggestions.push('Configure AI API key for enhanced extraction capabilities');
        }

        if (extractionQuality.score < 60) {
          extractionSummary.suggestions.push('Consider using a more standard resume format for better AI extraction');
        }
        
        if (extractionSummary.missing.length > 0) {
          console.warn(`Direct PDF import analysis - Missing: ${extractionSummary.missing.join(', ')}, Found: ${extractionSummary.found.join(', ')}`);
          if (extractionSummary.suggestions.length > 0) {
            console.info('Direct AI extraction improvement suggestions:', extractionSummary.suggestions);
          }
        }
// Check if profile exists
      const existingResponse = await apperClient.fetchRecords('user_profile', {
        fields: [{ field: { Name: "Id" } }],
        pagingInfo: { limit: 1, offset: 0 }
      });

      // Prepare profile data with enhanced validation
      const recordData = {
        Name: extractedData.name || 'Name not extracted',
        email: extractedData.email || '',
        experience: extractedData.experience.length > 0 ? JSON.stringify(extractedData.experience) : '',
        education: extractedData.education.length > 0 ? JSON.stringify(extractedData.education) : '',
        skills: extractedData.skills.length > 0 ? extractedData.skills.join('\n') : '',
        imported_at: new Date().toISOString(),
        ai_processing_result: JSON.stringify({
          extractionSource: aiExtractionUsed ? `AI (${apiSettings.apiService})` : 'PDF.js parsing',
          uploadedFileId: uploadedFileId,
          extractionQuality: extractionQuality?.quality || 'unknown',
          extractionScore: extractionQuality?.score || 0,
          aiEnhanced: aiExtractionUsed,
          processedAt: new Date().toISOString()
        })
      };

      // Link to uploaded file if available
      if (uploadedFileId) {
        recordData.uploaded_file = uploadedFileId;
      }

      let response;

      if (existingResponse.success && existingResponse.data?.length > 0) {
        // Update existing record
        const params = {
          records: [{
            Id: existingResponse.data[0].Id,
            ...recordData
          }]
        };
        response = await apperClient.updateRecord('user_profile', params);
      } else {
        // Create new record
        const params = {
          records: [recordData]
        };
        response = await apperClient.createRecord('user_profile', params);
      }
      
      if (!response.success) {
        console.error('Profile save failed:', response.message);
        
        // Handle specific email validation errors
        if (response.message && response.message.toLowerCase().includes('email')) {
          toast.error('Email validation failed. Please ensure your resume contains a valid email address, or manually add one to your profile after upload.');
        } else {
          toast.error(`Failed to save profile: ${response.message}`);
        }
        return null;
      }

      if (response.results) {
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to save profile:${JSON.stringify(failedRecords)}`);
          
          // Enhanced error handling for common validation failures
          let hasEmailError = false;
          let hasNameError = false;
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              if (error.fieldLabel && error.fieldLabel.toLowerCase().includes('email')) {
                hasEmailError = true;
                toast.error(`Email validation failed: ${error.message}. Please ensure your resume contains a valid email address.`);
              } else if (error.fieldLabel && error.fieldLabel.toLowerCase().includes('name')) {
                hasNameError = true;
                toast.error(`Name validation failed: ${error.message}. Please ensure your name is clearly visible in your resume.`);
              } else {
                toast.error(`${error.fieldLabel}: ${error.message}`);
              }
            });
            
            if (record.message) {
              if (record.message.toLowerCase().includes('email')) {
                hasEmailError = true;
                toast.error('Email validation error. Your profile has been partially saved. Please review and update your email address manually.');
              } else {
                toast.error(record.message);
              }
            }
          });
          
          // Provide specific guidance for common issues
          if (hasEmailError) {
            console.warn('Email validation failed - profile may be partially saved');
            toast.warning('Your resume has been processed but email validation failed. You can manually update your email in the profile section.');
          }
          
          if (hasNameError) {
            console.warn('Name validation failed - profile may be partially saved');
            toast.warning('Your resume has been processed but name validation failed. You can manually update your name in the profile section.');
          }
          
          // Return partial data for profile display even if save failed
          return extractedData;
        }
      }
// Log the actual import results for direct AI processing
      const logStatus = extractionErrors.length > 0 ? (extractedData.name && !extractedData.name.includes('extraction failed') || extractedData.email ? 'warning' : 'error') : 'success';
      await importLogService.create({
        status: logStatus,
        extractedFields: {
          personalInfo: { 
            name: extractedData.name || null, 
            email: extractedData.email || null 
          },
          experience: extractedData.experience,
          education: extractedData.education,
          skills: extractedData.skills,
          extractionSource: aiExtractionUsed ? `Direct AI (${apiSettings.apiService})` : 'Direct processing failed - no AI key',
          configVersion: extractionConfig.parsing_logic_version || 'direct-ai-v1',
          processingMethod: 'Direct AI PDF Processing',
          aiEnhanced: aiExtractionUsed
        },
        errors: extractionErrors
      });
      return extractedData;
    } catch (error) {
      console.error("Error importing resume:", error);
      toast.error(`Error uploading file: ${error.message}`);
      
      // Log the failed import
      try {
        await importLogService.create({
          status: 'error',
          extractedFields: {},
          errors: [error.message || 'Unknown error occurred during import']
        });
      } catch (logError) {
        console.error("Error logging import failure:", logError);
      }
      
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      // Get existing record
      const existingResponse = await apperClient.fetchRecords('user_profile', {
        fields: [{ field: { Name: "Id" } }],
        pagingInfo: { limit: 1, offset: 0 }
      });

      if (!existingResponse.success || !existingResponse.data?.length) {
        throw new Error('No profile found');
      }

      const params = {
        records: [{
          Id: existingResponse.data[0].Id,
          ...(profileData.name && { Name: profileData.name }),
          ...(profileData.email && { email: profileData.email }),
          ...(profileData.experience && { experience: JSON.stringify(profileData.experience) }),
          ...(profileData.education && { education: JSON.stringify(profileData.education) }),
          ...(profileData.skills && { skills: profileData.skills.join('\n') })
        }]
      };

      const response = await apperClient.updateRecord('user_profile', params);
      
if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to update profile:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
          return null;
        }
      }

      toast.success("Profile updated successfully");
      return await this.getProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      throw error;
    }
},

  async updateApiSettings(settings) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      // Get existing record
      const existingResponse = await apperClient.fetchRecords('user_profile', {
        fields: [{ field: { Name: "Id" } }],
        pagingInfo: { limit: 1, offset: 0 }
      });

      let response;
      if (existingResponse.success && existingResponse.data?.length > 0) {
        // Update existing record
        const params = {
          records: [{
            Id: existingResponse.data[0].Id,
            api_key: settings.apiKey,
            api_service: settings.apiService
          }]
        };
        response = await apperClient.updateRecord('user_profile', params);
      } else {
        // Create new record with API settings
        const params = {
          records: [{
            Name: 'User Profile',
            api_key: settings.apiKey,
            api_service: settings.apiService
          }]
        };
        response = await apperClient.createRecord('user_profile', params);
      }

      if (!response.success) {
console.error(response.message);
        toast.error(response.message);
        return null;
      }
      if (response.results) {
        const failedRecords = response.results.filter(result => !result.success);
if (failedRecords.length > 0) {
          console.error(`Failed to save API settings:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
          return null;
        }
      }
      return { success: true };
    } catch (error) {
      console.error("Error updating API settings:", error);
      throw error;
    }
  },

  async deleteProfile() {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      // Get existing record
      const existingResponse = await apperClient.fetchRecords('user_profile', {
        fields: [{ field: { Name: "Id" } }],
        pagingInfo: { limit: 1, offset: 0 }
      });

      if (!existingResponse.success || !existingResponse.data?.length) {
        return { success: true }; // Already deleted
      }

      const params = {
        RecordIds: [existingResponse.data[0].Id]
      };

      const response = await apperClient.deleteRecord('user_profile', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return { success: false };
      }

      toast.success("Profile deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Failed to delete profile");
      throw error;
    }
  }
};