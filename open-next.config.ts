import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // The default cache is enough for this first production deployment.
  // Add R2 incremental cache later only after creating the bucket in Cloudflare.
});
