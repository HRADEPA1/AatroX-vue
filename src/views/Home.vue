<template>
  <div>
    <h1>Home</h1>
    <button @click="inc">Increment</button>
    <p>Counter: {{ counter }}</p>
    <p>Counter * 2: {{ times2 }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const counter = ref(0)

const inc = () => {
  counter.value++
}

const times2 = computed(() => counter.value * 2)

</script>
<!-- <template>
  <h5>{{ counter }} x 2 = {{ times2 }}</h5>
  <button @click="inc">Increment</button>
</template>

<script setup>
import { useState, useGetters, useMutations } from '../store/helper'

  const { counter } = useState(['counter'])
  const { times2 } = useGetters(['times2'])
  const { setCounter } = useMutations(['setCounter'])
  const inc = () => setCounter(counter.value + 1)

  return { inc, counter, times2, setCounter }

  

</script>

<style lang="scss" scoped>
  $primary: #A12568;
  .text-primary {
    color: $primary;
  }
</style> -->