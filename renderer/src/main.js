import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import './styles/index.scss';

// 导入 Electron API
const electronAPI = window.electronAPI || {};

// 全局挂载
const app = createApp(App);

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 注册全局属性
app.config.globalProperties.$electron = electronAPI;
app.config.globalProperties.$dbPath = electronAPI.getAppPath ? `${electronAPI.getAppPath()}/data` : './data';

// 挂载插件
app.use(createPinia());
app.use(router);
app.use(ElementPlus);

app.mount('#app');