// Types and interfaces for research queries, results, and related data structures

// Represents a research query submitted by the user
export interface ResearchQuery {
  topic: string; // The research topic
  depth: 'Basic Overview' | 'Comprehensive Analysis' | 'Expert-Level Deep Dive'; // Level of detail requested
  perspectives: string[]; // Stakeholder perspectives to include
  format: 'markdown'// Output format
  sources: string[]; // List of source URLs or identifiers
  timeframe?: string; // Optional: time period for the research
}

// All possible states for a research workflow
export type ResearchState = 
  | 'waiting'
  | 'initializing'
  | 'web-research'
  | 'outline-planning'
  | 'in-depth-research'
  | 'review-revision'
  | 'compilation'
  | 'completed'
  | 'revision';

// Progress tracking for each agent in the workflow
export interface AgentProgress {
  name: string; // Agent name (e.g., 'Web Research Agent')
  status: 'waiting' | 'active' | 'completed' | 'error'; // Current status
  progress: number; // Progress percentage (0-100)
  currentTask?: string; // Optional: description of current task
}

// Represents the final research result for a query
export interface ResearchResult {
  id: string; // Unique result ID
  title: string; // Title of the research
  summary: string; // Executive summary
  sections: ResearchSection[]; // Main content sections
  sources: Source[]; // List of sources used in the research
  perspectives: Perspective[]; // Stakeholder perspectives
  lastUpdated: string; // Last update timestamp (ISO string)
}

// Represents a section of the research report
export interface ResearchSection {
  id: string; // Unique section ID
  title: string; // Section title
  content: string; // Section content
  sources: string[]; // URLs or identifiers for sources cited in this section
}

// Represents a source (web, academic, etc.)
export interface Source {
  id: string; // Unique source ID
  title: string; // Source title or description
  url: string; // Source URL
  type: 'web' | 'academic' | 'news' | 'book'; // Source type
  relevance: number; // Relevance score (0-1 or 0-100)
  reliability: number; // Reliability score (0-1 or 0-100)
}

// Represents a stakeholder perspective
export interface Perspective {
  id: string; // Unique perspective ID
  title: string; // Perspective title (e.g., 'Industry Perspective')
  viewpoint: string; // Main viewpoint or summary
  evidence: string[]; // Supporting evidence or examples
}
