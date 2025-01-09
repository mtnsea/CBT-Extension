import { defineConfig } from 'wxt';
import { fileURLToPath } from "url";
import svgLoader from "vite-svg-loader";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    permissions: ['storage'],
  },
  vite: () => ({
    plugins: [
      svgLoader(),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      }
    }
  })
});
