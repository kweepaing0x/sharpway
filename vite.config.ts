import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          // Reference individual component files instead of the directory
          'ui-components': [
            './src/components/ui/Card',
            './src/components/ui/Input',
            './src/components/ui/Button',
            './src/components/ui/ImageUpload',
            './src/components/ui/ClipboardImageUpload'
          ],
          'stores': [
            './src/stores/useCartStore.ts',
            './src/stores/useCurrencyStore.ts',
            './src/stores/useTimeZoneStore.ts',
            './src/stores/useAppSettingsStore.ts'
          ]
          // Removed 'utils': ['./src/utils'] entry which was causing the build error
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});

