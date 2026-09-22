from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, UserRole
from app.schemas.auth import UserRegister, UserLogin, Token
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings

class AuthService:
    async def register_user(self, session: AsyncSession, data: UserRegister) -> User:
        stmt = select(User).where(User.email == data.email)
        result = await session.execute(stmt)
        if result.scalar_one_or_none():
            raise ValueError("An account with this email address already exists.")

        user = User(
            email=data.email,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            role=data.role.value if data.role else UserRole.RESEARCHER.value,
            is_active=True
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    async def authenticate_user(self, session: AsyncSession, data: UserLogin) -> Token:
        stmt = select(User).where(User.email == data.email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.hashed_password):
            raise ValueError("Invalid email or password.")

        if not user.is_active:
            raise ValueError("User account is inactive.")

        access_token = create_access_token(subject=user.id, role=user.role)
        refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    async def refresh_tokens(self, session: AsyncSession, refresh_token: str) -> Token:
        payload = decode_token(refresh_token, is_refresh=True)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid or expired refresh token.")

        user_id = payload.get("sub")
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise ValueError("User not found or inactive.")

        new_access = create_access_token(subject=user.id, role=user.role)
        new_refresh = create_refresh_token(subject=user.id)

        return Token(
            access_token=new_access,
            refresh_token=new_refresh,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

auth_service = AuthService()
