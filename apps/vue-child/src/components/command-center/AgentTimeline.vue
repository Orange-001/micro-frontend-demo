<template>
  <ol class="cc-agent-steps">
    <li v-for="step in steps" :key="step.id" class="cc-agent-step" :class="`is-${step.status}`">
      <span class="cc-agent-dot" />
      <div class="cc-agent-body">
        <div class="cc-agent-head">
          <span>{{ step.title }}</span>
          <code>{{ step.tool }}</code>
        </div>
        <p>{{ step.detail }}</p>
        <small>{{ step.elapsed }}</small>
      </div>
    </li>
  </ol>
</template>

<script setup lang="ts">
import type { AgentStep } from '../../types/commandCenter';

defineProps<{
  steps: AgentStep[];
}>();
</script>
