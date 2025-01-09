<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import IndexedDBHelper from '@/utils/indexedDBHelper';
import SearchIcon from '@/assets/search.svg'
import SettingIcon from '@/assets/setting.svg'
import resetIcon from '@/assets/reset.svg'
import BingIcon from '@/assets/bing.svg'

const searchInput = ref<string>('');
const search = () => {
  if (!searchInput.value) return;
  location.href = `https://www.bing.com/search?q=${searchInput.value}`;
};

const dbHelper = new IndexedDBHelper('CBT_DB', 'Wallpaper');

// 时间
const time = ref<string>('');
const updateTime = () => {
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  time.value = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
};
updateTime();
// 计时器
const timer = setInterval(() => {
  updateTime();
}, 1000);

const addWatchKeydown = () => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      search();
    }
  });
};
const removeWatchKeydown = () => {
  document.removeEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      search();
    }
  });
};
onMounted(async () => {
  addWatchKeydown();
  setDrawerHeight();
  await dbHelper.openDB();
  await getAllData();
  storage.getItem<number>("local:selectBg").then((res) => {
    if (res) {
      dbHelper.getData(res).then((data) => {
        bgData.value = {
          id: data.id,
          name: data.name,
          type: data.type,
          data: URL.createObjectURL(new Blob([data.data], { type: data.type }))
        };
      });
    }
  });
})
onUnmounted(() => {
  removeWatchKeydown();
  clearInterval(timer);
})


const showDrawer = ref(false);
const settingBox = ref<HTMLElement | null>(null);
const drawertyle = reactive({
  height: '0px'
})
const updataStyle = reactive({
  width: '0px',
  height: '0px',
  margin: '0px'
})

const setDrawerHeight = () => {
  if (settingBox.value) {
    const settingBoxRect = settingBox.value.getBoundingClientRect()
    const innerHeight = window.innerHeight;
    const innerWidth = window.innerWidth;
    const gapY = innerHeight - settingBoxRect.bottom;
    const gapX = innerWidth - settingBoxRect.right;
    drawertyle.height = `${innerHeight - (gapY * 2 + settingBoxRect.height)}px`;
    updataStyle.margin = `${gapY}px ${0}px ${gapY}px ${gapX}px`;
    updataStyle.height = `${settingBoxRect.height}px`;
    updataStyle.width = `calc(100% - ${settingBoxRect.width + gapX * 3}px)`;
  }
}

const handleFileChange = async (event: Event) => {
  const inputElement = event.target as HTMLInputElement;
  if (inputElement.files && inputElement.files.length > 0) {
    const file = inputElement.files[0];
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      const fileData = e.target?.result;
      if (fileData) {
        const id = await dbHelper.addData({ name: file.name, type: file.type, data: fileData });
        await getAllData();
        // 重置input
        inputElement.value = '';
      }
    };
    fileReader.readAsArrayBuffer(file);
  } else {
    console.warn('No file selected');
  }
}

type backgroundType = {
  id: number;
  name: string;
  type: string;
  data: string;
}

const backgroundList = ref<backgroundType[]>([]);
const bgData = ref<backgroundType>({ id: 0, name: '', type: '', data: '' });
const handleSelectBg = (item: backgroundType) => {
  if (bgData.value.id === item.id) return;
  bgData.value = item;
  storage.setItem("local:selectBg", item.id);
  showDrawer.value = false;
}

const resetData = async () => {
  await dbHelper.clearData();
  backgroundList.value = [];
  bgData.value = { id: 0, name: '', type: '', data: '' };
  storage.removeItem("local:selectBg");
}

const getAllData = async () => {
  const allData = await dbHelper.getAllData();
  backgroundList.value = allData.map((item: any) => {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      data: URL.createObjectURL(new Blob([item.data], { type: item.type }))
    };
  });
  if (backgroundList.value.length == 1) {
    bgData.value = backgroundList.value[0];
  }
}

</script>

