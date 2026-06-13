import path from "node:path";

const nextConfig = {
  turbopack: {
    root: path.join(process.cwd()),
  },
  allowedDevOrigins: [
    "192.168.1.14", // phone hotspot
  ],
};

export default nextConfig;
