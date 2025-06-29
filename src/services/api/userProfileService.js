import { toast } from "react-toastify";
import { importLogService } from "./importLogService";
import * as pdfjsLib from "pdfjs-dist";
import OpenAI from "openai";
import axios from "axios";
import React from "react";
import ErrorComponent from "@/components/ui/Error";
// Configure PDF.js worker to use bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();
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
            },
            {
              category: "HARM_CATEGORY_UNSPECIFIED",
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
      let apiSettings = { apiKey: '', apiService: 'openai' };
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
          apiSettings.apiService = existingProfile.data[0].api_service || 'openai';
        }
      } catch (err) {
        console.warn('Could not load API settings:', err);
      }

      // Read PDF file content as ArrayBuffer
      const fileReader = new FileReader();
      const fileContent = await new Promise((resolve, reject) => {
        fileReader.onload = (e) => resolve(e.target.result);
        fileReader.onerror = (e) => reject(new Error('Failed to read PDF file'));
        fileReader.readAsArrayBuffer(file);
      });

      // Store PDF import data first
      const pdfImportParams = {
        records: [{
          Name: `PDF Import - ${file.name}`,
          file_name: file.name,
          import_date: new Date().toISOString(),
          text_content: '', // Will be populated after text extraction
          page_count: 0 // Will be determined during extraction
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

      // Extract text content from PDF using PDF.js
      let extractedText = '';
      let extractionErrors = [];
      let pageCount = 0;
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
        // Enhanced PDF document loading with comprehensive error handling
        console.log('Loading PDF document with enhanced configuration...');
        
        const loadingTask = pdfjsLib.getDocument({ 
          data: fileContent,
          verbosity: 0, // Reduce PDF.js console output
          standardFontDataUrl: new URL('pdfjs-dist/standard_fonts', import.meta.url).toString(),
          // Enhanced loading parameters for robust PDF processing
          maxImageSize: 1024 * 1024, // 1MB max image size
          disableFontFace: false,
          disableRange: false,
          disableStream: false,
          isEvalSupported: true,
          fontExtraProperties: false,
          enableXfa: false,
          ownerDocument: document,
          disableAutoFetch: false,
          disableCreateObjectURL: false
        });
        
        // Add progress tracking for large documents
        loadingTask.onProgress = (progress) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`PDF loading progress: ${percent}%`);
          }
        };
        
        const pdfDocument = await loadingTask.promise;
        pageCount = pdfDocument.numPages;
        console.log(`Successfully loaded PDF with ${pageCount} pages`);

        // Validate document structure
        if (pageCount === 0) {
          throw new Error('PDF document contains no pages');
        }
        
        if (pageCount > 50) {
          console.warn(`Large document detected (${pageCount} pages) - processing may take longer`);
        }

        // Extract text from each page with enhanced error handling and progress tracking
        const pageTexts = [];
        const failedPages = [];
        const extractionWarnings = [];
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          try {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Enhanced text extraction with positioning and formatting
            const pageText = textContent.items
              .map(item => {
                // Preserve some spatial relationships
                const text = item.str;
                if (item.hasEOL) {
                  return text + '\n';
                }
                return text + ' ';
              })
              .join('')
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
            
            if (pageText.length > 10) { // Only include pages with meaningful content
              pageTexts.push(`--- Page ${pageNum} ---\n${pageText}`);
            } else {
              failedPages.push(pageNum);
            }
            
          } catch (pageError) {
            console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
            failedPages.push(pageNum);
            extractionErrors.push(`Page ${pageNum} extraction failed: ${pageError.message}`);
          }
        }

        // Combine all successfully extracted page texts
        extractedText = pageTexts.join('\n\n');
        
        if (failedPages.length > 0) {
          console.warn(`Failed to extract text from ${failedPages.length} pages: ${failedPages.join(', ')}`);
        }

        // Validate text quality
