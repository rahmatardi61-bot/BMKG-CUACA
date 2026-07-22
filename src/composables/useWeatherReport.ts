import { ref, watch, onUnmounted, type Ref } from 'vue';
import { 
  Sun, 
  SunDim, 
  CloudSun, 
  Cloudy, 
  Cloud, 
  Droplets, 
  CloudRain, 
  Snowflake, 
  Rainbow, 
  Wind, 
  CloudLightning, 
  CloudFog, 
  Eye 
} from 'lucide-vue-next';

export function useWeatherReport(selectedCity: Ref<string>) {
  // Lapor Cuaca Modal State
  const isReportModalOpen = ref(false);
  const reportSubmitting = ref(false);
  const reportSuccess = ref(false);
  const reportActiveTab = ref<'feedback' | 'history'>('feedback');

  watch(isReportModalOpen, (isOpen) => {
    if (isOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
  });

  onUnmounted(() => {
    document.body.classList.remove('drawer-open');
  });

  // Option lists for the form
  const overallConditions = [
    { name: 'Cerah', label: 'Cerah', icon: Sun },
    { name: 'Cerah Berawan', label: 'Cerah Berawan', icon: SunDim },
    { name: 'Sebagian Berawan', label: 'Sebagian Berawan', icon: CloudSun },
    { name: 'Berawan Tebal', label: 'Berawan Tebal', icon: Cloudy },
    { name: 'Berawan', label: 'Berawan', icon: Cloud },
    { name: 'Tanpa Hujan', label: 'Tanpa Hujan', icon: Droplets },
    { name: 'Hujan', label: 'Hujan', icon: CloudRain },
    { name: 'Salju', label: 'Salju', icon: Snowflake },
    { name: 'Hujan Salju', label: 'Hujan Salju', icon: CloudRain }
  ];

  const tempFeelings = [
    { name: 'much-colder', label: 'Jauh Lebih Dingin', range: 'Di bawah 18°C' },
    { name: 'colder', label: 'Lebih Dingin', range: '18°C ~ 22°C' },
    { name: 'about-right', label: 'Cukup Nyaman', range: '23°C ~ 27°C' },
    { name: 'warmer', label: 'Lebih Hangat', range: '28°C ~ 32°C' },
    { name: 'much-warmer', label: 'Jauh Lebih Hangat', range: 'Di atas 32°C' }
  ];

  const otherConditionsList = [
    { name: 'Pelangi', label: 'Pelangi', icon: Rainbow },
    { name: 'Berangin', label: 'Berangin', icon: Wind },
    { name: 'Petir', label: 'Petir', icon: CloudLightning },
    { name: 'Kabut', label: 'Kabut', icon: CloudFog },
    { name: 'Jarak Pandang Rendah', label: 'Jarak Pandang Rendah', icon: Eye }
  ];

  const reportForm = ref({
    condition: '',
    tempFeeling: '',
    otherConditions: [] as string[],
    comment: ''
  });

  const reportHistory = ref([
    {
      id: '1',
      city: selectedCity.value,
      time: 'Hari ini, 01:15 WIB',
      condition: 'Berawan Tebal',
      tempFeeling: 'Cukup Nyaman',
      otherConditions: ['Berangin'],
      comment: 'Angin sepoi-sepoi segar.'
    },
    {
      id: '2',
      city: selectedCity.value,
      time: 'Kemarin, 14:30 WIB',
      condition: 'Hujan',
      tempFeeling: 'Lebih Dingin',
      otherConditions: ['Petir'],
      comment: 'Hujan deras mendadak.'
    }
  ]);

  // Update history items if city changes initially
  watch(selectedCity, (newCity) => {
    reportHistory.value.forEach(item => {
      if (item.id === '1' || item.id === '2') {
        item.city = newCity;
      }
    });
  });

  const getConditionIconBg = (label: string) => {
    switch (label) {
      case 'Cerah':             return 'bg-amber-500/10 border border-amber-500/15 dark:bg-amber-400/10 dark:border-amber-400/10';
      case 'Cerah Berawan':      return 'bg-orange-500/10 border border-orange-500/15 dark:bg-orange-400/10 dark:border-orange-400/10';
      case 'Sebagian Berawan':     return 'bg-sky-500/10 border border-sky-500/15 dark:bg-sky-400/10 dark:border-sky-400/10';
      case 'Berawan Tebal':     return 'bg-zinc-500/10 border border-zinc-500/15 dark:bg-zinc-400/10 dark:border-zinc-400/10';
      case 'Berawan':            return 'bg-slate-400/10 border border-slate-400/15 dark:bg-slate-500/10 dark:border-slate-500/10';
      case 'Tanpa Hujan':  return 'bg-teal-500/10 border border-teal-500/15 dark:bg-teal-400/10 dark:border-teal-400/10';
      case 'Hujan':              return 'bg-blue-500/10 border border-blue-500/15 dark:bg-blue-400/10 dark:border-blue-400/10';
      case 'Salju':              return 'bg-purple-500/10 border border-purple-500/15 dark:bg-purple-400/10 dark:border-purple-400/10';
      case 'Hujan Salju':         return 'bg-indigo-500/10 border border-indigo-500/15 dark:bg-indigo-400/10 dark:border-indigo-400/10';
      default:                  return 'bg-slate-400/10 border border-slate-400/15 dark:bg-slate-500/10 dark:border-slate-500/10';
    }
  };

  const getConditionIconColor = (label: string) => {
    switch (label) {
      case 'Cerah':             return 'text-amber-500 dark:text-amber-400';
      case 'Cerah Berawan':      return 'text-orange-500 dark:text-orange-400';
      case 'Sebagian Berawan':     return 'text-sky-500 dark:text-sky-400';
      case 'Berawan Tebal':     return 'text-zinc-500 dark:text-zinc-400';
      case 'Berawan':            return 'text-slate-500 dark:text-slate-400';
      case 'Tanpa Hujan':  return 'text-teal-500 dark:text-teal-400';
      case 'Hujan':              return 'text-blue-500 dark:text-blue-400';
      case 'Salju':              return 'text-purple-500 dark:text-purple-400';
      case 'Hujan Salju':         return 'text-indigo-500 dark:text-indigo-400';
      default:                  return 'text-slate-500 dark:text-slate-400';
    }
  };

  const toggleOtherCondition = (val: string) => {
    if (reportForm.value.otherConditions.includes(val)) {
      reportForm.value.otherConditions = reportForm.value.otherConditions.filter(c => c !== val);
    } else {
      reportForm.value.otherConditions.push(val);
    }
  };

  const openReportModal = () => {
    reportForm.value = {
      condition: 'Berawan Tebal',
      tempFeeling: 'Cukup Nyaman',
      otherConditions: [],
      comment: ''
    };
    reportActiveTab.value = 'feedback';
    reportSuccess.value = false;
    reportSubmitting.value = false;
    isReportModalOpen.value = true;
  };

  const closeReportModal = () => {
    isReportModalOpen.value = false;
  };

  const submitReport = () => {
    if (!reportForm.value.condition) return;
    
    reportSubmitting.value = true;
    
    setTimeout(() => {
      reportSubmitting.value = false;
      reportSuccess.value = true;
      
      reportHistory.value.unshift({
        id: Date.now().toString(),
        city: selectedCity.value,
        time: 'Baru saja',
        condition: reportForm.value.condition,
        tempFeeling: reportForm.value.tempFeeling,
        otherConditions: [...reportForm.value.otherConditions],
        comment: reportForm.value.comment
      });
      
      setTimeout(() => {
        isReportModalOpen.value = false;
      }, 2500);
    }, 1500);
  };

  return {
    isReportModalOpen,
    reportSubmitting,
    reportSuccess,
    reportActiveTab,
    overallConditions,
    tempFeelings,
    otherConditionsList,
    reportForm,
    reportHistory,
    getConditionIconBg,
    getConditionIconColor,
    toggleOtherCondition,
    openReportModal,
    closeReportModal,
    submitReport
  };
}
