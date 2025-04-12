import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { promises as fs } from 'fs';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_BASE_URL || '/',
  plugins: [
    vue(),
    vuetify({ autoImport: true }), // Ensure Vuetify plugin is configured
    {
      name: 'vite-plugin-tournament-list-build',
      apply: 'build',
      async buildStart() {
        const dataFolder = path.resolve(__dirname, '../../data/tournaments');
        const outputFile = path.resolve(__dirname, '../../data/tournaments.json');

        try {
          const files = await fs.readdir(dataFolder);
          const tournaments = files
            .filter((file) => file.endsWith('.csv'))
            .map((file) => ({
              name: path.basename(file, '.csv'),
              filePath: `/data/tournaments/${file}`,
            }));

          await fs.writeFile(outputFile, JSON.stringify(tournaments, null, 2));
          console.log(`Generated tournaments.json with ${tournaments.length} tournaments.`);
        } catch (error) {
          console.error('Error generating tournaments.json:', error);
        }
      },
    },
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "vuetify/styles" as *;`,
      },
    },
  },
});
