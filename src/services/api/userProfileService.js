import { toast } from "react-toastify";
import { importLogService } from "./importLogService";
import * as pdfjsLib from "pdfjs-dist";
import OpenAI from "openai";
import axios from "axios";
import React from "react";
import Error from "@/components/ui/Error";
import { importLogService } from "@/services/api/importLogService";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js`;

// AI service configurations
const AI_SERVICES = {
  openai: {
    model: 'gpt-4o-mini',
    baseURL: 'https://api.openai.com/v1'
  },
  google: {
    model: 'gemini-1.5-flash',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta'
  },
  openrouter: {
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    baseURL: 'https://openrouter.ai/api/v1'
  }
};

// Comprehensive AI prompt for resume extraction
const AI_EXTRACTION_PROMPT = `
You are a professional resume parser. Extract ALL available information from the provided resume text and return it as a valid JSON object with the following structure:

{
  "name": "Full name of the person",
  "email": "Email address",
  "phone": "Phone number",
  "address": "Full address or location",
  "linkedin": "LinkedIn profile URL",
  "website": "Personal website or portfolio URL",
  "summary": "Professional summary or objective",
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "Job location",
      "duration": "Employment duration (e.g., 'Jan 2020 - Present')",
      "description": "Job description and accomplishments"
    }
  ],
  "education": [
    {
      "degree": "Degree type and field",
      "institution": "School or university name",
      "location": "Institution location",
      "year": "Graduation year or duration",
      "gpa": "GPA if mentioned",
      "honors": "Any honors or distinctions"
    }
  ],
  "skills": [
    "List of technical and professional skills"
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year obtained or expires",
      "credential_id": "Credential ID if available"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Project description",
      "technologies": "Technologies used",
      "duration": "Project duration",
      "url": "Project URL if available"
    }
  ],
  "languages": [
    {
      "language": "Language name",
      "proficiency": "Proficiency level"
    }
  ],
  "awards": [
    {
      "name": "Award name",
      "issuer": "Issuing organization",
      "year": "Year received",
      "description": "Award description"
    }
  ]
}

Instructions:
1. Extract ALL information present in the resume text
2. If a field is not found, use null or empty array as appropriate
3. For experience and education, include ALL entries found
4. Skills should be comprehensive and include both technical and soft skills
5. Preserve exact dates, company names, and titles as written
6. Return ONLY valid JSON, no additional text or explanation
7. If multiple sections exist for the same category, combine them intelligently
8. Pay special attention to formatting variations and different section names

Resume text to parse:
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
    const response = await axios.post(
      `${config.baseURL}/models/${config.model}:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: AI_EXTRACTION_PROMPT + text
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4000
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const responseContent = response.data.candidates[0].content.parts[0].text.trim();
    return JSON.parse(responseContent);
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
        // Load PDF document using PDF.js
        const pdfDocument = await pdfjsLib.getDocument({ data: fileContent }).promise;
        pageCount = pdfDocument.numPages;

        // Extract text from each page
        const textPromises = [];
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          textPromises.push(
            pdfDocument.getPage(pageNum).then(page => 
              page.getTextContent().then(textContent => 
                textContent.items.map(item => item.str).join(' ')
              )
            )
          );
        }

        const pageTexts = await Promise.all(textPromises);
        extractedText = pageTexts.join('\n\n');

        if (!extractedText.trim()) {
          throw new Error('No text content found in PDF. The file may be image-based or corrupted.');
        }

// Try AI extraction first if API key is available
        if (apiSettings.apiKey && extractedText.trim()) {
          try {
            console.log(`Attempting AI extraction with ${apiSettings.apiService}...`);
            const aiData = await this.extractWithAI(extractedText, apiSettings.apiKey, apiSettings.apiService);
            
            if (aiData) {
              // Map AI extracted data to our format
              extractedData = {
                name: aiData.name || '',
                email: aiData.email || '',
                experience: Array.isArray(aiData.experience) ? aiData.experience : [],
                education: Array.isArray(aiData.education) ? aiData.education : [],
                skills: Array.isArray(aiData.skills) ? aiData.skills : [],
                imported_at: new Date().toISOString()
              };
              
              aiExtractionUsed = true;
              console.log('AI extraction successful:', {
                name: extractedData.name ? 'Found' : 'Missing',
                email: extractedData.email ? 'Found' : 'Missing',
                experience: extractedData.experience.length,
                education: extractedData.education.length,
                skills: extractedData.skills.length
              });
            }
          } catch (aiError) {
            console.warn('AI extraction failed, falling back to manual parsing:', aiError);
            extractionErrors.push(`AI extraction failed: ${aiError.message}`);
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

// Validate that we have minimum required data - require at least one essential field
// Allow extraction to proceed even if name and email are missing
      // The UI will handle partial data gracefully and prompt user to review
      
      // Log what was found vs what was missing for better user feedback
      const extractionSummary = {
        found: [],
        missing: []
      };
      
      if (extractedData.name) extractionSummary.found.push('name');
      else extractionSummary.missing.push('name');
      
      if (extractedData.email) extractionSummary.found.push('email');
      else extractionSummary.missing.push('email');
      
      if (extractionSummary.missing.length > 0) {
        console.warn(`PDF import partial success - Missing: ${extractionSummary.missing.join(', ')}, Found: ${extractionSummary.found.join(', ')}`);
      }
      
      // Log what was successfully extracted for debugging
      console.log('PDF extraction results:', {
        name: extractedData.name ? 'Found' : 'Missing',
        email: extractedData.email ? 'Found' : 'Missing',
        experience: extractedData.experience.length,
        education: extractedData.education.length,
        skills: extractedData.skills.length
      });

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
        throw new Error('Failed to save profile');
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
          throw new Error('Failed to save profile');
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
        throw new Error('Failed to update profile');
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
          throw new Error('Failed to update profile');
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
        throw new Error('Failed to save API settings');
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
          throw new Error('Failed to save API settings');
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