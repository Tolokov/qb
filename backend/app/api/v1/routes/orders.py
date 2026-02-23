from fastapi import APIRouter, Depends

from app.api.v1.schemas.crud import OrderCreate, OrderResponse, OrderUpdate
from app.dependencies import get_crud_service
from app.services.crud_service import CrudService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=list[OrderResponse], summary="List orders")
def list_orders(service: CrudService = Depends(get_crud_service)) -> list[OrderResponse]:
    return service.list_orders()


@router.get("/{id_value}", response_model=OrderResponse, summary="Get order by id")
def get_order(id_value: int, service: CrudService = Depends(get_crud_service)) -> OrderResponse:
    return service.get_order(id_value)


@router.post("", response_model=OrderResponse, status_code=201, summary="Create order")
def create_order(body: OrderCreate, service: CrudService = Depends(get_crud_service)) -> OrderResponse:
    return service.create_order(body)


@router.put("/{id_value}", response_model=OrderResponse, summary="Update order")
def update_order(
    id_value: int, body: OrderUpdate, service: CrudService = Depends(get_crud_service)
) -> OrderResponse:
    return service.update_order(id_value, body)


@router.delete("/{id_value}", status_code=204, summary="Delete order")
def delete_order(id_value: int, service: CrudService = Depends(get_crud_service)) -> None:
    service.delete_order(id_value)
