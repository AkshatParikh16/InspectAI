class InspectAIError(Exception):
    """Base exception for all InspectAI errors."""


class LLMCallError(InspectAIError):
    """Raised when an LLM API call fails."""


class DatabaseError(InspectAIError):
    """Raised when a database operation fails."""


class ValidationError(InspectAIError):
    """Raised when input or output validation fails."""


class TimeoutError(InspectAIError):
    """Raised when an operation exceeds its time limit."""


class RateLimitError(InspectAIError):
    """Raised when an API rate limit is exceeded."""