<template>
  <div class="page" @click="showDrawer = false">
    <div class="cb-container">
      <div class="cb-time-box">{{ time }}</div>
      <div class="cb-search-box flex align-center">
        <div class="cb-search-select">
          <bing-icon class="cb-search-select-icon" />
        </div>
        <input class="cb-search-input" type="text" v-model.trim="searchInput" />
        <button class="cb-search-button" @click="search">
          <search-icon class="cb-search-button-icon" />
        </button>
      </div>
    </div>
    <div class="cb-setting-box" ref="settingBox" :class="{ show: showDrawer }" @click.stop="showDrawer = !showDrawer">
      <setting-icon class="cb-setting-icon" />
    </div>
    <div class="cb-drawer-box" :class="{ show: showDrawer }" @click.stop>
      <div class="cb-drawer-content" :style="{ height: drawertyle.height }">
        <div
          class="bg-item"
          v-for="item in backgroundList" :key="item.id"
          :class="{ active: bgData.id === item.id }"
          @click="handleSelectBg(item)"
        >
          <div class="image" v-if="item.type.includes('image')" :style="{ backgroundImage: `url(${item.data})` }"></div>
          <video class="video" v-else :src="item.data"></video>
        </div>
      </div>
      <div class="tools-box" :style="updataStyle">
        <div class="updata-box" >
          上传背景
          <input type="file" accept="image/*,video/*" class="updata-input" @change="handleFileChange" />
        </div>
        <div class="reset-box" @click="resetData"><reset-icon class="reset-icon" /></div>
      </div>
    </div>
    <div class="background-box">
      <div class="background-img" v-if="bgData.type.includes('image')" :style="{ backgroundImage: `url(${bgData.data})` }"></div>
      <video class="background-video" v-else  autoplay muted loop :src="bgData.data"></video>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.cb-container {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
}

.cb-time-box {
  user-select: none;
  font-size: 4rem;
  color: #fff;
  opacity: 0.75;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
}

.cb-search-box {
  max-width: 750px;
  width: var(--input-box-width);
  height: var(--input-box-height);
  margin: 2vh 0;
  overflow: hidden;
  border: var(--border);
  border-radius: var(--search-radius);
  backdrop-filter: blur(calc(4px * 0.95));
}

.cb-search-box .cb-search-select {
  /* cursor: pointer; */
  padding: 8px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cb-search-box .cb-search-select .cb-search-select-icon {
  width: 2rem;
  height: auto;
  filter: drop-shadow(1px 1px 3px rgba(59, 189, 245, 0.6));
}

.cb-search-box .cb-search-input {
  height: 100%;
  font-size: 18px;
  /* padding: 0 .6rem; */
  flex: 1;
}

.cb-search-box .cb-search-button {
  height: 100%;
  border-left: var(--border);
  padding: 0 1rem;
  flex: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cb-search-box .cb-search-button .cb-search-button-icon {
  width: 2rem;
  opacity: 0.85;
  height: auto;
  transition: scale 0.2s ease-in-out, opacity 0.2s ease-in-out;
  filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.6));
}

.cb-search-box .cb-search-button:hover .cb-search-button-icon {
  opacity: 0.75;
}

.cb-search-box .cb-search-button:active .cb-search-button-icon {
  scale: 0.65;
}

.cb-setting-box {
  cursor: pointer;
  width: 50px;
  height: 50px;
  backdrop-filter: blur(calc(4px* 0.95));
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 5;
  border-radius: var(--search-radius);
  border: var(--border);
  margin: 10px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cb-setting-box.show {
  opacity: 1;
  z-index: 1001;
}

.cb-setting-box:hover {
  opacity: 1;
}

.cb-setting-box .cb-setting-icon {
  width: 2rem;
  height: 2rem;
  color: #fff;
  filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.6));
  transition: scale 0.2s ease-in-out;
}

.cb-setting-box:active .cb-setting-icon {
  scale: 0.85;
}

.cb-drawer-box {
  width: 300px;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  border: var(--border);
  backdrop-filter: blur(35px);
  transform: translateX(100%);
  transition: transform 0.35s ease-in-out;
}

.cb-drawer-box.show {
  transform: translateX(0);
}

.cb-drawer-content {
  width: 100%;
  padding: 10px;
}

.bg-item {
  cursor: pointer;
  width: 100%;
  aspect-ratio: 1920 / 960;
  border-radius: var(--search-radius);
  overflow: hidden;
  margin-bottom: 10px;
}
.bg-item .image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
}
.bg-item .video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.bg-item.active {
  border: 2px solid #fff;
}

.tools-box {
  position: absolute;
  left: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
.updata-box, .reset-box {
  height: 100%;
  padding: 0 10px;
  position: relative;
  border: var(--border);
  border-radius: var(--search-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  font-size: 1.2rem;
  color: #fff;
  opacity: 0.75;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.7);
}
.updata-box {
  flex: 1;
}
.reset-box {
  margin-left: 10px;
  flex: 0;
}
.reset-icon {
  width: 1.5rem;
  height: auto;
}

.updata-box .updata-input {
  opacity: 0;
  position: absolute;
  inset: 0;
  cursor: pointer;
}

.background-box {
  position: fixed;
  inset: 0;
  z-index: -1;
}
.background-img {
  width: 100%;
  height: 100%;
  background-position: center center;
  background-size: cover;
}
.background-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

video {
  position: relative;
}
video::before {
  content: "";
  position: absolute;
  inset: 0;
}
</style>
