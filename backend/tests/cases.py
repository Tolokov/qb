import pytest
from typing import Any
from tests.data import (
    payload_empty,
    payload_simple,
    payload_with_order,
    payload_with_columns,
    payload_with_filter,
    template_simple,
    template_medium,
    template_complex,
    scenario_http_logs,
    scenario_imsi_mts,
    scenario_dsp_auctions,
    scenario_segment_uploads,
    scenario_2gis_directory,
    scenario_cm_mapping,
    scenario_pixel_conversions,
)

SIMPLE_PAYLOADS: list = [
    payload_empty,
    payload_simple,
    payload_with_order,
    payload_with_columns,
    payload_with_filter,
]

TEMPLATE_CASES: list = [
    template_simple,
    template_medium,
    template_complex,
]

SCENARIO_PAYLOAD_CASES: list = [
    scenario_http_logs,
    scenario_imsi_mts,
    scenario_dsp_auctions,
    scenario_segment_uploads,
    scenario_2gis_directory,
    scenario_cm_mapping,
    scenario_pixel_conversions,
]
