from fastapi import APIRouter, Depends, status

from app.api.v1.schemas.crud import ProductCreate, ProductResponse, ProductUpdate
from app.dependencies import get_crud_service
from app.services.crud_service import CrudService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=list[ProductResponse], summary="List products")
def list_products(service: CrudService = Depends(get_crud_service)) -> list[ProductResponse]:
    return service.list("products", ProductResponse)


@router.get("/{id_value}", response_model=ProductResponse, summary="Get product by id")
def get_product(id_value: int, service: CrudService = Depends(get_crud_service)) -> ProductResponse:
    return service.get("products", id_value, ProductResponse, "Product not found")


@router.post(
    "", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, summary="Create product"
)
def create_product(body: ProductCreate, service: CrudService = Depends(get_crud_service)) -> ProductResponse:
    return service.create("products", body, ProductResponse)


@router.put("/{id_value}", response_model=ProductResponse, summary="Update product")
def update_product(
    id_value: int, body: ProductUpdate, service: CrudService = Depends(get_crud_service)
) -> ProductResponse:
    return service.update("products", id_value, body, ProductResponse, "Product not found", ("created_at",))


@router.delete("/{id_value}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete product")
def delete_product(id_value: int, service: CrudService = Depends(get_crud_service)) -> None:
    service.delete("products", id_value, "Product not found")
