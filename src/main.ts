import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia'; // Import Pinia
import { createVuetify } from 'vuetify';
import 'vuetify/styles'; // Ensure Vuetify styles are imported
import '@mdi/font/css/materialdesignicons.css'; // Import Material Design Icons
import router from './router'; // Import the router

const pinia = createPinia(); // Initialize Pinia

const customLightTheme = {
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
    'medal-gold': '#FFD700',
    'medal-silver': '#C0C0C0',
    'medal-bronze': '#CD7F32'
  },
};

const customDarkTheme = {
  dark: true,
  colors: {
    primary: '#ede5f5',
    'primary-dark': '#52356e',
    'primary-light': '#3f2a56',
    secondary: '#009bcd',
    'secondary-dark': '#007ea8',
    'secondary-light': '#006789',
    tertiary: '#ff6754',
    'tertiary-dark': '#e14632',
    'tertiary-light': '#d93620',
    'neutral-black-100': '#fff',
    'neutral-black-80': '#fafafa',
    'neutral-black-75': '#f1f1f1',
    'neutral-black-55': '#d6d6d6',
    'neutral-black-40': '#999',
    'neutral-black-15': '#757575',
    'neutral-black-5': '#333',
    'neutral-black-3': '#404040',
    'neutral-black-0': '#000',
    'medal-gold': '#FFD700',
    'medal-silver': '#C0C0C0',
    'medal-bronze': '#CD7F32',
  },
};

const vuetify = createVuetify({
  defaults: {
    global: {
      useUtilityClasses: true, // Ensure utility classes are enabled
      ripple: false,
    },
  },
  theme: {
    defaultTheme: window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'customLightTheme' // DARK theme disabled for now 'customDarkTheme'
    : 'customLightTheme',
    themes: {
      customLightTheme,
      customDarkTheme,
    },
  },
}); // Initialize Vuetify

// Add theme change listener
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  vuetify.theme.global.name.value = e.matches ? 'customDarkTheme' : 'customLightTheme';
});

createApp(App)
  .use(router) // Use the router
  .use(pinia) // Use Pinia globally
  .use(vuetify) // Use Vuetify globally
  .mount('#app');
