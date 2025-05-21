/** @type {import('next').NextConfig} */
export default {
  
  reactStrictMode: true,

  
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  
  serverExternalPackages: ["path-browserify"],

  
  images: {
    domains: ["localhost"],
    unoptimized: true, 
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
  },

  
  webpack: (config, { isServer }) => {
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: require.resolve("path-browserify"),
      };
    }

    
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac|mov|avi)(\?.*)?$/,
      use: {
        loader: "file-loader",
        options: {
          publicPath: "/_next/static/media",
          outputPath: "static/media",
          name: "[name].[hash].[ext]",
        },
      },
    });

    return config;
  },
};
