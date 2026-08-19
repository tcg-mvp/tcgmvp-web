import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  const challengeCode =
    request.nextUrl.searchParams.get("challenge_code");

  if (!challengeCode) {
    return NextResponse.json(
      { error: "Missing challenge_code" },
      { status: 400 }
    );
  }

  const verificationToken =
    process.env.EBAY_ACCOUNT_DELETION_VERIFICATION_TOKEN;

  const endpoint =
    process.env.EBAY_ACCOUNT_DELETION_ENDPOINT;

  if (!verificationToken || !endpoint) {
    console.error(
      "eBay account deletion environment variables are missing."
    );

    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const challengeResponse = createHash("sha256")
    .update(challengeCode)
    .update(verificationToken)
    .update(endpoint)
    .digest("hex");

  return NextResponse.json(
    {
      challengeResponse,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}


export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log(
      "Received eBay marketplace account deletion notification:",
      payload
    );

    /*
     * TCGMVP does not currently persist eBay marketplace
     * user-account data.
     *
     * Before eBay-derived user data is persisted, this handler
     * should be extended to delete or anonymize any records
     * associated with the notified eBay user.
     */

    return NextResponse.json(
      {
        acknowledged: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unable to process eBay account deletion notification:",
      error
    );

    return NextResponse.json(
      {
        error: "Invalid notification payload",
      },
      {
        status: 400,
      }
    );
  }
}