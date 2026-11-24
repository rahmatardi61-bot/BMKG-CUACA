import { ref } from 'vue';
import { Sun, SunDim, Cloudy, CloudRain, CloudLightning, Wind, Cloud } from 'lucide-vue-next';

/**
 * State & logika "Lapor Cuaca" (form laporan pengunjung + riwayat).
 *
 * Dipakai dua tempat: tombol di HeroWeatherCard (dashboard) dan widget embed.
 * Dulu semuanya hidup di dalam HeroWeatherCard; dipindah ke sini supaya widget
 * embed tidak perlu menyalin 60 baris state + opsi.
 *
 * Catatan: laporan TIDAK dikirim ke server mana pun — ini demo interaksi.
 */
export interface WeatherReportEntry {
  id: string;
  city: string;
  time: string;
  condition: string;
  tempFeeling: string;
  otherConditions: string[];
  comment: string;
}

export const overallConditions = [
  { name: 'sunny', label: 'Cerah', icon: Sun },
  { name: 'partly-cloudy', label: 'Cerah Berawan', icon: SunDim },
  { name: 'cloudy', label: 'Berawan Tebal', icon: Cloudy },
  { name: 'light-rain', label: 'Hujan Gerimis', icon: CloudRain },
  { name: 'heavy-rain', label: 'Hujan Deras', icon: CloudRain },
  { name: 'thunderstorm', label: 'Badai Petir', icon: CloudLightning },
];

export const tempFeelings = [
  { name: 'hot', label: 'Panas Menyengat', range: '>33°C' },
  { name: 'humid', label: 'Gerah / Lembap', range: '29-33°C' },
  { name: 'comfy', label: 'Nyaman / Pas', range: '24-28°C' },
  { name: 'cool', label: 'Sejuk', range: '20-23°C' },
  { name: 'cold', label: 'Dingin', range: '<20°C' },
];

export const otherConditionsList = [
  { name: 'windy', label: 'Angin Kencang', icon: Wind },
  { name: 'foggy', label: 'Kabut Tebal', icon: Cloud },
  { name: 'flood', label: 'Jalan Tergenang / Banjir', icon: CloudRain },
  { name: 'slippery', label: 'Jalan Licin', icon: CloudRain },
  { name: 'dark', label: 'Langit Gelap', icon: Cloudy },
  { name: 'lightning', label: 'Kilat / Petir Menyambar', icon: CloudLightning },
];

const getConditionIconBg = (_condName?: string) => 'bg-blue-500/10 dark:bg-blue-400/15';
const getConditionIconColor = (_condName?: string) => 'text-blue-600 dark:text-blue-400';

export const sampleReportHistory: WeatherReportEntry[] = [
  {
    id: 'rep-1',
    city: 'DKI Jakarta',
    time: '14:20 WIB',
    condition: 'Hujan Deras',
    tempFeeling: 'Dingin',
    otherConditions: ['Angin Kencang', 'Jalan Tergenang / Banjir'],
    comment: 'Wilayah Kemang hujan sangat deras disertai angin kencang. Hati-hati berkendara.',
  },
  {
    id: 'rep-2',
    city: 'DKI Jakarta',
    time: '13:45 WIB',
    condition: 'Berawan Tebal',
    tempFeeling: 'Lembap / Gerah',
    otherConditions: ['Langit Gelap', 'Mendung'],
    comment: 'Awan hitam tebal sudah menutupi area Jakarta Selatan.',
  },
];

/** @param currentCity nama kota saat ini — dipakai saat laporan baru disimpan */
export function useWeatherReport(currentCity: () => string) {
  const submitting = ref(false);
  const success = ref(false);
  const activeTab = ref<'feedback' | 'history'>('feedback');

  const form = ref({
    condition: 'Cerah Berawan',
    tempFeeling: 'Nyaman / Pas',
    otherConditions: [] as string[],
    comment: '',
  });

  const history = ref<WeatherReportEntry[]>([...sampleReportHistory]);

  function toggleOtherCondition(condLabel: string) {
    const idx = form.value.otherConditions.indexOf(condLabel);
    if (idx >= 0) form.value.otherConditions.splice(idx, 1);
    else form.value.otherConditions.push(condLabel);
  }

  function submit() {
    submitting.value = true;
    setTimeout(() => {
      submitting.value = false;
      success.value = true;
      history.value.unshift({
        id: `rep-${Date.now()}`,
        city: currentCity(),
        time: `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
        condition: form.value.condition,
        tempFeeling: form.value.tempFeeling,
        otherConditions: [...form.value.otherConditions],
        comment: form.value.comment,
      });
      setTimeout(() => {
        success.value = false;
        activeTab.value = 'history';
      }, 1800);
    }, 900);
  }

  return {
    submitting,
    success,
    activeTab,
    form,
    history,
    toggleOtherCondition,
    submit,
    overallConditions,
    tempFeelings,
    otherConditionsList,
    getConditionIconBg,
    getConditionIconColor,
  };
}
