// @lovable.dev/vite-tanstack-config already includes the required plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: true,

  tanstackStart: {
    server: { entry: "server" },
  },
});
