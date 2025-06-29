import { toast } from 'react-toastify';
import { importLogService } from './importLogService';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js`;
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
          { field: { Name: "imported_at" } }
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
        importedAt: data.imported_at ? new Date(data.imported_at).toISOString() : new Date().toISOString()
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
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
        importedAt: new Date().toISOString()
      };

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

// Use actual parsing logic based on configuration with multiple fallback patterns
        
        // Enhanced name extraction with multiple strategies
        let nameMatches = extractedText.match(/(?:Name|Full Name):\s*([^\n\r]+)/i);
        
        if (!nameMatches) {
          // Try to find name in first few lines (common in resume headers)
          const firstLines = extractedText.split('\n').slice(0, 5);
          for (const line of firstLines) {
            const lineNameMatch = line.trim().match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*\s+[A-Z][a-z]+)$/);
            if (lineNameMatch && lineNameMatch[1].length > 5 && lineNameMatch[1].length < 50) {
              nameMatches = lineNameMatch;
              break;
            }
          }
        }
        
        if (!nameMatches) {
          // Try contact section
          const contactSection = extractedText.match(/(?:Contact|Personal Information)(.*?)(?:Experience|Education|Skills|Summary)/si);
          if (contactSection) {
            nameMatches = contactSection[1].match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
          }
        }
        
        if (!nameMatches) {
          // Try general pattern for names at beginning of lines
          nameMatches = extractedText.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)/m);
        }
        
        if (nameMatches) {
          extractedData.name = nameMatches[1].trim();
        } else {
          extractionErrors.push('Name not found in PDF content');
        }

        // Enhanced email extraction with multiple strategies
        let emailMatches = extractedText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        
        if (!emailMatches) {
          // Try contact section specific search
          const contactSection = extractedText.match(/(?:Contact|Email|Personal Information)(.*?)(?:Experience|Education|Skills|Summary)/si);
          if (contactSection) {
            emailMatches = contactSection[1].match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          }
        }
        
        if (emailMatches) {
          extractedData.email = emailMatches[0].trim();
        } else {
          extractionErrors.push('Email address not found in PDF content');
        }

        // Extract experience section
        const experienceSection = extractedText.match(/(?:Experience|Work Experience|Employment)(.*?)(?:Education|Skills|$)/si);
        if (experienceSection) {
          const experienceText = experienceSection[1];
          // Parse individual job entries - this is a simplified approach
          const jobEntries = experienceText.split(/(?=\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))/i);
          
          jobEntries.forEach(entry => {
            const titleMatch = entry.match(/([A-Za-z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist))/i);
            const companyMatch = entry.match(/(?:at|@)\s*([A-Za-z0-9\s&.,]+?)(?:\n|,|\d{4})/i);
            const durationMatch = entry.match(/(\d{4}.*?(?:present|current|\d{4}))/i);
            
            if (titleMatch && companyMatch) {
              extractedData.experience.push({
                title: titleMatch[1].trim(),
                company: companyMatch[1].trim(),
                duration: durationMatch ? durationMatch[1].trim() : 'Duration not specified',
                description: entry.replace(titleMatch[0], '').replace(companyMatch[0], '').trim()
              });
            }
          });
        } else {
          extractionErrors.push('Experience section not found in PDF content');
        }

        // Extract education section
        const educationSection = extractedText.match(/(?:Education|Academic)(.*?)(?:Skills|Experience|$)/si);
        if (educationSection) {
          const educationText = educationSection[1];
          const degreeMatches = educationText.match(/(Bachelor|Master|PhD|Associate).*?(?:in|of)\s*([^\n]+)/gi);
          
          if (degreeMatches) {
            degreeMatches.forEach(match => {
              const institutionMatch = educationText.match(new RegExp(match + '.*?([A-Za-z\\s]+(?:University|College|Institute))', 'i'));
              const yearMatch = educationText.match(/(\d{4})/);
              
              extractedData.education.push({
                degree: match.trim(),
                institution: institutionMatch ? institutionMatch[1].trim() : 'Institution not specified',
                year: yearMatch ? yearMatch[1] : 'Year not specified'
              });
            });
          }
        } else {
          extractionErrors.push('Education section not found in PDF content');
        }

        // Extract skills
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
        } else {
          extractionErrors.push('Skills section not found in PDF content');
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

      // Validate that we have minimum required data
// More forgiving validation - require at least one essential field
      if (!extractedData.name && !extractedData.email) {
        const missingFields = [];
        if (!extractedData.name) missingFields.push('name');
        if (!extractedData.email) missingFields.push('email address');
        
        throw new Error(`Unable to extract essential profile information from PDF. Missing: ${missingFields.join(', ')}. Please ensure the PDF contains clearly formatted contact information in the header section or a dedicated contact area.`);
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
          extractionSource: 'PDF.js parsing',
          configVersion: extractionConfig.parsing_logic_version || 'default',
          pageCount: pageCount
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