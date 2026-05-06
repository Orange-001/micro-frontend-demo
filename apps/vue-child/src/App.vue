<template>
  <div class="vc-page">
    <header class="vc-topbar">
      <router-link to="/" class="vc-brand">Vue AI Command</router-link>
      <nav class="vc-nav-links" aria-label="Vue 子应用导航">
        <router-link to="/" class="vc-link">调度工作台</router-link>
        <router-link to="/about" class="vc-link">方案说明</router-link>
      </nav>
    </header>

    <router-view />
  </div>
</template>
