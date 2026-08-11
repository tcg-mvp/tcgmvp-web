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


def fetch_historical_market_price(
    *,
    archive_date: date,
    group_id: int,
    product_id: str,
) -> dict:
    date_string = archive_date.isoformat()

    archive_url = (
        f"{TCGCSV_ARCHIVE_BASE_URL}/"
        f"prices-{date_string}.ppmd.7z"
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

        print(f"Downloading: {archive_url}")

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

        seven_zip = Path(
            r"C:\Program Files\7-Zip\7z.exe"
        )

        if not seven_zip.exists():
            raise FileNotFoundError(
                f"7-Zip executable not found at {seven_zip}"
            )

        subprocess.run(
            [
                str(seven_zip),
                "x",
                str(archive_path),
                f"-o{extract_path}",
                "-y",
            ],
            check=True,
        )

        price_file = (
            extract_path
            / date_string
            / "3"
            / str(group_id)
            / "prices"
        )

        if not price_file.exists():
            raise FileNotFoundError(
                f"Price file not found: {price_file}"
            )

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

        for record in records:
            if str(record.get("productId")) == str(
                product_id
            ):
                return record

        raise LookupError(
            f"No TCGCSV historical record found "
            f"for productId={product_id} "
            f"on {date_string}."
        )