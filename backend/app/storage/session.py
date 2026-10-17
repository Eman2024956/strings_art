import secrets
from fastapi import Request, Response
from app.config import SESSION_COOKIE_NAME, SESSION_HEADER_NAME

def get_or_create_session_id(request: Request, response: Response) -> str:
    """
    Extract session ID from HttpOnly cookie or custom header.
    If not found, generate a new secure session token and set the cookie.
    """
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        session_id = request.headers.get(SESSION_HEADER_NAME)
        
    if not session_id or len(session_id) < 16:
        session_id = secrets.token_urlsafe(32)
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_id,
            httponly=True,
            samesite="lax",
            secure=False,  # Set to True in production with HTTPS
            max_age=30 * 24 * 3600  # 30 days
        )
        
    return session_id
