import type { NextConfig } from "next";

const isTindeqPreview =
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === "feature/tindeq-repeaters-import";

const nextConfig: NextConfig = isTindeqPreview
  ? {
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://ednbxwvvzomvdkjdybau.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          "sb_publishable_VZI4OXMgyOh1QhOPXTLvfQ_0smOUk56",
        NEXT_PUBLIC_TINDEQ_PREVIEW_MODE: "1",
      },
    }
  : {};

export default nextConfig;
