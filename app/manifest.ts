import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Farm log",
    short_name: "FarmLog",
    description: "Професионален агро календар, задачи и известия.",
    start_url: "/",
    display: "standalone",
    background_color: "#ebe4d4",
    theme_color: "#142e24",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
