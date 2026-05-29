import path from "node:path";

const nextConfig = {
  turbopack: {
    root: path.join(process.cwd()),
  },
  allowedDevOrigins: [
    "192.168.1.18",  // home WiFi
    "172.20.10.2",   // phone hotspot
  ],
};

export default nextConfig;
