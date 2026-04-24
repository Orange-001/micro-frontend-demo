import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import AboutView from '../views/AboutView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/about', name: 'about', component: AboutView },
];

export function createAppRouter(basename = '/') {
  return createRouter({
    history: createWebHistory(basename),
    routes,
  });
}

export default createAppRouter();
