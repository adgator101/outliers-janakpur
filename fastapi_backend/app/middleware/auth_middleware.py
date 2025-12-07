from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.utils.jwt_utils import decode_access_token

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_access_token(token)
            if payload:
                # Attach decoded payload to request
                request.state.user = payload
            else:
                return JSONResponse(
                    {"detail": "Invalid or expired token"},
                    status_code=401
                )
        else:
            # No token found
            request.state.user = None

        response = await call_next(request)
        return response
