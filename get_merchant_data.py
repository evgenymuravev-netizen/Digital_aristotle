"""
Fetch all available data for a merchant from BigQuery.

Usage:
    python get_merchant_data.py --merchant-id <uuid> [--project <gcp-project>]

Example:
    python get_merchant_data.py --merchant-id 05ff1741-7712-4c5a-8121-fd67eceb3665
"""

import argparse
import json
from datetime import datetime

from google.cloud import bigquery


# ---------------------------------------------------------------------------
# Configuration – adjust project / dataset names to match your environment
# ---------------------------------------------------------------------------
DEFAULT_PROJECT = "tabby-production"   # GCP project
DATASET_CORE    = "core"               # main operational dataset
DATASET_CAPITAL = "tabby_capital"      # Tabby-Capital specific dataset
DATASET_KYC     = "kyc"               # KYC / compliance dataset
DATASET_FINANCE = "finance"            # finance / accounting dataset


# ---------------------------------------------------------------------------
# Query catalogue
# ---------------------------------------------------------------------------
QUERIES = {
    "merchant_profile": f"""
        SELECT *
        FROM `{{project}}.{DATASET_CORE}.merchants`
        WHERE id = @merchant_id
        LIMIT 1
    """,

    "tabby_capital_applications": f"""
        SELECT *
        FROM `{{project}}.{DATASET_CAPITAL}.applications`
        WHERE merchant_id = @merchant_id
        ORDER BY created_at DESC
    """,

    "tabby_capital_facilities": f"""
        SELECT *
        FROM `{{project}}.{DATASET_CAPITAL}.credit_facilities`
        WHERE merchant_id = @merchant_id
        ORDER BY created_at DESC
    """,

    "tabby_capital_disbursements": f"""
        SELECT *
        FROM `{{project}}.{DATASET_CAPITAL}.disbursements`
        WHERE merchant_id = @merchant_id
        ORDER BY disbursed_at DESC
    """,

    "tabby_capital_repayments": f"""
        SELECT *
        FROM `{{project}}.{DATASET_CAPITAL}.repayments`
        WHERE merchant_id = @merchant_id
        ORDER BY due_date ASC
    """,

    "tabby_capital_statements": f"""
        SELECT *
        FROM `{{project}}.{DATASET_CAPITAL}.statements`
        WHERE merchant_id = @merchant_id
        ORDER BY period_end DESC
    """,

    "bank_accounts": f"""
        SELECT *
        FROM `{{project}}.{DATASET_CORE}.merchant_bank_accounts`
        WHERE merchant_id = @merchant_id
    """,

    "kyc_documents": f"""
        SELECT *
        FROM `{{project}}.{DATASET_KYC}.documents`
        WHERE merchant_id = @merchant_id
        ORDER BY submitted_at DESC
    """,

    "kyc_status": f"""
        SELECT *
        FROM `{{project}}.{DATASET_KYC}.merchant_verifications`
        WHERE merchant_id = @merchant_id
        ORDER BY updated_at DESC
        LIMIT 1
    """,

    "finance_settlements": f"""
        SELECT *
        FROM `{{project}}.{DATASET_FINANCE}.settlements`
        WHERE merchant_id = @merchant_id
        ORDER BY settled_at DESC
        LIMIT 50
    """,

    "finance_payouts": f"""
        SELECT *
        FROM `{{project}}.{DATASET_FINANCE}.payouts`
        WHERE merchant_id = @merchant_id
        ORDER BY created_at DESC
        LIMIT 50
    """,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize(value):
    """Make BigQuery row values JSON-serialisable."""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.hex()
    return value


def rows_to_list(rows):
    return [
        {k: _serialize(v) for k, v in dict(row).items()}
        for row in rows
    ]


def run_query(client: bigquery.Client, name: str, sql: str, merchant_id: str):
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("merchant_id", "STRING", merchant_id)
        ]
    )
    try:
        job = client.query(sql, job_config=job_config)
        rows = list(job.result())
        data = rows_to_list(rows)
        print(f"  [{name}] {len(data)} row(s)")
        return data
    except Exception as exc:
        print(f"  [{name}] ERROR – {exc}")
        return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def fetch_merchant_data(merchant_id: str, project: str) -> dict:
    client = bigquery.Client(project=project)
    result = {"merchant_id": merchant_id, "fetched_at": datetime.utcnow().isoformat()}

    print(f"\nFetching data for merchant {merchant_id} (project: {project})\n")

    for name, sql_template in QUERIES.items():
        sql = sql_template.format(project=project)
        result[name] = run_query(client, name, sql, merchant_id)

    return result


def main():
    parser = argparse.ArgumentParser(description="Fetch all BQ data for a Tabby merchant.")
    parser.add_argument(
        "--merchant-id",
        default="05ff1741-7712-4c5a-8121-fd67eceb3665",
        help="Merchant UUID (default: 05ff1741-7712-4c5a-8121-fd67eceb3665)",
    )
    parser.add_argument(
        "--project",
        default=DEFAULT_PROJECT,
        help=f"GCP project ID (default: {DEFAULT_PROJECT})",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Write JSON result to this file (default: print to stdout)",
    )
    args = parser.parse_args()

    data = fetch_merchant_data(args.merchant_id, args.project)

    output = json.dumps(data, indent=2, default=str)

    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
        print(f"\nResult written to {args.output}")
    else:
        print("\n" + output)


if __name__ == "__main__":
    main()
