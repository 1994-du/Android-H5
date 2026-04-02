import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    avatar: '',
    token: '',
    username: '',
    menus: []
  }),
  getters: {
    getToken: (state) => state.token,
    getAvatar: (state) => state.avatar,
    getUsername: (state) => state.username
  },
  actions: {
    setUserInfo(info) {
      if (info && info.data) {
        this.avatar = info.data.avatar || ''
        this.token = info.data.token || ''
        this.username = info.data.username || ''
        
        if (info.data.menus) {
          this.menus = info.data.menus
        }
      }
    },
    clearUserInfo() {
      this.avatar = ''
      this.token = ''
      this.username = ''
      this.menus = []
    }
  },
  persist: {
    key: 'user-info',
    storage: localStorage,
    paths: ['avatar', 'token', 'username', 'menus']
  }
})
