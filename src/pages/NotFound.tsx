import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from 'react-helmet-async';

/**
 * NotFound component that is displayed for any routes that are not matched.
 * It shows a standard 404 error message and logs the attempted path for debugging purposes.
 */
const NotFound = () => {
  // Hook to get the current location object, which contains the pathname.
  const location = useLocation();

  /**
   * Effect hook that runs once when the component mounts.
   * It logs an error to the console with the pathname that the user tried to access,
   * which can be helpful for identifying broken links or user navigation issues.
   */
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* Helmet is used to dynamically update the document head, in this case, the page title. */}
      <Helmet>
        <title>Multi Agent Research Assistant | Not Found</title>
      </Helmet>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        {/* A simple link to navigate the user back to the homepage. */}
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
