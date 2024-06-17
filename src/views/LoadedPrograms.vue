<template>
    <div>
        <div cslass="card-header">
            <div class="card-title py-3">Programs</div>
        </div>
        <div class="dataTable-wrapper dataTable-loading no-footer fixed-columns">
          <div class="dataTable-container block w-full overflow-x-auto whitespace-nowrap borderless hover">
              <table class="table-3 dataTable-table max-w-full w-full">
                  <thead>
                      <tr class="">
                          <th class=" text-left border-b pb-3 mb-3 text-gray-500 font-semibold">Name</th>
                          <th class=" text-left border-b pb-3 mb-3 text-gray-500 font-semibold">Line</th>
                          <th class=" text-left border-b pb-3 mb-3 text-gray-500 font-semibold">Start</th>
                          <th class=" text-left border-b pb-3 mb-3 text-gray-500 font-semibold">End</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr v-for="(program, index) in programs" :key="index">
                          <td class="text-xs py-5 px-4">
                              {{program.name}}
                          </td>
                          <td class="text-xs">
                              {{program.actual_line}}
                          </td>
                          <td class="py-5">
                              {{ $date(program.start).format('DD.MM.YYYY HH:MM:ss') }}   
                          </td>
                          <td class="py-5">
                              {{ $date(program.end).format('DD.MM.YYYY HH:MM:ss') }}        
                          </td>
                          <td class="py-5">
                              <BaseBtn rounded class="border border-primary text-primary hover:bg-primary hover:text-white ">
                                  Detail
                              </BaseBtn>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
          <div class="dataTable-bottom">
              <div class="dataTable-info">
                  Total {{ programs.length }} entries
              </div>
              <nav class="dataTable-pagination">
                  <ul class="dataTable-pagination-list"></ul>
              </nav>
          </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import { getLoadedPrograms } from '@/api/api';
  
  export default {
    setup() {
      const programs = ref([]);
  
      onMounted(async () => {
        programs.value = await getLoadedPrograms();
      });
  
      return { programs };
    },
  };
  </script>