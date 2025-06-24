from .gemini_service import GeminiService
from typing import Dict, Any, List
import logging
import json
import re

logger = logging.getLogger(__name__)

class ContentService:
    """
    A service dedicated to generating, processing, and compiling research content.
    It orchestrates calls to the GeminiService for various content-related tasks
    such as creating outlines, drafting sections, and compiling final reports.
    """
    def __init__(self, gemini_service: GeminiService):
        """
        Initializes the ContentService with a GeminiService instance.

        Args:
            gemini_service (GeminiService): An instance of GeminiService for interacting with the LLM.
        """
        self.gemini = gemini_service

    async def create_outline(self, query: Dict[str, Any], search_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Creates a structured research outline based on the user's query and initial search results.

        Args:
            query (Dict[str, Any]): The user's research query parameters.
            search_results (List[Dict[str, Any]]): A list of web search results to inform the outline.

        Returns:
            Dict[str, Any]: A dictionary containing the topic, a list of structured sections,
                            and the raw outline text.

        Raises:
            Exception: If there is an error during the LLM call or parsing.
        """
        try:
            sources_text = "\n".join([
                f"- {result['title']}: {result['snippet']}" 
                for result in search_results[:5]
            ])
            
            prompt = f"""
            Create a detailed research outline for the topic: "{query['topic']}"
            
            Research depth: {query.get('depth', 'basic')}
            Perspectives to consider: {', '.join(query.get('perspectives', []))}
            
            Available sources:
            {sources_text}
            
            Please create a structured outline with 3-5 main sections that would be suitable for a comprehensive research report.
            Focus on creating realistic section titles that would provide thorough coverage of the topic.
            """
            
            system_instruction = "You are an expert research editor creating comprehensive outlines for academic and professional research reports."
            
            outline_text = await self.gemini.generate_content(prompt, system_instruction)
            
            # Parse the outline into structured format
            sections = self._parse_outline_to_sections(outline_text, query['topic'])
            
            return {
                'topic': query['topic'],
                'sections': sections,
                'outline_text': outline_text
            }
            
        except Exception as e:
            logger.error(f"Error creating outline: {e}")
            raise

    async def research_sections(self, sections: List[Dict[str, Any]], query: Dict[str, Any], search_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generates detailed content for each section of the research outline.

        Args:
            sections (List[Dict[str, Any]]): A list of sections from the generated outline.
            query (Dict[str, Any]): The user's original research query.
            search_results (List[Dict[str, Any]]): A list of web search results for context.

        Returns:
            List[Dict[str, Any]]: A list of section drafts, each with a title, content, and status.

        Raises:
            Exception: If there is an error during the LLM calls.
        """
        try:
            section_drafts = []
            
            # Prepare sources text with URLs for the LLM prompt
            sources_text = "\n".join([
                f"- {result['title']}: {result['snippet']} ({result.get('url', '')})"
                for result in search_results[:5]
            ])
            
            for section in sections:
                prompt = f"""
                Write comprehensive content for this research section: {section['title']}
                Topic context: {query['topic']}
                Research depth: {query.get('depth', 'basic')}
                
                Use the following sources for your research. Where you use information from these sources, include the actual URL in your text:
                {sources_text}
                
                Create detailed, factual content including:
                - Current research findings with specific data points
                - Multiple stakeholder perspectives 
                - Real-world examples and case studies
                - Quantitative data and statistics where relevant
                - Evidence-based analysis
                
                Where you use information from the sources above, cite the actual URL in your text. Do NOT include placeholder citations like "Insert URL" or "Replace with specific sources". Only use real URLs from the list above.
                Focus on providing substantive analysis with concrete examples.
                """
                
                system_instruction = f"You are an expert researcher writing detailed analysis on {query['topic']}. Provide specific, factual content with concrete examples and data points. Avoid placeholder text. Cite real URLs from the provided sources where relevant."
                
                content = await self.gemini.generate_content(prompt, system_instruction)
                content = self._clean_content(content)
                
                section_drafts.append({
                    'title': section['title'],
                    'content': content,
                    'status': 'drafted'
                })
            
            return section_drafts
            
        except Exception as e:
            logger.error(f"Error researching sections: {e}")
            raise

    async def review_and_revise(self, section_drafts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Reviews and enhances the drafted content for each section to improve quality.

        Args:
            section_drafts (List[Dict[str, Any]]): The initial drafts of the research sections.

        Returns:
            List[Dict[str, Any]]: A list of reviewed and revised sections.

        Raises:
            Exception: If there is an error during the LLM calls.
        """
        try:
            reviewed_sections = []
            
            for draft in section_drafts:
                prompt = f"""
                Review and enhance this research content:
                
                Title: {draft['title']}
                Content: {draft['content']}
                
                Enhance by:
                - Adding more specific examples and case studies
                - Including relevant quantitative data where possible
                - Improving clarity and structure
                - Ensuring balanced perspectives
                - Removing any placeholder text or generic statements
                - Adding concrete details and evidence
                
                Maintain the existing citations.
                Focus on factual accuracy and specificity.
                """
                
                system_instruction = "You are an expert fact-checker and editor ensuring accuracy, specificity, and quality in research content. Remove all placeholder text."
                
                reviewed_content = await self.gemini.generate_content(prompt, system_instruction)
                reviewed_content = self._clean_content(reviewed_content)
                
                reviewed_sections.append({
                    'title': draft['title'],
                    'content': reviewed_content,
                    'status': 'reviewed'
                })
            
            return reviewed_sections
            
        except Exception as e:
            logger.error(f"Error reviewing sections: {e}")
            raise

    async def generate_perspectives(self, topic: str, search_results: List[Dict[str, Any]]) -> list:
        """
        Generates diverse stakeholder perspectives on the research topic using search results.

        Args:
            topic (str): The main research topic.
            search_results (List[Dict[str, Any]]): A list of web search results for context.

        Returns:
            list: A list of dictionaries, where each dictionary represents a unique perspective
                  with a title, viewpoint, and supporting evidence. Returns an empty list on failure.
        """
        sources_text = "\n".join([
            f"- {result['title']}: {result['snippet']}" 
            for result in search_results[:5]
        ])
        
        prompt = f'''
        Based on the following research sources, for the topic "{topic}", provide 3-4 distinct perspectives from different stakeholder groups.
        
        Sources:
        {sources_text}
        
        Create perspectives from stakeholder groups like:
        - Industry/Business perspective
        - Academic/Research perspective  
        - Policy/Government perspective
        - Social/Ethical perspective
        
        For each perspective, provide:
        - A clear title indicating the stakeholder group
        - A detailed viewpoint (2-3 sentences) based on the provided sources.
        - 2-3 specific evidence points or examples from the sources.
        
        Respond with ONLY a valid JSON array of objects. Each object should have keys: "title", "viewpoint", and "evidence" (which is an array of strings).
        Do not include any introductory text, markdown formatting, or anything outside the JSON array.
        '''
        
        system_instruction = f"You are an expert research analyst generating diverse, well-supported perspectives on {topic}. Provide specific, realistic viewpoints based on the provided source material, formatted as a clean JSON array."
        
        response = await self.gemini.generate_content(prompt, system_instruction)
        
        try:
            # Clean up response to extract only the JSON part
            if '```json' in response:
                response = response.split('```json')[1].strip()
            if '```' in response:
                response = response.split('```')[0].strip()

            parsed = json.loads(response)
            
            # Clean each perspective
            for p in parsed:
                p['viewpoint'] = self._clean_content(p.get('viewpoint', ''))
                p['evidence'] = [self._clean_content(ev) for ev in p.get('evidence', [])]
            
            return parsed
        except Exception as e:
            logger.error(f"Error parsing perspectives JSON: {e} - Response was: {response}")
            return []

    async def compile_report(self, query: Dict[str, Any], reviewed_sections: List[Dict[str, Any]], outline: Dict[str, Any], search_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compiles the final research report from all the processed components.

        This function generates a final summary, cleans up section content, extracts sources,
        generates stakeholder perspectives, and assembles everything into a final report structure.

        Args:
            query (Dict[str, Any]): The original user research query.
            reviewed_sections (List[Dict[str, Any]]): The list of reviewed and revised sections.
            outline (Dict[str, Any]): The original research outline.
            search_results (List[Dict[str, Any]]): The initial web search results.

        Returns:
            Dict[str, Any]: A dictionary representing the final, compiled research report.

        Raises:
            Exception: If an error occurs during the final compilation steps.
        """
        try:
            topic = query['topic']
            
            # Generate comprehensive summary
            summary_prompt = f"""
            Create a comprehensive executive summary for research on "{topic}".
            Based on the following section titles: {[s['title'] for s in reviewed_sections]}
            
            Include:
            - Key findings and insights
            - Major trends and developments
            - Critical challenges and opportunities
            - Evidence-based conclusions
            
            Keep it factual and specific. Avoid generic statements.
            Length: 2-3 sentences maximum.
            """
            
            summary = await self.gemini.generate_content(summary_prompt, f"You are summarizing comprehensive research on {topic}. Be specific and factual.")
            summary = self._clean_content(summary)
            
            # Process sections
            sections = []
            for section in reviewed_sections:
                clean_content = self._clean_content(section['content'])
                sections.append({
                    'title': section['title'],
                    'content': clean_content
                })
            
            # Extract and format real sources from the reviewed_sections only
            sources = self._extract_real_sources(reviewed_sections)
            
            # Generate perspectives
            perspectives = await self.generate_perspectives(topic, search_results)
            
            return {
                'summary': summary,
                'sections': sections,
                'sources': {'sources': sources},
                'perspectives': {'perspectives': perspectives},
                'total_sections': len(sections)
            }
            
        except Exception as e:
            logger.error(f"Error compiling report: {e}")
            raise

    def _extract_real_sources(self, reviewed_sections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extracts all unique URLs from the content of the reviewed sections using regex.

        Args:
            reviewed_sections (List[Dict[str, Any]]): The list of reviewed section objects.

        Returns:
            List[Dict[str, Any]]: A list of unique source dictionaries, each with a title, url, and type.
        """
        import re
        sources = []
        url_pattern = r'(https?://[\w\.-]+(?:/[\w\.-]*)*)'
        seen = set()
        for section in reviewed_sections:
            content = section.get('content', '')
            urls = re.findall(url_pattern, content)
            for url in urls:
                if url not in seen:
                    sources.append({'title': url, 'url': url, 'type': 'web'})
                    seen.add(url)
        return sources

    def _clean_content(self, text: str) -> str:
        """
        Removes unwanted placeholder text, references, and notes from the generated content.

        Args:
            text (str): The raw text content generated by the LLM.

        Returns:
            str: The cleaned and formatted text.
        """
        if not text:
            return text
        
        # Remove placeholder citations and text
        text = re.sub(r'\[Insert [^\]]+\]', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\(Replace with [^)]+\)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\(Placeholder[^)]*\)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Insert [^.]+\.', '', text, flags=re.IGNORECASE)
        text = re.sub(r'Replace with [^.]+\.', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\(e\.g\.,\s*\[Insert [^\]]+\]\)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\(e\.g\.,\s*Insert [^)]+\)', '', text, flags=re.IGNORECASE)
        
        # Remove references sections and notes
        text = re.sub(r'\n?References\s*:?.*', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'\n?Note\s*:?.*', '', text, flags=re.IGNORECASE | re.DOTALL)
        
        # Clean up multiple spaces and line breaks
        text = re.sub(r'  +', ' ', text)
        text = re.sub(r'\n\n+', '\n\n', text)
        
        return text.strip()

    def _parse_outline_to_sections(self, outline_text: str, topic: str) -> List[Dict[str, Any]]:
        """
        Parses a raw text outline from the LLM into a structured list of section objects.
        If parsing fails to produce enough sections, it falls back to default sections.

        Args:
            outline_text (str): The raw, multi-line string containing the research outline.
            topic (str): The main research topic, used for generating descriptions.

        Returns:
            List[Dict[str, Any]]: A list of structured section dictionaries, limited to a maximum of 5.
        """
        lines = outline_text.split('\n')
        sections = []
        
        for line in lines:
            line = line.strip()
            if line and (line.startswith('##') or line.startswith('-') or 
                        any(line.startswith(f'{i}.') for i in range(1, 10))):
                title = line.lstrip('#- 1234567890.').strip()
                if title and len(title) > 5:  # Ensure meaningful titles
                    sections.append({
                        'title': title,
                        'description': f"Comprehensive analysis of {title.lower()} in the context of {topic}"
                    })
        
        # Ensure we have quality sections, generate defaults if needed
        if len(sections) < 3:
            sections = self._generate_default_sections(topic)
        
        return sections[:5]  # Limit to 5 sections max

    def _generate_default_sections(self, topic: str) -> List[Dict[str, Any]]:
        """
        Generates a set of default, generic sections when outline parsing fails.
        This ensures that the research process can continue even with a poorly formatted outline.

        Args:
            topic (str): The main research topic to be incorporated into section titles.

        Returns:
            List[Dict[str, Any]]: A list of default section dictionaries.
        """
        return [
            {
                'title': f'Introduction and Background of {topic}',
                'description': f'Historical context and foundational concepts of {topic}'
            },
            {
                'title': f'Current State and Analysis of {topic}',
                'description': f'Present situation, key players, and current developments in {topic}'
            },
            {
                'title': f'Future Implications and Trends in {topic}',
                'description': f'Emerging trends, future projections, and potential impacts of {topic}'
            },
            {
                'title': f'Challenges and Opportunities in {topic}',
                'description': f'Key challenges facing the field and emerging opportunities in {topic}'
            }
        ]
