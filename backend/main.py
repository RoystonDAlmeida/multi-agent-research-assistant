"""
Main entry point for the Research Agent Backend FastAPI application.

This module initializes and configures the FastAPI application, including:
- Setting up middleware for CORS.
- Defining security schemes and authentication dependencies.
- Establishing API endpoints for triggering research workflows.
- Running the application using Uvicorn.
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
import asyncio
from pydantic import BaseModel
import logging

from services.auth_service import AuthService
from services.research_workflow import ResearchWorkflow
from models.research_models import ResearchRequest, ResearchResponse

# --- Pre-computation and Setup ---

# Load environment variables from .env file
load_dotenv()

# Configure logging for the application
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# --- FastAPI App Initialization ---

# Initialize FastAPI app with metadata
def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application instance.
    Returns:
        FastAPI: The configured FastAPI app.
    """
    app = FastAPI(title="Research Agent Backend", version="1.0.0")
    return app

app = create_app()

# --- Middleware Configuration ---

# Add CORS (Cross-Origin Resource Sharing) middleware to allow the frontend
# to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Authentication and Security ---

# Security scheme for HTTP Bearer authentication
security = HTTPBearer()

# Initialize authentication service
auth_service = AuthService()

class ResearchRequestModel(BaseModel):
    """
    Pydantic model for incoming research workflow requests.
    Ensures that the request body has the expected structure.
    """
    queryId: str

# Dependency for authenticating requests and retrieving user information
async def get_current_user_and_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to verify JWT token with Supabase and return both user and token.

    Args:
        credentials (HTTPAuthorizationCredentials): Bearer token credentials from the request.

    Returns:
        tuple: (user dict, access token string)

    Raises:
        HTTPException: If authentication fails.
    """

    try:
        logger.info("Verifying authentication token...")
        # Use the auth_service to validate the provided token
        user = await auth_service.verify_token(credentials.credentials)
        if not user:
            logger.error("Token verification failed - invalid credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"Token verification successful for user: {user['id']}")
        # Return both user information and the original token
        return user, credentials.credentials
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- API Endpoints ---

@app.post("/api/research-agent", response_model=ResearchResponse)
async def start_research_workflow(
    request: ResearchRequestModel,
    user_and_token = Depends(get_current_user_and_token)
):
    """
    Endpoint to start the LangGraph research workflow with RLS-compliant authentication.

    This endpoint is asynchronous and initiates the research process in the background.

    Args:
        request (ResearchRequestModel): The research query request payload.
        user_and_token (tuple): Tuple containing user info and access token.

    Returns:
        ResearchResponse: Status message and query info.

    Raises:
        HTTPException: If the workflow fails to start.
    """

    try:
        # Extract user and token from the dependency result
        user, auth_token = user_and_token
        logger.info(f"Starting research workflow for query: {request.queryId} by user: {user['id']}")
        
        # Initialize the research workflow with the user's auth token for secure,
        # RLS-compliant data access.
        workflow = ResearchWorkflow(auth_token, user_id=user['id'])
        
        # Start the workflow asynchronously (fire and forget). This allows the API
        # to return a response immediately without waiting for the workflow to complete.
        asyncio.create_task(workflow.execute_workflow(request.queryId))
        
        # Return a response indicating the workflow has started
        return ResearchResponse(
            message="LangGraph research workflow started successfully",
            queryId=request.queryId,
            status="success",
            langsmithEnabled=bool(os.getenv("LANGCHAIN_API_KEY"))
        )
        
    except Exception as e:
        logger.error(f"Error starting research workflow: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start research workflow: {str(e)}"
        )

# --- Application Runner ---

if __name__ == "__main__":
    import uvicorn
    # Get port from environment variables, defaulting to 8000
    port = int(os.getenv("PORT", 8000))
    # Run the FastAPI app with Uvicorn, a lightning-fast ASGI server
    uvicorn.run(app, host="0.0.0.0", port=port)
