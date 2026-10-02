import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@turbograb/ui', '@turbograb/types'],
};

export default nextConfig;
