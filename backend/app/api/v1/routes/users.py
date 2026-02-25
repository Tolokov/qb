from fastapi import APIRouter, Depends, status

from app.api.v1.schemas.crud import UserCreate, UserResponse, UserUpdate
from app.dependencies import get_crud_service
from app.services.crud_service import CrudService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserResponse], summary="List users")
def list_users(service: CrudService = Depends(get_crud_service)) -> list[UserResponse]:
    return service.list("users", UserResponse)


@router.get("/{id_value}", response_model=UserResponse, summary="Get user by id")
def get_user(id_value: int, service: CrudService = Depends(get_crud_service)) -> UserResponse:
    return service.get("users", id_value, UserResponse, "User not found")


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create user")
def create_user(body: UserCreate, service: CrudService = Depends(get_crud_service)) -> UserResponse:
    return service.create("users", body, UserResponse)


@router.put("/{id_value}", response_model=UserResponse, summary="Update user")
def update_user(
    id_value: int, body: UserUpdate, service: CrudService = Depends(get_crud_service)
) -> UserResponse:
    return service.update("users", id_value, body, UserResponse, "User not found", ("created_at",))


@router.delete("/{id_value}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete user")
def delete_user(id_value: int, service: CrudService = Depends(get_crud_service)) -> None:
    service.delete("users", id_value, "User not found")
