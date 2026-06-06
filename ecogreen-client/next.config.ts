import path from "node:path";

const nextConfig = {
  turbopack: {
    root: path.join(process.cwd()),
  },
  allowedDevOrigins: [
    "192.168.1.25", // phone hotspot
  ],
};

export default nextConfig;
