"""Application-specific exceptions."""


class DuplicateIdError(ValueError):
    """Raised when create attempts to insert a row whose id already exists."""
