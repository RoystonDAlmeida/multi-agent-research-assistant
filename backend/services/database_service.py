import logging
from typing import Dict, Any, Optional, List
from supabase import Client

logger = logging.getLogger(__name__)

class DatabaseService:
    """
    A service class dedicated to handling all interactions with the Supabase database.
    It provides a structured interface for fetching, updating, and inserting data
    related to research queries, agent progress, and final results.
    """
    def __init__(self, supabase_client: Client, user_id: str, auth_token: str):
        """
        Initializes the DatabaseService.

        Args:
            supabase_client (Client): An authenticated Supabase client instance.
            user_id (str): The ID of the currently authenticated user.
            auth_token (str): The authentication token for the user.
        """
        self.supabase = supabase_client
        self.user_id = user_id
        self.auth_token = auth_token

    async def get_research_query(self, query_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches a specific research query by its ID from the database.
        
        Args:
            query_id (str): The unique identifier of the research query to fetch.
        
        Returns:
            Optional[Dict[str, Any]]: A dictionary containing the query data if found
                                      and accessible by the user, otherwise None.
        """
        try:
            response = self.supabase.table('research_queries').select('*').eq('id', query_id).execute()
            
            if not response.data:
                logger.warning(f"Research query {query_id} not found or access denied for user {self.user_id}")
                return None
            
            query_data = response.data[0]
            return query_data
            
        except Exception as e:
            logger.error(f"Error fetching research query {query_id}: {e}")
            return None

    async def update_query_status(self, query_id: str, status: str) -> bool:
        """
        Updates the status of a specific research query.
        
        Args:
            query_id (str): The ID of the query to update.
            status (str): The new status to set for the query.
            
        Returns:
            bool: True if the update was successful, False otherwise.
        """
        try:
            response = self.supabase.table('research_queries').update({
                'status': status,
                'updated_at': 'now()'
            }).eq('id', query_id).execute()
            
            if response.data:
                return True
            else:
                logger.warning(f"Failed to update query {query_id}. Might not exist or user {self.user_id} lacks access.")
                return False
                
        except Exception as e:
            logger.error(f"Error updating query status: {e}")
            return False

    async def initialize_agents(self, query_id: str) -> None:
        """
        Initializes the progress tracking records for all agents for a new research query.
        This creates a starting entry for each agent in the 'agent_progress' table.
        
        Args:
            query_id (str): The ID of the research query for which to initialize agents.
        """
        try:
            agents = [
                {'name': 'Web Research Agent', 'status': 'waiting', 'progress': 0, 'message': 'Preparing to start web research'},
                {'name': 'Editor Agent', 'status': 'waiting', 'progress': 0, 'message': 'Waiting to create research outline'},
                {'name': 'Academic Research Agent', 'status': 'waiting', 'progress': 0, 'message': 'Waiting to conduct in-depth research'},
                {'name': 'Fact Checker Agent', 'status': 'waiting', 'progress': 0, 'message': 'Waiting to review and fact-check content'},
                {'name': 'Synthesis Agent', 'status': 'waiting', 'progress': 0, 'message': 'Waiting to compile final report'}
            ]
            
            for agent in agents:
                self.supabase.table('agent_progress').insert({
                    'query_id': query_id,
                    'agent_name': agent['name'],
                    'status': agent['status'],
                    'progress': agent['progress'],
                    'current_task': agent['message']
                }).execute()
                
        except Exception as e:
            logger.error(f"Error initializing agents: {e}")

    async def update_agent_progress(self, query_id: str, agent_name: str, status: str, 
                                  progress: int, message: str) -> None:
        """
        Updates the progress of a single agent for a specific query.
        
        Args:
            query_id (str): The ID of the relevant research query.
            agent_name (str): The name of the agent to update.
            status (str): The new status of the agent (e.g., 'active', 'completed').
            progress (int): The new progress percentage (0-100).
            message (str): A message describing the agent's current task.
        """
        try:
            self.supabase.table('agent_progress').update({
                'status': status,
                'progress': progress,
                'current_task': message,
                'updated_at': 'now()'
            }).eq('query_id', query_id).eq('agent_name', agent_name).execute()
            
        except Exception as e:
            logger.error(f"Error updating agent progress: {e}")

    async def save_research_results(self, query_id: str, results: Dict[str, Any]) -> None:
        """
        Saves the final compiled research results to the database.
        This includes cleaning and validating the structure of the sources and perspectives
        before insertion to ensure data integrity.
        
        Args:
            query_id (str): The ID of the query to which the results belong.
            results (Dict[str, Any]): The compiled research report data.
            
        Raises:
            Exception: If an error occurs during the database insertion.
        """
        try:
            # Clean the title from summary if needed
            title = results.get('title') or results.get('summary', 'Research Results').split('.')[0]
            if len(title) > 100:
                title = title[:97] + "..."
            
            # Ensure sources have proper structure
            sources = results.get('sources', {'sources': []})
            if isinstance(sources, dict) and 'sources' in sources:
                # Filter out invalid sources
                valid_sources = []
                for source in sources['sources']:
                    if (isinstance(source, dict) and 
                        source.get('title') and 
                        source.get('title').strip() and
                        source.get('title') != 'source'):
                        valid_sources.append(source)
                sources['sources'] = valid_sources
            
            # Ensure perspectives have proper structure
            perspectives = results.get('perspectives', {'perspectives': []})
            if isinstance(perspectives, dict) and 'perspectives' in perspectives:
                # Ensure each perspective has required fields
                valid_perspectives = []
                for p in perspectives['perspectives']:
                    if (isinstance(p, dict) and 
                        p.get('title') and 
                        p.get('viewpoint')):
                        valid_perspectives.append(p)
                perspectives['perspectives'] = valid_perspectives
            
            final_results = {
                'query_id': query_id,
                'title': title,
                'summary': results.get('summary', 'Research completed successfully'),
                'content': {
                    'sections': results.get('sections', [])
                },
                'sources': sources,
                'perspectives': perspectives
            }
            
            # Insert the results
            response = self.supabase.table('research_results').insert(final_results).execute()
            
            if response.data:
                logger.info(f"Successfully saved research results for query {query_id}")
                return
            else:
                logger.error(f"Failed to save research results for query {query_id}")
                
        except Exception as e:
            logger.error(f"Error saving research results: {e}")
            raise

    async def get_agent_progress(self, query_id: str) -> List[Dict[str, Any]]:
        """
        Fetches the current progress for all agents associated with a specific query.
        
        Args:
            query_id (str): The ID of the research query.
        
        Returns:
            List[Dict[str, Any]]: A list of dictionaries, where each dictionary represents
                                  the progress of an agent. Returns an empty list on error.
        """
        try:
            response = self.supabase.table('agent_progress').select('*').eq('query_id', query_id).execute()
            return response.data or []
            
        except Exception as e:
            logger.error(f"Error fetching agent progress: {e}")
            return []
