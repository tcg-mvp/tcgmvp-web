from __future__ import annotations

import json
import tarfile
import tempfile
from datetime import date
from pathlib import Path
from urllib.request import Request, urlopen


POKEFOLIO_ARCHIVE_BASE_URL = (
    "https://raw.githubusercontent.com/"
    "landonrroy/pokefolio-data/main/data"
)

TCGPLAYER_CATEGORY_ID = "3"


def _normalize_archive_path(
    value: str,
) -> str:
    """
    Normalize archive member paths so matching works
    consistently across Windows and Linux.
    """
    return (
        value
        .replace("\\", "/")
        .lstrip("./")
    )


def _get_required_archive_targets(
    *,
    archive_names: list[str],
    archive_date: date,
    products: list[dict],
) -> dict[str, str]:
    """
    Find the exact price-file member inside the archive
    for every unique TCGCSV group required by the
    requested products.

    Returns:
        {
            "2906": "2026-08-18/3/2906/prices",
            ...
        }
    """
    date_string = archive_date.isoformat()

    normalized_name_map = {
        _normalize_archive_path(name): name
        for name in archive_names
    }

    required_group_ids = {
        str(product["group_id"])
        for product in products
    }

    targets_by_group: dict[str, str] = {}

    for group_id in sorted(required_group_ids):
        expected_path = (
            f"{date_string}/"
            f"{TCGPLAYER_CATEGORY_ID}/"
            f"{group_id}/prices"
        )

        exact_match = normalized_name_map.get(
            expected_path
        )

        if exact_match is not None:
            targets_by_group[group_id] = exact_match
            continue

        expected_suffix = (
            f"/{date_string}/"
            f"{TCGPLAYER_CATEGORY_ID}/"
            f"{group_id}/prices"
        )

        suffix_match = next(
            (
                original_name
                for normalized_name, original_name
                in normalized_name_map.items()
                if (
                    f"/{normalized_name}"
                    .endswith(expected_suffix)
                )
            ),
            None,
        )

        if suffix_match is not None:
            targets_by_group[group_id] = suffix_match
            continue

        print(
            "Archive price file not found "
            f"for group {group_id}"
        )

    return targets_by_group


def fetch_daily_product_prices(
    *,
    archive_date: date,
    products: list[dict],
) -> list[dict]:
    """
    Download one historical Pokémon price archive from
    the PokeFolio TCGCSV mirror and return observations
    for the requested products.

    The mirror preserves the original TCGCSV directory
    layout and raw price JSON.

    Optimization:
    - Download the daily archive once.
    - Inspect the archive index.
    - Extract only the required TCGCSV group files.
    """
    if not products:
        return []

    date_string = archive_date.isoformat()
    year_string = str(archive_date.year)

    archive_url = (
        f"{POKEFOLIO_ARCHIVE_BASE_URL}/"
        f"{year_string}/"
        f"prices-{date_string}.tar.gz"
    )

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        archive_path = (
            temp_path
            / f"prices-{date_string}.tar.gz"
        )

        extract_path = (
            temp_path
            / "extracted"
        )

        extract_path.mkdir(
            parents=True,
            exist_ok=True,
        )

        print(
            "Downloading PokeFolio archive: "
            f"{archive_url}"
        )

        request = Request(
            archive_url,
            headers={
                "User-Agent": "TCGMVP/0.1",
                "Accept": "*/*",
            },
            method="GET",
        )

        with urlopen(
            request,
            timeout=60,
        ) as response:
            archive_path.write_bytes(
                response.read()
            )

        with tarfile.open(
            archive_path,
            mode="r:gz",
        ) as archive:
            archive_names = [
                member.name
                for member in archive.getmembers()
                if member.isfile()
            ]

            targets_by_group = (
                _get_required_archive_targets(
                    archive_names=archive_names,
                    archive_date=archive_date,
                    products=products,
                )
            )

            extraction_targets = list(
                dict.fromkeys(
                    targets_by_group.values()
                )
            )

            if not extraction_targets:
                print(
                    "No requested price files "
                    "were found in the archive."
                )
                return []

            print(
                "Extracting targeted price files: "
                f"{len(extraction_targets)}"
            )

            members_by_name = {
                member.name: member
                for member in archive.getmembers()
            }

            for target in extraction_targets:
                member = members_by_name.get(target)

                if member is None:
                    print(
                        "Archive member unavailable: "
                        f"{target}"
                    )
                    continue

                source = archive.extractfile(member)

                if source is None:
                    print(
                        "Unable to read archive member: "
                        f"{target}"
                    )
                    continue

                output_path = (
                    extract_path
                    / Path(
                        _normalize_archive_path(
                            target
                        )
                    )
                )

                output_path.parent.mkdir(
                    parents=True,
                    exist_ok=True,
                )

                output_path.write_bytes(
                    source.read()
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

            archive_target = (
                targets_by_group.get(group_id)
            )

            if archive_target is None:
                print(
                    "Price target unavailable "
                    f"for group {group_id}"
                )
                continue

            price_file = (
                extract_path
                / Path(
                    _normalize_archive_path(
                        archive_target
                    )
                )
            )

            if not price_file.exists():
                print(
                    "Extracted price file "
                    "missing for group "
                    f"{group_id}: "
                    f"{price_file}"
                )
                continue

            payload = json.loads(
                price_file.read_text(
                    encoding="utf-8"
                )
            )

            if isinstance(payload, list):
                records = payload

            elif isinstance(payload, dict):
                records = (
                    payload.get("results")
                    or payload.get("data")
                    or payload.get("prices")
                    or []
                )

            else:
                records = []

            matching_record = next(
                (
                    record
                    for record in records
                    if (
                        isinstance(record, dict)
                        and str(
                            record.get(
                                "productId"
                            )
                        )
                        == tcgplayer_id
                    )
                ),
                None,
            )

            if matching_record is None:
                print(
                    "No historical record "
                    "for TCGPlayer product "
                    f"{tcgplayer_id}"
                )
                continue

            observations.append(
                {
                    "archive_date":
                        date_string,

                    "tcgmvp_product_id":
                        tcgmvp_product_id,

                    "tcgplayer_id":
                        tcgplayer_id,

                    "group_id":
                        group_id,

                    "market_price":
                        matching_record.get(
                            "marketPrice"
                        ),

                    "low_price":
                        matching_record.get(
                            "lowPrice"
                        ),

                    "mid_price":
                        matching_record.get(
                            "midPrice"
                        ),

                    "high_price":
                        matching_record.get(
                            "highPrice"
                        ),

                    "raw_data":
                        matching_record,
                }
            )

        return observations