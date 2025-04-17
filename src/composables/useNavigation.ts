import { useRouter } from 'vue-router';
import { useFoosballStore } from '../store';

export function useNavigation() {
  const router = useRouter();
  const store = useFoosballStore();

  const navigateTo = (route: string) => {
    const sport = store.selectedSport;
    // const season = `${store.selectedSeason.year}Q${store.selectedSeason.quarter}`;
    router.push(`/${sport}${route}`);
  };

  const isActive = (route: string) => {
    const sport = store.selectedSport;
    // const season = `${store.selectedSeason.year}Q${store.selectedSeason.quarter}`;
    return router.currentRoute.value.path === `/${sport}${route}`;
  };

  return {
    navigateTo,
    isActive
  };
}