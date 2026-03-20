import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';

// Configuração para análise de bundle
export default defineConfig({
  plugins: [
    analyzer({
      analyzerMode: 'static',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json'
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'charts-vendor': ['recharts', 'd3-scale', 'd3-shape'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'query-vendor': ['@tanstack/react-query'],
          'utils-vendor': ['axios', 'date-fns', 'dayjs', 'clsx', 'tailwind-merge'],
        }
      }
    }
  }
});
