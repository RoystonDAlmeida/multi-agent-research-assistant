import httpx
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class WebSearchService:
    """
    A service class for performing web searches using the DuckDuckGo Instant Answer API.
    It provides a simple interface to get search results for a given topic.
    """
    async def perform_web_search(self, topic: str) -> List[Dict[str, Any]]:
        """
        Performs a web search for a given topic using the DuckDuckGo API.
        It processes the results and includes a static link to Google Scholar.

        Args:
            topic (str): The research topic to search for.

        Returns:
            List[Dict[str, Any]]: A list of search result dictionaries, each containing
                                  a title, url, snippet, and source type. Returns fallback
                                  results on API failure.
        """
        try:
            # Format the topic for a URL query string.
            search_query = topic.replace(" ", "+")
            url = f"https://api.duckduckgo.com/?q={search_query}&format=json&no_html=1&skip_disambig=1"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    results = []
                    
                    # Process the 'RelatedTopics' from the API response, which contains the main search results.
                    if data.get('RelatedTopics'):
                        for item in data['RelatedTopics'][:10]: # Limit to the top 10 results.
                            if isinstance(item, dict) and 'Text' in item:
                                results.append({
                                    'title': item.get('Text', '').split(' - ')[0] or 'Web Source',
                                    'url': item.get('FirstURL', '#'),
                                    'snippet': item.get('Text', 'Web search result'),
                                    'source': 'web'
                                })
                    
                    return results
                    
                else:
                    logger.error(f"Web search API returned status: {response.status_code}")
                    return self._get_fallback_results(topic)
                    
        except Exception as e:
            logger.error(f"Web search error: {e}")
            return self._get_fallback_results(topic)

    def _get_fallback_results(self, topic: str) -> List[Dict[str, Any]]:
        """
        Provides a default set of results when the primary web search API fails.
        This ensures the workflow can continue with at least some placeholder data.

        Args:
            topic (str): The original research topic.

        Returns:
            List[Dict[str, Any]]: A list containing a single fallback search result.
        """
        return [{
            'title': f"Current Research on {topic}",
            'url': '#',
            'snippet': f"Recent findings and developments in {topic} research",
            'source': 'web'
        }]
