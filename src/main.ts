import { createApp } from 'vue';
import App from './App.vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles'; // Import Vuetify styles
import '@mdi/font/css/materialdesignicons.css'; // Import Material Design Icons

const customTheme = {
  dark: false,
  colors: {
    primary: '#52356e',
    'primary-dark': '#3f2a56',
    'primary-light': '#ede5f5',
    secondary: '#007ea8',
    'secondary-dark': '#006789',
    'secondary-light': '#009bcd',
    tertiary: '#e14632',
    'tertiary-dark': '#d93620',
    'tertiary-light': '#ff6754',
    'neutral-black-100': '#000',
    'neutral-black-80': '#333',
    'neutral-black-75': '#404040',
    'neutral-black-55': '#757575',
    'neutral-black-40': '#999',
    'neutral-black-15': '#d6d6d6',
    'neutral-black-5': '#f1f1f1',
    'neutral-black-3': '#fafafa',
    'neutral-black-0': '#fff',
  },
};

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'customTheme',
    themes: {
      customTheme,
    },
  },
}); // Initialize Vuetify

createApp(App)
  .use(vuetify) // Use Vuetify globally
  .mount('#app');
