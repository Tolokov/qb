import json

import pytest

from tests.cases import query_to_spark


@pytest.mark.parametrize(
    "client_query,response",
    query_to_spark,
)
def test_compile_query_to_spark(mock_repository, client_query, response):
    result = mock_repository.execute(json.loads(client_query))
    assert result == response
