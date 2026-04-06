import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: null,
    avatar: '',
    token: '',
    username: '',
    menus: [],
    gender: null,
    roleId: null,
    roleName: ''
  }),
  getters: {
    getToken: (state) => state.token,
    getAvatar: (state) => state.avatar,
    getUsername: (state) => state.username
  },
  actions: {
    setUserInfo(info) {
      console.log('设置用户信息:', info)
      if (info && info.data) {
        const id = info.data.id || info.data.userId
        this.id = id ? Number(id) : null
        this.avatar = info.data.avatar || ''
        this.token = info.data.token || ''
        this.username = info.data.username || ''
        this.gender = info.data.gender ?? null
        this.roleId = info.data.roleId ? Number(info.data.roleId) : null
        this.roleName = info.data.roleName || ''
        
        if (info.data.menus) {
          this.menus = info.data.menus
        }
      }
    },
    clearUserInfo() {
      this.id = null
      this.avatar = ''
      this.token = ''
      this.username = ''
      this.menus = []
      this.gender = null
      this.roleId = null
      this.roleName = ''
    }
  },
  persist: {
    key: 'user-info',
    storage: localStorage,
    paths: ['id', 'avatar', 'token', 'username', 'menus', 'gender', 'roleId', 'roleName']
  }
})
