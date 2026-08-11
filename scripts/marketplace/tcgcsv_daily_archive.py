from __future__ import annotations

import json
import subprocess
import tempfile
from datetime import date
from pathlib import Path
from urllib.request import Request, urlopen


TCGCSV_ARCHIVE_BASE_URL = (
    "https://tcgcsv.com/archive/tcgplayer"
)

SEVEN_ZIP_PATH = Path(
    r"C:\Program Files\7-Zip\7z.exe"
)


def fetch_daily_product_prices(
    *,
    archive_date: date,
    products: list[dict],
) -> list[dict]:
    date_string = archive_date.isoformat()

    archive_url = (
        f"{TCGCSV_ARCHIVE_BASE_URL}/"
        f"prices-{date_string}.ppmd.7z"
    )

    if not SEVEN_ZIP_PATH.exists():
        raise FileNotFoundError(
            f"7-Zip executable not found at {SEVEN_ZIP_PATH}"
        )

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        archive_path = (
            temp_path
            / f"prices-{date_string}.ppmd.7z"
        )

        extract_path = temp_path / "extracted"
        extract_path.mkdir(
            parents=True,
            exist_ok=True,
        )

        print(f"Downloading archive: {archive_url}")

        request = Request(
            archive_url,
            headers={
                "User-Agent": "TCGMVP/0.1",
                "Accept": "*/*",
            },
            method="GET",
        )

        with urlopen(request, timeout=60) as response:
            archive_path.write_bytes(
                response.read()
            )

        print("Extracting archive...")

        subprocess.run(
            [
                str(SEVEN_ZIP_PATH),
                "x",
                str(archive_path),
                f"-o{extract_path}",
                "-y",
            ],
            check=True,
        )

        observations: list[dict] = []

        for product in products:
            tcgmvp_product_id = int(
                product["tcgmvp_product_id"]
            )
            tcgplayer_id = str(
                product["tcgplayer_id"]
            )
            group_id = str(
                product["group_id"]
            )

            price_file = (
                extract_path
                / date_string
                / "3"
                / group_id
                / "prices"
            )

            if not price_file.exists():
                print(
                    f"Price file missing for "
                    f"group {group_id}"
                )
                continue

            payload = json.loads(
                price_file.read_text(
                    encoding="utf-8"
                )
            )

            records = (
                payload
                if isinstance(payload, list)
                else payload.get("results")
                or payload.get("data")
                or payload.get("prices")
                or []
            )

            matching_record = None

            for record in records:
                if str(record.get("productId")) == tcgplayer_id:
                    matching_record = record
                    break

            if matching_record is None:
                print(
                    f"No historical record for "
                    f"TCGPlayer product {tcgplayer_id}"
                )
                continue

            observations.append(
                {
                    "archive_date": date_string,
                    "tcgmvp_product_id": tcgmvp_product_id,
                    "tcgplayer_id": tcgplayer_id,
                    "group_id": group_id,
                    "market_price": matching_record.get(
                        "marketPrice"
                    ),
                    "low_price": matching_record.get(
                        "lowPrice"
                    ),
                    "mid_price": matching_record.get(
                        "midPrice"
                    ),
                    "high_price": matching_record.get(
                        "highPrice"
                    ),
                    "raw_data": matching_record,
                }
            )

        return observations