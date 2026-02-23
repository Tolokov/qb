from fastapi import APIRouter, Depends

from app.api.v1.schemas.crud import UserCreate, UserResponse, UserUpdate
from app.dependencies import get_crud_service
from app.services.crud_service import CrudService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserResponse], summary="List users")
def list_users(service: CrudService = Depends(get_crud_service)) -> list[UserResponse]:
    return service.list_users()


@router.get("/{id_value}", response_model=UserResponse, summary="Get user by id")
def get_user(id_value: int, service: CrudService = Depends(get_crud_service)) -> UserResponse:
    return service.get_user(id_value)


@router.post("", response_model=UserResponse, status_code=201, summary="Create user")
def create_user(body: UserCreate, service: CrudService = Depends(get_crud_service)) -> UserResponse:
    return service.create_user(body)


@router.put("/{id_value}", response_model=UserResponse, summary="Update user")
def update_user(
    id_value: int, body: UserUpdate, service: CrudService = Depends(get_crud_service)
) -> UserResponse:
    return service.update_user(id_value, body)


@router.delete("/{id_value}", status_code=204, summary="Delete user")
def delete_user(id_value: int, service: CrudService = Depends(get_crud_service)) -> None:
    service.delete_user(id_value)
