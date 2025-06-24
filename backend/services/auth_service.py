import os
from supabase import create_client, Client
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class AuthService:
    """
    Service class for handling authentication and Supabase client management.
    This class provides methods to verify JWT tokens, obtain authenticated Supabase clients
    with user context for RLS (Row Level Security), and access the base Supabase client.
    """

    def __init__(self):
        """
        Initialize the AuthService with Supabase project credentials from environment variables.
        Raises:
            ValueError: If SUPABASE_URL or SUPABASE_ANON_KEY is missing in the environment.
        """

        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_anon_key:
            raise ValueError("Missing Supabase configuration")
            
        # Use anon key instead of service role key to respect RLS policies
        self.supabase: Client = create_client(self.supabase_url, self.supabase_anon_key)

    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify a JWT access token and retrieve the associated user information from Supabase.
        Args:
            token (str): The JWT access token to verify.
        Returns:
            Optional[Dict[str, Any]]: A dictionary with user id, email, and user_metadata if valid; otherwise None.
        """

        try:            
            # Get user from the token using Supabase client
            response = self.supabase.auth.get_user(token)
            
            if response.user:
                user_data = {
                    "id": response.user.id,
                    "email": response.user.email,
                    "user_metadata": response.user.user_metadata
                }
                logger.info(f"Successfully verified token for user: {user_data['id']}")
                return user_data
            
            logger.error("Token verification failed - no user found")
            return None
            
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return None

    def get_authenticated_client(self, token: str) -> Client:
        """
        Get a Supabase client instance with the user's auth token set, for RLS-compliant queries.
        Args:
            token (str): The JWT access token to authenticate with.
        Returns:
            Client: A Supabase client with the user's auth context.
        """
        
        logger.info("Creating authenticated Supabase client")
        authenticated_client = create_client(self.supabase_url, self.supabase_anon_key)
        
        # Set the auth token directly in the client headers for RLS compliance
        # This is more reliable than set_session() when we only have the access token
        authenticated_client.auth._headers["Authorization"] = f"Bearer {token}"
        
        # Also set the token in the postgrest client for database operations
        if hasattr(authenticated_client, 'postgrest'):
            authenticated_client.postgrest.auth(token)
        
        logger.info("Authenticated client created successfully")
        return authenticated_client

    def get_supabase_client(self) -> Client:
        """
        Get the base Supabase client without any user authentication context.
        Returns:
            Client: The base Supabase client instance.
        """

        return self.supabase
