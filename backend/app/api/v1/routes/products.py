from fastapi import APIRouter, Depends

from app.api.v1.schemas.crud import ProductCreate, ProductResponse, ProductUpdate
from app.dependencies import get_crud_service
from app.services.crud_service import CrudService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=list[ProductResponse], summary="List products")
def list_products(service: CrudService = Depends(get_crud_service)) -> list[ProductResponse]:
    return service.list_products()


@router.get("/{id_value}", response_model=ProductResponse, summary="Get product by id")
def get_product(id_value: int, service: CrudService = Depends(get_crud_service)) -> ProductResponse:
    return service.get_product(id_value)


@router.post("", response_model=ProductResponse, status_code=201, summary="Create product")
def create_product(
    body: ProductCreate, service: CrudService = Depends(get_crud_service)
) -> ProductResponse:
    return service.create_product(body)


@router.put("/{id_value}", response_model=ProductResponse, summary="Update product")
def update_product(
    id_value: int, body: ProductUpdate, service: CrudService = Depends(get_crud_service)
) -> ProductResponse:
    return service.update_product(id_value, body)


@router.delete("/{id_value}", status_code=204, summary="Delete product")
def delete_product(id_value: int, service: CrudService = Depends(get_crud_service)) -> None:
    service.delete_product(id_value)
