from fastapi import APIRouter, Depends, status

from app.api.v1.schemas.crud import OrderCreate, OrderResponse, OrderUpdate
from app.dependencies import get_crud_service
from app.services.crud_service import CrudService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=list[OrderResponse], summary="List orders")
def list_orders(service: CrudService = Depends(get_crud_service)) -> list[OrderResponse]:
    return service.list("orders", OrderResponse)


@router.get("/{id_value}", response_model=OrderResponse, summary="Get order by id")
def get_order(id_value: int, service: CrudService = Depends(get_crud_service)) -> OrderResponse:
    return service.get("orders", id_value, OrderResponse, "Order not found")


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, summary="Create order")
def create_order(body: OrderCreate, service: CrudService = Depends(get_crud_service)) -> OrderResponse:
    return service.create("orders", body, OrderResponse)


@router.put("/{id_value}", response_model=OrderResponse, summary="Update order")
def update_order(
    id_value: int, body: OrderUpdate, service: CrudService = Depends(get_crud_service)
) -> OrderResponse:
    return service.update("orders", id_value, body, OrderResponse, "Order not found")


@router.delete("/{id_value}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete order")
def delete_order(id_value: int, service: CrudService = Depends(get_crud_service)) -> None:
    service.delete("orders", id_value, "Order not found")
