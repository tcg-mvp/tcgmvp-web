from __future__ import annotations


EXCLUDED_TITLE_PHRASES = (
    "no cards",
    "empty box",
    "empty booster box",
    "open packs",
    "opened packs",
    "opened box",
    "display only",
    "box only",
    "chance to win",
    "chance in winning",
    "chance of winning",
    "raffle",
    "mystery",
    "equivalent to booster box",
    "proxy",
    "replica",
    "custom",
)

CASE_EXCLUSION_PHRASES = (
    "case of 6",
    "case of six",
    "6 booster boxes",
    "six booster boxes",
    "booster box case",
    "booster case",
    "sealed case",
    "factory case",
    "master case",
    "lot of 2",
    "lot of 3",
    "lot of 4",
    "lot of 5",
    "lot of 6",
    "2 booster boxes",
    "3 booster boxes",
    "4 booster boxes",
    "5 booster boxes",
)

NON_ENGLISH_PHRASES = (
    "spanish",
    "espanol",
    "español",
    "cielos evolutivos",
    "japanese",
    "japan",
    "korean",
    "chinese",
    "german",
    "french",
    "italian",
)


def is_valid_booster_box_listing(
    *,
    title: str,
    condition: str | None,
    product_keywords: tuple[str, ...],
) -> bool:
    normalized_title = title.lower().strip()
    normalized_condition = (
        condition.lower().strip()
        if condition
        else ""
    )

    # Exact tracked product keywords must be present.
    for keyword in product_keywords:
        if keyword.lower() not in normalized_title:
            return False

    # We are tracking sealed product only.
    if normalized_condition and (
        "new" not in normalized_condition
        and "factory sealed" not in normalized_condition
    ):
        return False

    # Known bad / misleading listing patterns.
    if any(
        phrase in normalized_title
        for phrase in EXCLUDED_TITLE_PHRASES
    ):
        return False

    # Reject non-English product listings.
    if any(
        phrase in normalized_title
        for phrase in NON_ENGLISH_PHRASES
    ):
        return False

    # Do not confuse an individual booster box with
    # a wholesale booster-box case.
    #
    # "acrylic case" is intentionally allowed because
    # it refers to a protective case around a single box.
    if any(
        phrase in normalized_title
        for phrase in CASE_EXCLUSION_PHRASES
    ):
        return False

    return True