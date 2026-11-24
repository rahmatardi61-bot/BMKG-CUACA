<script setup lang="ts">
// Widget "Lapor Cuaca": form laporan pengunjung + riwayat, dirender inline
// (bukan overlay) supaya muat di iframe.
//
// Kontrolnya rumit (tab, form, validasi, submit palsu), jadi ia memakai
// composable yang sama dengan tombol di HeroWeatherCard dashboard — satu
// sumber perilaku, dua tempat pemakaian.
import { computed } from 'vue';
import { CloudSun } from 'lucide-vue-next';
import WeatherReportDrawer from '../components/WeatherReportDrawer.vue';
import { useWeatherReport } from '../composables/useWeatherReport';

const props = defineProps<{
  selectedCity: string;
  weatherTemp?: number;
}>();

// useWeatherReport mengembalikan ref; template otomatis unwrap, jadi cukup
// destructure nilainya di sini agar binding tidak perlu .value.
const {
  submitting, success, activeTab, form, history,
  toggleOtherCondition, submit,
  overallConditions, tempFeelings, otherConditionsList,
  getConditionIconBg, getConditionIconColor,
} = useWeatherReport(() => props.selectedCity);

// Ikon cuaca di kepala drawer: cukup satu ikon netral (widget tidak membawa data cuaca)
const weatherIcon = computed(() => CloudSun);
</script>

<template>
  <WeatherReportDrawer
    inline
    :is-open="true"
    :selected-city="props.selectedCity"
    :weather-temp="props.weatherTemp ?? 28"
    :weather-icon="weatherIcon"
    :report-submitting="submitting"
    :report-success="success"
    :report-active-tab="activeTab"
    :report-form="form"
    :report-history="history"
    :overall-conditions="overallConditions"
    :temp-feelings="tempFeelings"
    :other-conditions-list="otherConditionsList"
    :get-condition-icon-bg="getConditionIconBg"
    :get-condition-icon-color="getConditionIconColor"
    @update:report-active-tab="activeTab = $event"
    @update:report-form="form = $event"
    @toggle-other-condition="toggleOtherCondition"
    @submit="submit()"
    @close="() => {}"
  />
</template>
