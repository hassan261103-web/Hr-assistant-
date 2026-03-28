export interface JobDescription {
  title: string;
  requirements: string[];
  skills: string[];
  tools: string[];
  experienceLevel: string;
}

export interface ScoreBreakdown {
  skillsMatch: number; // 40%
  experienceLevel: number; // 25%
  toolsAndTech: number; // 15%
  educationRelevance: number; // 10%
  extraCertifications: number; // 10%
}

export type Classification = 'Strong Fit' | 'Good Fit' | 'Potential Fit' | 'Not Fit' | 'Overqualified' | 'Underqualified';

export interface CareerGuidance {
  alternatives: string[];
  reason: string;
  suggestedSkills: string[];
  shortTips: string[];
}

export interface CandidateAnalysis {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  score: number;
  breakdown: ScoreBreakdown;
  classification: Classification;
  strengths: string[];
  gaps: string[];
  quickInsight: string;
  decision: string;
  recommendations: string[];
  careerGuidance?: CareerGuidance;
  experienceYears: number;
  education: string;
  skillsFound: string[];
  toolsFound: string[];
}

export interface AnalyticsData {
  averageScore: number;
  skillsGap: { skill: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
  classificationDistribution: { name: string; value: number }[];
}
