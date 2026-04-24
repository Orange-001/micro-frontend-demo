<template>
  <div class="vc-page">
    <div class="vc-card vc-head">
      <div class="vc-head-row">
        <div class="vc-brand">Vue 子应用（Pinia + Vue Router）</div>
        <div class="vc-nav-links">
          <i class="vc-iconfont vc-icon-bangqiu" aria-hidden="true" style="font-size: 18px" />
          <router-link to="/" class="vc-link"> 首页 </router-link>
          <router-link to="/about" class="vc-link"> 关于 </router-link>
        </div>
      </div>
    </div>

    <div class="vc-card vc-counter-card">
      <h3 class="vc-card-title">Pinia 示例</h3>
      <div class="vc-counter-row">
        <div class="vc-counter-value">count: {{ counter.count }}</div>
        <el-button type="primary" @click="addWithMessage"> +1 </el-button>
      </div>
    </div>

    <div class="vc-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { ElMessage } from 'element-plus/es/components/message/index';
import { useCounterStore } from './stores/counter';

const counter = useCounterStore();
const mountContainer = inject<HTMLElement>('mfeMountContainer');

const addWithMessage = () => {
  counter.increment();
  ElMessage({
    type: 'success',
    message: 'vue-child: 调用了 Element Plus ElMessage',
    appendTo: mountContainer ?? document.body,
  });
};
</script>
