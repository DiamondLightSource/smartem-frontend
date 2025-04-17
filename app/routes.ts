import { type RouteConfig, route } from "@react-router/dev/routes";

export default [route("/", "./routes/home.tsx"), route("/acquisitions/:acqId", "./routes/acquisition.tsx")] satisfies RouteConfig;
