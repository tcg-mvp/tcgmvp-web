from __future__ import annotations

from scripts.marketplace.ebay.api import (
    get_application_token,
)


def main() -> None:
    print("")
    print("Testing eBay Production OAuth...")
    print("")

    try:
        token = get_application_token()

        print("eBay OAuth successful.")
        print(f"Token received: YES")
        print(f"Token length: {len(token)}")
        print("")
        print(
            "Production eBay API authentication "
            "is working."
        )

    except Exception as exc:
        print("eBay OAuth FAILED.")
        print("")
        print(exc)
        raise


if __name__ == "__main__":
    main()