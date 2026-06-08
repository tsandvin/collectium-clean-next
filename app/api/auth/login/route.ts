import { NextRequest, NextResponse } from "next/server";
import {
  collectiumSessionCookieName,
  createSessionToken,
  verifyAuthCredentials,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody;

    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing username or password",
        },
        { status: 400 },
      );
    }

    const isValid = verifyAuthCredentials(username, password);

    if (!isValid) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid username or password",
        },
        { status: 401 },
      );
    }

    const token = createSessionToken(username);

    const response = NextResponse.json(
      {
        ok: true,
        message: "Login OK",
        user: {
          username,
          role: "admin",
        },
      },
      { status: 200 },
    );

    response.cookies.set({
      name: collectiumSessionCookieName,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown auth error";

    return NextResponse.json(
      {
        ok: false,
        message: "Auth API failed",
        error: message,
      },
      { status: 500 },
    );
  }
}
