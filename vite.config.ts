import {defineConfig} from "vite";

const routerTarget = process.env.ROUTER_URL || "http://192.168.0.1";
export default defineConfig({
    root: "rootfs/www-comfast",
    server: {
        strictPort: true,
        open: "/login.html",
        proxy: {
            "/cgi-bin": {
                target: routerTarget,
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