// Enhanced text quality validation and assessment
        if (!extractedText.trim()) {
          throw new Error('No text content found in PDF. The file may be image-based, corrupted, password-protected, or contain only images/graphics.');
        }
        
        // Comprehensive text quality assessment with detailed metrics
        const textQuality = {
          totalLength: extractedText.length,
          wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
          lineCount: extractedText.split('\n').length,
          characterDensity: extractedText.length / pageCount,
          hasEmail: /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(extractedText),
          hasPhonePattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(extractedText),
          hasDatePattern: /\b\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(extractedText),
          hasCommonSections: {
            experience: /\b(?:experience|work|employment|career|professional)\b/i.test(extractedText),
            education: /\b(?:education|academic|university|college|degree)\b/i.test(extractedText),
            skills: /\b(?:skills|technical|competencies|abilities)\b/i.test(extractedText),
            contact: /\b(?:contact|phone|email|address)\b/i.test(extractedText)
          },
          successfulPages: pageTexts.length,
          failedPages: failedPages.length,
          extractionWarnings: extractionWarnings.length
        };
        
        // Calculate quality score
        let qualityScore = 0;
        if (textQuality.totalLength > 100) qualityScore += 20;
        if (textQuality.wordCount > 50) qualityScore += 15;
        if (textQuality.hasEmail) qualityScore += 15;
        if (textQuality.hasCommonSections.experience) qualityScore += 15;
        if (textQuality.hasCommonSections.education) qualityScore += 10;
        if (textQuality.hasCommonSections.skills) qualityScore += 15;
        if (textQuality.hasDatePattern) qualityScore += 10;
        
        textQuality.score = qualityScore;
        textQuality.quality = qualityScore >= 80 ? 'excellent' : 
                             qualityScore >= 60 ? 'good' : 
                             qualityScore >= 40 ? 'fair' : 'poor';
        
        console.log('Enhanced PDF text extraction quality assessment:', textQuality);
        
        // Provide specific warnings based on quality assessment
        if (textQuality.totalLength < 50) {
          extractionErrors.push('Very little text content extracted - PDF may be image-based, scanned, or poorly formatted');
        }
        if (textQuality.characterDensity < 20) {
          extractionWarnings.push('Low character density suggests possible image-based content or sparse formatting');
        }
        if (!textQuality.hasEmail && !textQuality.hasCommonSections.contact) {
          extractionWarnings.push('No contact information patterns detected');
        }
        if (!textQuality.hasCommonSections.experience && !textQuality.hasCommonSections.education) {
          extractionWarnings.push('No common resume sections detected - document may not be a standard resume');
        }
        
        if (extractionWarnings.length > 0) {
          console.warn('PDF extraction warnings:', extractionWarnings);
          extractionErrors.push(...extractionWarnings);
        }

