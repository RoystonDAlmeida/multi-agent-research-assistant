from langgraph.graph import StateGraph, END
import logging

from .auth_service import AuthService
from .database_service import DatabaseService
from .gemini_service import GeminiService
from .web_search_service import WebSearchService
from .content_service import ContentService
from models.research_models import ResearchState

logger = logging.getLogger(__name__)

class ResearchWorkflow:
    """
    Orchestrates the entire multi-agent research process using a state graph.
    This class initializes all necessary services, defines the sequence of agentic
    steps, and executes the workflow for a given research query.
    """
    def __init__(self, auth_token: str, user_id: str):
        """
        Initializes the ResearchWorkflow with user-specific authentication context.

        Args:
            auth_token (str): The JWT token for the authenticated user.
            user_id (str): The ID of the authenticated user.
        """
        # Initialize services with authenticated context
        self.auth_service = AuthService()
        self.auth_token = auth_token
        self.user_id = user_id
        
        # Get an authenticated Supabase client that respects Row-Level Security (RLS)
        authenticated_supabase = self.auth_service.get_authenticated_client(auth_token)
        self.database = DatabaseService(authenticated_supabase, user_id, auth_token)
        
        # Initialize other core services
        self.gemini = GeminiService()
        self.web_search = WebSearchService()
        self.content = ContentService(self.gemini)
        
    def create_workflow_graph(self):
        """
        Creates and compiles the research workflow using LangGraph's StateGraph.
        This defines the nodes (agents) and edges (transitions) of the research process.

        Returns:
            A compiled LangGraph object ready for execution.
        """
        workflow = StateGraph(ResearchState)

        # Add nodes for each agent in the workflow
        workflow.add_node("browser_agent", self.browser_agent)
        workflow.add_node("editor_agent", self.editor_agent)
        workflow.add_node("researcher_agent", self.researcher_agent)
        workflow.add_node("reviewer_agent", self.reviewer_agent)
        workflow.add_node("writer_agent", self.writer_agent)
        workflow.add_node("publisher_agent", self.publisher_agent)

        # Define the linear sequence of the workflow from one agent to the next
        workflow.add_edge("browser_agent", "editor_agent")
        workflow.add_edge("editor_agent", "researcher_agent")
        workflow.add_edge("researcher_agent", "reviewer_agent")
        workflow.add_edge("reviewer_agent", "writer_agent")
        workflow.add_edge("writer_agent", "publisher_agent")
        workflow.add_edge("publisher_agent", END)

        # Set the entry point for the graph
        workflow.set_entry_point("browser_agent")

        return workflow.compile()

    async def browser_agent(self, state: ResearchState) -> ResearchState:
        """
        The first agent in the workflow, responsible for performing initial web searches.

        Args:
            state (ResearchState): The current state of the workflow.

        Returns:
            ResearchState: The updated state with web search results.
        """
        logger.info("🔍 Browser Agent: Starting web research...")
        
        query_id = state.query["id"]
        topic = state.query["topic"]
        
        await self.database.update_agent_progress(
            query_id, "Web Research Agent", "active", 25, "Searching web sources..."
        )

        try:
            search_results = await self.web_search.perform_web_search(topic)
            state.web_search_results = search_results
            state.current_step = "outline_planning"

            await self.database.update_agent_progress(
                query_id, "Web Research Agent", "completed", 100, "Web research completed"
            )
            
            return state
            
        except Exception as e:
            logger.error(f"Browser Agent error: {e}")
            await self.database.update_agent_progress(
                query_id, "Web Research Agent", "error", 0, "Web research failed"
            )
            raise

    async def editor_agent(self, state: ResearchState) -> ResearchState:
        """
        The second agent, responsible for creating a research outline from the web search results.

        Args:
            state (ResearchState): The current state of the workflow.

        Returns:
            ResearchState: The updated state with a generated outline.
        """
        logger.info("📝 Editor Agent: Creating research outline...")
        
        query_id = state.query["id"]
        
        await self.database.update_agent_progress(
            query_id, "Editor Agent", "active", 50, "Creating research outline..."
        )

        try:
            outline = await self.content.create_outline(state.query, state.web_search_results)
            state.outline = outline
            state.current_step = "parallel_research"

            await self.database.update_agent_progress(
                query_id, "Editor Agent", "completed", 100, "Outline created"
            )
            
            return state
            
        except Exception as e:
            logger.error(f"Editor Agent error: {e}")
            await self.database.update_agent_progress(
                query_id, "Editor Agent", "error", 0, "Outline creation failed"
            )
            raise

    async def researcher_agent(self, state: ResearchState) -> ResearchState:
        """
        The third agent, responsible for conducting in-depth research and drafting content for each section.

        Args:
            state (ResearchState): The current state of the workflow.

        Returns:
            ResearchState: The updated state with drafted sections.
        """
        logger.info("🔬 Researcher Agent: Conducting in-depth research...")
        
        query_id = state.query["id"]
        
        await self.database.update_agent_progress(
            query_id, "Academic Research Agent", "active", 60, "Researching sections in parallel..."
        )

        try:
            section_drafts = await self.content.research_sections(
                state.outline["sections"], state.query, state.web_search_results
            )
            state.section_drafts = section_drafts
            state.current_step = "review_revision"

            await self.database.update_agent_progress(
                query_id, "Academic Research Agent", "completed", 100, "In-depth research completed"
            )
            
            return state
            
        except Exception as e:
            logger.error(f"Researcher Agent error: {e}")
            await self.database.update_agent_progress(
                query_id, "Academic Research Agent", "error", 0, "Research failed"
            )
            raise

    async def reviewer_agent(self, state: ResearchState) -> ResearchState:
        """
        The fourth agent, responsible for reviewing, fact-checking, and revising the drafted content.

        Args:
            state (ResearchState): The current state of the workflow.

        Returns:
            ResearchState: The updated state with reviewed and revised sections.
        """
        logger.info("✅ Reviewer Agent: Reviewing and fact-checking...")
        
        query_id = state.query["id"]
        
        await self.database.update_agent_progress(
            query_id, "Fact Checker Agent", "active", 75, "Fact-checking and reviewing content..."
        )

        try:
            reviewed_sections = await self.content.review_and_revise(state.section_drafts)
            state.reviewed_sections = reviewed_sections
            state.current_step = "compilation"

            await self.database.update_agent_progress(
                query_id, "Fact Checker Agent", "completed", 100, "Review and fact-checking completed"
            )
            
            return state
            
        except Exception as e:
            logger.error(f"Reviewer Agent error: {e}")
            await self.database.update_agent_progress(
                query_id, "Fact Checker Agent", "error", 0, "Review failed"
            )
            raise

    async def writer_agent(self, state: ResearchState) -> ResearchState:
        """
        The fifth agent, responsible for synthesizing all reviewed content into a final report.

        Args:
            state (ResearchState): The current state of the workflow.

        Returns:
            ResearchState: The updated state with the compiled final report.
        """
        logger.info("✍️ Writer Agent: Compiling final report...")
        
        query_id = state.query["id"]
        
        await self.database.update_agent_progress(
            query_id, "Synthesis Agent", "active", 90, "Compiling final report..."
        )

        try:
            final_report = await self.content.compile_report(
                state.query, state.reviewed_sections, state.outline, state.web_search_results
            )
            state.final_report = final_report
            state.current_step = "publication"

            await self.database.update_agent_progress(
                query_id, "Synthesis Agent", "completed", 100, "Report compilation completed"
            )
            
            return state
            
        except Exception as e:
            logger.error(f"Writer Agent error: {e}")
            await self.database.update_agent_progress(
                query_id, "Synthesis Agent", "error", 0, "Report compilation failed"
            )
            raise

    async def publisher_agent(self, state: ResearchState) -> ResearchState:
        """
        The final agent, responsible for saving the completed report to the database.

        Args:
            state (ResearchState): The current state of the workflow.

        Returns:
            ResearchState: The final state of the workflow.
        """
        logger.info("📄 Publisher Agent: Publishing final report...")
        
        query_id = state.query["id"]

        try:
            await self.database.save_research_results(query_id, state.final_report)
            state.current_step = "completed"
            
            return state
            
        except Exception as e:
            logger.error(f"Publisher Agent error: {e}")
            raise

    async def execute_workflow(self, query_id: str) -> None:
        """
        Executes the entire research workflow for a given query ID.
        This is the main entry point for running a research task. It handles
        authentication, state initialization, graph execution, and final status updates.

        Args:
            query_id (str): The ID of the research query to execute.

        Raises:
            ValueError: If the auth token is invalid or the query cannot be found.
            Exception: If any other error occurs during workflow execution.
        """
        try:
            logger.info(f"Starting workflow execution for query: {query_id}, user: {self.user_id}")
            
            # Verify the user's authentication token to ensure it's valid.
            user_info = await self.auth_service.verify_token(self.auth_token)
            if not user_info or 'id' not in user_info:
                logger.error("❌ Invalid or missing user ID in auth token.")
                raise ValueError("Invalid auth token")
            
            logger.info(f"User verification successful: {user_info['id']}")
            
            # Security check to ensure the user ID from the token matches the provided user ID.
            if user_info['id'] != self.user_id:
                logger.error(f"❌ User ID mismatch: token={user_info['id']}, expected={self.user_id}")
                raise ValueError("User ID mismatch")

            # Fetch query from the database. RLS ensures the user owns this query.
            logger.info(f"Fetching query {query_id} from database...")
            query_data = await self.database.get_research_query(query_id)

            if not query_data:
                logger.error(f"❌ Research query {query_id} not found or access denied for user {self.user_id}")
                raise ValueError(f"Research query {query_id} not found or access denied.")
            
            logger.info(f"✅ Successfully fetched query data: {query_data}")
            
            # Initialize the state for the LangGraph workflow.
            initial_state = ResearchState(
                query=query_data,
                web_search_results=[],
                outline={},
                section_drafts=[],
                reviewed_sections=[],
                final_report={},
                current_step="web_research",
                agent_progress={}
            )

            # Create initial agent progress entries in the database.
            await self.database.initialize_agents(query_id)
            
            # Update the overall query status to 'initializing'.
            await self.database.update_query_status(query_id, "initializing")

            # Create and compile the workflow graph.
            graph = self.create_workflow_graph()
            
            logger.info(f"Starting LangGraph workflow for query: {query_id}")
            
            # Asynchronously execute the workflow.
            final_state = await graph.ainvoke(initial_state.dict())
            
            # Set the final status of the query to 'completed'.
            await self.database.update_query_status(query_id, "completed")
            
            logger.info("🎉 LangGraph workflow completed successfully")
            
        except Exception as e:
            logger.error(f"❌ LangGraph workflow failed: {e}")
            try:
                # If the workflow fails, attempt to reset the query status to 'waiting'.
                await self.database.update_query_status(query_id, "waiting")
            except Exception as update_error:
                logger.error(f"❌ Failed to update query status to waiting: {update_error}")
            raise
