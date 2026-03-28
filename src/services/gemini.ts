import { GoogleGenAI, Type } from "@google/genai";
import { CandidateAnalysis, JobDescription } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    email: { type: Type.STRING },
    phone: { type: Type.STRING },
    score: { type: Type.NUMBER },
    breakdown: {
      type: Type.OBJECT,
      properties: {
        skillsMatch: { type: Type.NUMBER },
        experienceLevel: { type: Type.NUMBER },
        toolsAndTech: { type: Type.NUMBER },
        educationRelevance: { type: Type.NUMBER },
        extraCertifications: { type: Type.NUMBER },
      },
      required: ["skillsMatch", "experienceLevel", "toolsAndTech", "educationRelevance", "extraCertifications"],
    },
    classification: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
    quickInsight: { type: Type.STRING },
    decision: { type: Type.STRING },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    careerGuidance: {
      type: Type.OBJECT,
      properties: {
        alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
        reason: { type: Type.STRING },
        suggestedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        shortTips: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    experienceYears: { type: Type.NUMBER },
    education: { type: Type.STRING },
    skillsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
    toolsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "name", "score", "breakdown", "classification", "strengths", "gaps", 
    "quickInsight", "decision", "recommendations", "experienceYears", 
    "education", "skillsFound", "toolsFound"
  ],
};

export async function analyzeCV(jd: string, fileData?: { data: string, mimeType: string }, textContent?: string): Promise<CandidateAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `
    You are an expert ATS (Applicant Tracking System) and HR analyst.
    Analyze the following CV against the provided Job Description (JD).
    
    JOB DESCRIPTION:
    ${jd}
    
    ${textContent ? `CV TEXT CONTENT:\n${textContent}` : 'Please analyze the attached CV file.'}
    
    SCORING ENGINE RULES:
    - Skills Match: 40%
    - Experience Level: 25%
    - Tools & Technologies: 15%
    - Education/Relevance: 10%
    - Extra Skills / Certifications: 10%
    
    CLASSIFICATION RULES:
    - Strong Fit: Score >= 85
    - Good Fit: 70 <= Score < 85
    - Potential Fit: 50 <= Score < 70
    - Not Fit: Score < 50
    - Special: Highlight Overqualified or Underqualified if applicable.
    
    CAREER GUIDANCE:
    If the candidate is 'Not Fit' or 'Potential Fit', provide 2-3 career alternatives, reasons, suggested skills/courses, and short tips.
    
    Return the analysis in the specified JSON format.
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (fileData) {
    parts.push({
      inlineData: {
        data: fileData.data,
        mimeType: fileData.mimeType
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      },
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    const result = JSON.parse(response.text);
    return {
      ...result,
      id: Math.random().toString(36).substring(7),
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
