<template>
    <div class="container mx-auto">
        <div class="grid grid-cols-12 gap-5">
            <div class="dashboard-section col-span-12 xl:col-span-4 md:col-span-6">
                <BaseCard>
                    <manufacturing-tool-statistics></manufacturing-tool-statistics>
                </BaseCard>
            </div>
            <div class="dashboard-section col-span-12 xl:col-span-8 md:col-span-6">
                <BaseCard>
                    <loaded-programs></loaded-programs>    
                </BaseCard>
            </div>
            <div class="dashboard-section col-span-12 xl:col-span-8 md:col-span-6">
                <BaseCard>
                    <effectivity></effectivity>
                </BaseCard>
            </div>
            <div class="dashboard-section col-span-12 xl:col-span-4 md:col-span-6">
                <BaseCard>
                    <alarms></alarms>
                </BaseCard>
            </div>

        </div>
    </div>
</template>

<script>
import ManufacturingToolStatistics from '@/views/ManufacturingToolStatistics.vue';
import LoadedPrograms from '@/views/LoadedPrograms.vue';
import Effectivity from '@/views/Effectivity.vue';
import Alarms from '@/views/Alarms.vue';
import { ref, onMounted } from 'vue';
import { getLoadedPrograms } from '@/api/api';

export default {
    setup() {
    },
    methods: {
    },
    template: '',
    components: {
        ManufacturingToolStatistics,
        LoadedPrograms,
        Effectivity,
        Alarms
    }
};
</script>

<style scoped>
.dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 2rem;
    padding: 2rem;
}

.dashboard-section {
    background: white;
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
}
</style>