// Try AI extraction first if API key is available
        if (apiSettings.apiKey && extractedText.trim()) {
          try {
            console.log(`Attempting AI extraction with ${apiSettings.apiService}...`);
            const aiData = await this.extractWithAI(extractedText, apiSettings.apiKey, apiSettings.apiService);
            
            if (aiData && typeof aiData === 'object') {
              // Validate and map AI extracted data to our format
              extractedData = {
                name: (aiData.name && typeof aiData.name === 'string' && aiData.name.trim()) ? aiData.name.trim() : '',
                email: (aiData.email && typeof aiData.email === 'string' && aiData.email.includes('@')) ? aiData.email.trim() : '',
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
                console.log('AI extraction successful:', {
                  name: extractedData.name ? 'Found' : 'Missing',
                  email: extractedData.email ? 'Found' : 'Missing',
                  experience: extractedData.experience.length,
                  education: extractedData.education.length,
                  skills: extractedData.skills.length,
                  service: apiSettings.apiService
                });
                
                // Add additional validation for extracted data quality
                if (extractedData.experience.length === 0 && extractedText.toLowerCase().includes('experience')) {
                  console.warn('AI found experience section but extracted no experience entries');
                }
                if (extractedData.skills.length === 0 && extractedText.toLowerCase().includes('skill')) {
                  console.warn('AI found skills section but extracted no skills');
                }
              } else {
                console.warn('AI extraction returned empty or invalid data, falling back to manual parsing');
                extractionErrors.push('AI extraction returned no valid data');
                aiExtractionUsed = false;
              }
            } else {
              console.warn('AI extraction returned invalid data structure');
              extractionErrors.push('AI extraction returned invalid data structure');
            }
          } catch (aiError) {
            console.warn('AI extraction failed, falling back to manual parsing:', aiError);
            extractionErrors.push(`AI extraction failed (${apiSettings.apiService}): ${aiError.message}`);
            
            // Log specific error details for debugging
            if (aiError.response?.data) {
              console.error('AI API Error Response:', aiError.response.data);
            }
          }
        }

        // Fallback to manual parsing if AI extraction failed or unavailable
        if (!aiExtractionUsed || (!extractedData.name && !extractedData.email)) {
          console.log('Using fallback manual parsing...');
          
          // Enhanced name extraction with multiple strategies
          let nameMatches = extractedText.match(/(?:Name|Full Name):\s*([^\n\r]+)/i);
          
          if (!nameMatches) {
            // Try to find name in first few lines (common in resume headers)
            const firstLines = extractedText.split('\n').slice(0, 8);
            for (const line of firstLines) {
              const cleanLine = line.trim();
              // Look for full names (First Last, First Middle Last, etc.)
              const lineNameMatch = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*\s+[A-Z][a-z]+)$/);
              if (lineNameMatch && lineNameMatch[1].length > 5 && lineNameMatch[1].length < 50) {
                // Validate it's not a common header/title
                const commonHeaders = ['curriculum vitae', 'resume', 'contact information', 'personal details'];
                if (!commonHeaders.some(header => lineNameMatch[1].toLowerCase().includes(header))) {
                  nameMatches = lineNameMatch;
                  break;
                }
              }
            }
          }
          
          if (!nameMatches) {
            // Try contact section with broader patterns
            const contactSection = extractedText.match(/(?:Contact|Personal Information|Contact Information)(.*?)(?:Experience|Education|Skills|Summary|Objective)/si);
            if (contactSection) {
              nameMatches = contactSection[1].match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*\s+[A-Z][a-z]+)/);
            }
          }
          
          if (!nameMatches) {
            // Try to find names near email addresses
            const emailContext = extractedText.match(/([A-Z][a-z]+\s+[A-Z][a-z]+).*?[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailContext) {
              nameMatches = [emailContext[0], emailContext[1]];
            }
          }
          
          if (!nameMatches) {
            // Try general pattern for names at beginning of lines with word boundaries
            nameMatches = extractedText.match(/^\s*([A-Z][a-z]+\s+[A-Z][a-z]+)\s*$/m);
          }
          
          if (nameMatches && !extractedData.name) {
            extractedData.name = nameMatches[1].trim();
          } else if (!extractedData.name) {
            extractionErrors.push('Name not found in PDF content');
          }

          // Enhanced email extraction with multiple strategies
          let emailMatches = extractedText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          
          if (!emailMatches) {
            // Try contact section specific search with broader patterns
            const contactSection = extractedText.match(/(?:Contact|Email|Personal Information|Contact Information)(.*?)(?:Experience|Education|Skills|Summary|Objective)/si);
            if (contactSection) {
              emailMatches = contactSection[1].match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            }
          }
          
          if (!emailMatches) {
            // Try searching in header section (first 10 lines)
            const headerLines = extractedText.split('\n').slice(0, 10).join('\n');
            emailMatches = headerLines.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          }
          
          if (!emailMatches) {
            // Try with more liberal email pattern
            emailMatches = extractedText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/);
          }
          
          if (emailMatches && !extractedData.email) {
            extractedData.email = emailMatches[0].trim();
          } else if (!extractedData.email) {
            extractionErrors.push('Email address not found in PDF content');
          }

          // Extract experience section if not already extracted by AI
          if (!aiExtractionUsed || extractedData.experience.length === 0) {
            const experienceSection = extractedText.match(/(?:Experience|Work Experience|Employment)(.*?)(?:Education|Skills|$)/si);
            if (experienceSection) {
              const experienceText = experienceSection[1];
              // Parse individual job entries - this is a simplified approach
              const jobEntries = experienceText.split(/(?=\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))/i);
              
              const manualExperience = [];
              jobEntries.forEach(entry => {
                const titleMatch = entry.match(/([A-Za-z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist))/i);
                const companyMatch = entry.match(/(?:at|@)\s*([A-Za-z0-9\s&.,]+?)(?:\n|,|\d{4})/i);
                const durationMatch = entry.match(/(\d{4}.*?(?:present|current|\d{4}))/i);
                
                if (titleMatch && companyMatch) {
                  manualExperience.push({
                    title: titleMatch[1].trim(),
                    company: companyMatch[1].trim(),
                    duration: durationMatch ? durationMatch[1].trim() : 'Duration not specified',
                    description: entry.replace(titleMatch[0], '').replace(companyMatch[0], '').trim()
                  });
                }
              });
              
              if (manualExperience.length > 0) {
                extractedData.experience = manualExperience;
              }
            } else if (!aiExtractionUsed) {
              extractionErrors.push('Experience section not found in PDF content');
            }
          }

          // Extract education section if not already extracted by AI
          if (!aiExtractionUsed || extractedData.education.length === 0) {
            const educationSection = extractedText.match(/(?:Education|Academic)(.*?)(?:Skills|Experience|$)/si);
            if (educationSection) {
              const educationText = educationSection[1];
              const degreeMatches = educationText.match(/(Bachelor|Master|PhD|Associate).*?(?:in|of)\s*([^\n]+)/gi);
              
              const manualEducation = [];
              if (degreeMatches) {
                degreeMatches.forEach(match => {
                  const institutionMatch = educationText.match(new RegExp(match + '.*?([A-Za-z\\s]+(?:University|College|Institute))', 'i'));
                  const yearMatch = educationText.match(/(\d{4})/);
                  
                  manualEducation.push({
                    degree: match.trim(),
                    institution: institutionMatch ? institutionMatch[1].trim() : 'Institution not specified',
                    year: yearMatch ? yearMatch[1] : 'Year not specified'
                  });
                });
              }
              
              if (manualEducation.length > 0) {
                extractedData.education = manualEducation;
              }
            } else if (!aiExtractionUsed) {
              extractionErrors.push('Education section not found in PDF content');
            }
          }

          // Extract skills if not already extracted by AI
          if (!aiExtractionUsed || extractedData.skills.length === 0) {
            const skillsSection = extractedText.match(/(?:Skills|Technical Skills|Competencies)(.*?)(?:Education|Experience|$)/si);
            if (skillsSection) {
              const skillsText = skillsSection[1];
              // Extract comma-separated or line-separated skills
              const skillMatches = skillsText.match(/[A-Za-z+#.]{2,}(?:\s+[A-Za-z+#.]{2,})*/g);
              if (skillMatches) {
                extractedData.skills = skillMatches
                  .map(skill => skill.trim())
                  .filter(skill => skill.length > 2 && skill.length < 30)
                  .slice(0, 20); // Limit to reasonable number
              }
            } else if (!aiExtractionUsed) {
              extractionErrors.push('Skills section not found in PDF content');
            }
          }
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        if (pdfError.message.includes('Invalid PDF')) {
          extractionErrors.push('Invalid PDF format. Please ensure the file is a valid PDF document.');
        } else if (pdfError.message.includes('password')) {
          extractionErrors.push('Password-protected PDFs are not supported. Please upload an unprotected PDF.');
        } else {
          extractionErrors.push(`PDF processing failed: ${pdfError.message}`);
        }
      }

      // Update PDF import record with extracted text
      if (pdfImportId) {
        await apperClient.updateRecord('pdf_import_data', {
          records: [{
            Id: pdfImportId,
            text_content: extractedText.substring(0, 10000), // Limit text size
            page_count: pageCount
          }]
        });
      }

// Comprehensive extraction quality assessment and validation
        const extractionQuality = {
          essential: {
            name: !!extractedData.name,
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
            textLength: extractedText.length,
            pageCount: pageCount,
            errorCount: extractionErrors.length
          }
        };

        // Calculate overall extraction score
        let extractionScore = 0;
        if (extractedData.name) extractionScore += 30;
        if (extractedData.email) extractionScore += 30;
        if (extractedData.experience.length > 0) extractionScore += 20;
        if (extractedData.education.length > 0) extractionScore += 10;
        if (extractedData.skills.length > 0) extractionScore += 10;

        extractionQuality.score = extractionScore;
        extractionQuality.quality = extractionScore >= 80 ? 'excellent' : 
                                   extractionScore >= 60 ? 'good' : 
                                   extractionScore >= 40 ? 'fair' : 'poor';

        // Log comprehensive extraction results
        console.log('PDF extraction quality assessment:', extractionQuality);

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

        if (extractedData.experience.length === 0 && extractedText.toLowerCase().includes('experience')) {
          extractionSummary.suggestions.push('Experience section detected but entries not extracted - ensure clear job titles and company names');
        }

        if (extractedData.skills.length === 0 && extractedText.toLowerCase().includes('skill')) {
          extractionSummary.suggestions.push('Skills section detected but skills not extracted - use bullet points or comma-separated lists');
        }

        if (extractionQuality.score < 60) {
          extractionSummary.suggestions.push('Consider using a more standard resume format for better AI extraction');
        }
        
        if (extractionSummary.missing.length > 0) {
          console.warn(`PDF import analysis - Missing: ${extractionSummary.missing.join(', ')}, Found: ${extractionSummary.found.join(', ')}`);
          if (extractionSummary.suggestions.length > 0) {
            console.info('Extraction improvement suggestions:', extractionSummary.suggestions);
          }
        }
      // Check if profile exists
      const existingResponse = await apperClient.fetchRecords('user_profile', {
        fields: [{ field: { Name: "Id" } }],
        pagingInfo: { limit: 1, offset: 0 }
      });

      const recordData = {
        Name: extractedData.name || 'Name not extracted',
        email: extractedData.email || '',
        experience: extractedData.experience.length > 0 ? JSON.stringify(extractedData.experience) : '',
        education: extractedData.education.length > 0 ? JSON.stringify(extractedData.education) : '',
        skills: extractedData.skills.length > 0 ? extractedData.skills.join('\n') : '',
        imported_at: new Date().toISOString()
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
        response = await apperClient.updateRecord('user_profile', params);
      } else {
        // Create new record
        const params = {
          records: [recordData]
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
          console.error(`Failed to save profile:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
          return null;
        }
      }

// Log the actual import results
      const logStatus = extractionErrors.length > 0 ? (extractedData.name || extractedData.email ? 'warning' : 'error') : 'success';
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
          extractionSource: aiExtractionUsed ? `AI (${apiSettings.apiService})` : 'PDF.js parsing',
          configVersion: extractionConfig.parsing_logic_version || 'default',
          pageCount: pageCount,
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