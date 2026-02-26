from typing import Any

# Simple payloads
payload_empty = {}
payload_simple = {
    "from": "users",
    "select": ["*"],
}
payload_with_order = {
    "from": "table",
    "select": ["*"],
    "orderBy": [{"column": "id", "direction": "ASC"}],
}
payload_with_columns = {
    "from": "users",
    "select": ["id", "name", "age"],
}
payload_with_filter = {
    "from": "users",
    "select": ["id", "name"],
    "where": [{"column": "active", "op": "eq", "value": True}],
}

# Templates
template_simple = {
    "from": ["users"],
    "select": ["*"],
    "limit": 10,
}
template_medium = {
    "from": ["orders"],
    "select": ["*"],
    "limit": 10,
    "subqueries": [
        {
            "alias": "sub",
            "query": {
                "from": ["products"],
                "select": ["*"],
                "where": {
                    "column": "id",
                    "operator": ">",
                    "value": 0,
                },
            },
        },
    ],
}
template_complex = {
    "from": ["users"],
    "select": ["id", "name"],
    "where": {
        "operator": "AND",
        "conditions": [
            {
                "column": "id",
                "operator": ">=",
                "value": 10,
            },
            {
                "column": "name",
                "operator": "LIKE",
                "value": "%",
            },
        ],
    },
    "orderBy": [
        {"column": "id", "direction": "DESC"},
        {"column": "name", "direction": "ASC"},
    ],
    "limit": 10,
    "subqueries": [
        {
            "alias": "ord",
            "query": {
                "from": ["orders"],
                "select": [
                    {
                        "column": "id",
                        "alias": "ord_id",
                    },
                ],
                "where": {
                    "column": "completed",
                    "operator": "=",
                    "value": True,
                },
                "subqueries": [
                    {
                        "alias": "items",
                        "query": {
                            "from": ["order_items"],
                            "select": ["order_id"],
                            "where": {
                                "column": "quantity",
                                "operator": ">",
                                "value": 0,
                            },
                        },
                    },
                ],
            },
        },
        {
            "alias": "prod",
            "query": {
                "from": ["products"],
                "select": [
                    {
                        "column": "name",
                        "alias": "prod_name",
                    },
                ],
            },
        },
        {
            "alias": "cat",
            "query": {
                "from": ["categories"],
                "select": [
                    {
                        "column": "id",
                        "alias": "cat_id",
                    },
                    {
                        "column": "name",
                        "alias": "cat_name",
                    },
                ],
            },
        },
    ],
}

# Scenarios
scenario_http_logs = {
    "from": ["prd_advert_ods.http_cyrillic"],
    "select": ["request_id", "url", "user_agent", "request_ts"],
    "limit": 10,
}
scenario_imsi_mts = {
    "from": ["prd_advert_ods.imsi_x_msisdn_actual"],
    "select": ["imsi", "msisdn", "operator", "updated_at"],
    "where": {
        "operator": "AND",
        "conditions": [
            {
                "column": "operator",
                "operator": "=",
                "value": "МТС",
            },
            {
                "column": "is_active",
                "operator": "=",
                "value": True,
            },
        ],
    },
    "orderBy": [
        {"column": "updated_at", "direction": "DESC"},
    ],
    "limit": 100,
}
scenario_dsp_auctions = {
    "from": ["prd_advert_ods.dsp_events"],
    "select": ["event_id", "user_id", "event_ts", "bid_price", "is_viewable"],
    "where": {
        "column": "bid_price",
        "operator": "BETWEEN",
        "valueLow": 0.05,
        "valueHigh": 9.9999,
    },
    "orderBy": [
        {"column": "bid_price", "direction": "DESC"},
    ],
    "limit": 50,
}
scenario_segment_uploads = {
    "from": ["prd_advert_ods.sgm_upload_dsp_segment"],
    "select": ["upload_id", "segment_id", "msisdn", "upload_ts", "status"],
    "where": {
        "column": "status",
        "operator": "IN",
        "value": "success,failed",
    },
    "orderBy": [
        {"column": "upload_ts", "direction": "DESC"},
    ],
    "limit": 200,
}
scenario_2gis_directory = {
    "from": ["prd_advert_dict.v_catalog_2gis_phones"],
    "select": ["phone_id", "phone_number", "rubric", "city"],
    "where": {
        "operator": "OR",
        "conditions": [
            {
                "column": "city",
                "operator": "=",
                "value": "Москва",
            },
            {
                "column": "city",
                "operator": "=",
                "value": "Санкт-Петербург",
            },
        ],
    },
    "orderBy": [
        {"column": "rubric", "direction": "ASC"},
    ],
    "limit": 100,
}
scenario_cm_mapping = {
    "from": ["prd_advert_ods.cm_id_msisdn"],
    "select": ["cm_id", "source", "created_at", "is_confirmed"],
    "where": {
        "column": "msisdn",
        "operator": "IS NULL",
    },
    "orderBy": [
        {"column": "created_at", "direction": "DESC"},
    ],
    "limit": 200,
}
scenario_pixel_conversions = {
    "from": ["pixel.tracking_all"],
    "select": ["pixel_id", "user_id", "page_url", "event_ts", "is_conversion"],
    "where": {
        "column": "page_url",
        "operator": "LIKE",
        "value": "%checkout%",
    },
    "orderBy": [
        {"column": "event_ts", "direction": "DESC"},
    ],
    "limit": 100,
}
