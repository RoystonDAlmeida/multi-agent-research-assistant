"""
This file defines the Pydantic data models and enumerations used throughout the
multi-agent research application. These models ensure data consistency and provide
validation for API endpoints and internal state management.
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class ResearchDepth(str, Enum):
    """Defines the possible levels of depth for a research query."""
    
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class ResearchFormat(str, Enum):
    """Defines the possible output formats for the final research report."""
    
    MARKDOWN = "markdown"
    PDF = "pdf"
    PRESENTATION = "presentation"

class ResearchStatus(str, Enum):
    """Defines the possible states of the overall research process from start to finish."""
    
    WAITING = "waiting"
    INITIALIZING = "initializing"
    WEB_RESEARCH = "web-research"
    OUTLINE_PLANNING = "outline_planning"
    PARALLEL_RESEARCH = "parallel_research"
    REVIEW_REVISION = "review_revision"
    COMPILATION = "compilation"
    COMPLETED = "completed"
    ERROR = "error"

class AgentStatus(str, Enum):
    """Defines the possible states for an individual agent during the research process."""
    
    WAITING = "waiting"
    ACTIVE = "active"
    COMPLETED = "completed"
    ERROR = "error"

class ResearchQuery(BaseModel):
    """Represents a single research query submitted by a user.
    
    This model captures all the parameters specified by the user to guide the
    research process.

    Attributes:
        id (str): The unique identifier for the research query.
        user_id (str): The ID of the user who submitted the query.
        topic (str): The main topic or question for the research.
        depth (ResearchDepth): The desired level of detail for the research.
        perspectives (List[str]): A list of viewpoints to consider in the research.
        format (ResearchFormat): The desired output format for the final report.
        sources (List[str]): A list of preferred source types (e.g., 'Academic Papers').
        timeframe (Optional[str]): The historical time frame for the research (e.g., 'Last 5 years').
        status (ResearchStatus): The current status of the research query.
    """

    id: str
    user_id: str
    topic: str
    depth: ResearchDepth
    perspectives: List[str]
    format: ResearchFormat
    sources: List[str]
    timeframe: Optional[str]
    status: ResearchStatus

class AgentProgress(BaseModel):
    """Represents the real-time progress of a single agent working on a research query.

    Attributes:
        agent_name (str): The name of the agent.
        status (AgentStatus): The current status of the agent.
        progress (int): The completion percentage of the agent's current task (0-100).
        current_task (str): A description of the task the agent is currently performing.
    """

    agent_name: str
    status: AgentStatus
    progress: int
    current_task: str

class ResearchRequest(BaseModel):
    """Defines the expected structure for an incoming request to start a research process.

    Attributes:
        queryId (str): The ID of the research query to be processed.
    """

    queryId: str

class ResearchResponse(BaseModel):
    """Defines the structure of the standard response sent back after initiating a research task.

    Attributes:
        message (str): A human-readable message indicating the result of the request.
        queryId (str): The ID of the research query that was initiated.
        status (str): The current status of the query after initiation.
        langsmithEnabled (bool): A flag indicating if Langsmith tracing is enabled for this run.
    """

    message: str
    queryId: str
    status: str
    langsmithEnabled: bool

class ResearchState(BaseModel):
    """
    Represents the complete state of a research task as it progresses through the pipeline.
    This object is passed between different stages of the research process and contains
    all intermediate and final results.

    Attributes:
        query (Dict[str, Any]): The initial research query details.
        web_search_results (List[Dict[str, Any]]): A list of results from the web search phase.
        outline (Dict[str, Any]): The structured outline for the final report.
        section_drafts (List[Dict[str, Any]]): A list of drafted sections based on the outline.
        reviewed_sections (List[Dict[str, Any]]): A list of sections that have been reviewed and revised.
        final_report (Dict[str, Any]): The compiled and finalized research report.
        current_step (str): The key of the current step in the research process state machine.
        agent_progress (Dict[str, Any]): A dictionary tracking the progress of individual agents.
    """

    query: Dict[str, Any]
    web_search_results: List[Dict[str, Any]] = []
    outline: Dict[str, Any] = {}
    section_drafts: List[Dict[str, Any]] = []
    reviewed_sections: List[Dict[str, Any]] = []
    final_report: Dict[str, Any] = {}
    current_step: str = "web_research"
    agent_progress: Dict[str, Any] = {}