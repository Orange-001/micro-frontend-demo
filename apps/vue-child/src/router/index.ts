import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import AboutView from '../views/AboutView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/about', name: 'about', component: AboutView }
];

export default createRouter({
  history: createWebHashHistory(),
  routes
});

