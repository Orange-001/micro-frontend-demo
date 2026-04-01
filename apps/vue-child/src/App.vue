<template>
  <div class="page p-4">
    <div class="card head">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12">
        <div style="font-weight: 700">Vue 子应用（Pinia + Vue Router）</div>
        <div style="display: flex; align-items: center; gap: 10px">
          <i class="vc-iconfont vc-icon-bangqiu" aria-hidden="true" style="font-size: 18px" />
          <router-link to="/" class="link"> 首页 </router-link>
          <router-link to="/about" class="link"> 关于 </router-link>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 12px">
      <h3 style="margin-top: 0">Pinia 示例</h3>
      <div style="display: flex; align-items: center; gap: 12">
        <div style="fontsize: 18px">count: {{ counter.count }}</div>
        <el-button type="primary" @click="addWithMessage"> +1 </el-button>
      </div>
    </div>

    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { ElMessage } from 'element-plus';
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
