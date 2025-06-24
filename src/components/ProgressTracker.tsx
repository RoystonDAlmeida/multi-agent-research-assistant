import { useEffect, useState } from 'react';
import { Clock, CheckCircle, Brain, Search, FileText, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

/**
 * Props for the ProgressTracker component.
 * @param currentState The current status of the research process (e.g., 'researching', 'completed').
 * @param query The full query object, containing details like topic and ID.
 */
interface ProgressTrackerProps {
  currentState: string;
  query?: any;
}

/**
 * ProgressTracker is a detailed component that visualizes the step-by-step progress
 * of an AI research task. It shows the overall progress, the status of individual
 * research stages, and real-time updates from the backend agents. It also handles
 * displaying completion and error states.
 */
const ProgressTracker = ({ currentState, query }: ProgressTrackerProps) => {
  // Hook to fetch real-time progress updates for individual agents.
  const agentProgress = useRealtimeProgress(query?.id);
  // State to track the current step of the research process, initialized from props.
  const [currentStep, setCurrentStep] = useState(currentState);
  // State to record the timestamp of the last status update for display.
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const navigate = useNavigate();

  /**
   * Effect hook to synchronize the component's `currentStep` state with the `query.status`
   * from props. This ensures the tracker updates if the parent component passes a new status.
   */
  useEffect(() => {
    if (query?.status && query.status !== currentStep) {
      setCurrentStep(query.status);
      setLastUpdate(Date.now());
    }
  }, [query?.status, currentStep]);

  // Checks if any agent has reported an error.
  const errorAgent = agentProgress.find(agent => agent.status === 'error');

  // If an error is found, display a specific error card and halt further rendering.
  if (errorAgent) {
    return (
      <Card className="mb-8 border-red-400">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Research Paused Due to Error
            </h3>
            <p className="text-red-600 font-medium">
              <span className="font-bold">{errorAgent.name}</span> failed: {errorAgent.currentTask || 'Unknown error'}
            </p>
            <p className="text-gray-600 mt-2">
              Please try again or contact support if the issue persists.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Determines the status of a given step ('completed', 'active', 'waiting')
   * by comparing its index to the index of the current step.
   * @param step The key of the step to check (e.g., 'researching').
   * @returns The status of the step.
   */
  const getStepStatus = (step: string) => {
    const states = ['waiting', 'initializing', 'researching', 'analyzing', 'fact_checking', 'completed'];
    const currentIndex = states.indexOf(currentStep);
    const stepIndex = states.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'waiting';
  };

  /**
   * Selects an appropriate icon for a step based on its status.
   * @param step The key of the step.
   * @param status The current status of the step ('completed', 'active', 'waiting').
   * @returns A Lucide React icon component.
   */
  const getStepIcon = (step: string, status: string) => {
    const iconProps = { className: "w-5 h-5" };
    
    if (status === 'completed') {
      return <CheckCircle {...iconProps} className="w-5 h-5 text-green-600" />;
    }
    
    if (status === 'active') {
      return <Clock {...iconProps} className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    
    const icons = {
      'initializing': <Brain {...iconProps} className="w-5 h-5 text-gray-400" />,
      'researching': <Search {...iconProps} className="w-5 h-5 text-gray-400" />,
      'analyzing': <FileText {...iconProps} className="w-5 h-5 text-gray-400" />,
      'fact_checking': <Shield {...iconProps} className="w-5 h-5 text-gray-400" />,
    };
    
    return icons[step as keyof typeof icons] || <Clock {...iconProps} className="w-5 h-5 text-gray-400" />;
  };

  // Defines the sequential steps of the research process.
  const steps = [
    { 
      key: 'initializing', 
      title: 'Initializing AI Agents', 
      description: 'Setting up specialized research agents' 
    },
    { 
      key: 'researching', 
      title: 'Research Phase', 
      description: 'Gathering information from multiple sources' 
    },
    { 
      key: 'analyzing', 
      title: 'Analysis Phase', 
      description: 'Processing and synthesizing findings' 
    },
    { 
      key: 'fact_checking', 
      title: 'Fact Checking', 
      description: 'Verifying accuracy and reliability' 
    },
  ];

  /**
   * Calculates the overall progress percentage based on the current step's position
   * in the predefined sequence of states.
   * @returns A number between 0 and 100.
   */
  const getOverallProgress = () => {
    const states = ['waiting', 'initializing', 'researching', 'analyzing', 'fact_checking', 'completed'];
    const currentIndex = states.indexOf(currentStep);
    return Math.max(0, Math.min(100, (currentIndex / (states.length - 1)) * 100));
  };

  // Renders a completion card if the research is finished.
  if (currentStep === 'completed') {
    return (
      <Card className="mb-8 border-green-400">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Research Complete!
            </h3>
            <p className="text-green-600">
              Your comprehensive research is ready to view.
            </p>
            {query?.id && (
              <button
                className="mt-6 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold text-base"
                onClick={() => navigate(`/results?id=${query.id}`)}
                aria-label="View Research Results"
              >
                View Research Results
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main render output for when research is in progress.
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              AI Research in Progress
            </h3>
            {query && (
              <p className="text-sm text-gray-600 mb-4">
                Researching: <span className="font-medium">{query.topic}</span>
              </p>
            )}
            
            {/* Overall Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(getOverallProgress())}%</span>
              </div>
              <Progress value={getOverallProgress()} className="h-2" />
            </div>
          </div>
          
          {/* Step-by-step progress visualization */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.key);
              return (
                <div key={step.key} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStepIcon(step.key, status)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium ${
                        status === 'completed' ? 'text-green-700' : 
                        status === 'active' ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </h4>
                      {status === 'active' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">
                          Processing...
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Complete
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Agent-specific real-time progress section */}
          {agentProgress.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Agent Activity</h4>
              <div className="space-y-2">
                {agentProgress.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{agent.name}</span>
                    <div className="flex items-center space-x-2">
                      {agent.status === 'active' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                      {agent.status === 'completed' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                      {agent.status === 'error' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      <span className={`capitalize ${
                        agent.status === 'active' ? 'text-blue-600' :
                        agent.status === 'completed' ? 'text-green-600' :
                        agent.status === 'error' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Informational footer with last update time */}
          {currentStep !== 'completed' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-sm text-blue-700 font-medium">
                  Please wait while our AI agents complete the research...
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Last updated: {new Date(lastUpdate).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
