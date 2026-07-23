const viewLoaders = {
  PublicChat: () => import('@/views/PublicChat.vue'),
  NineBall: () => import('@/views/NineBall.vue'),
  About: () => import('@/views/About.vue'),
  ProfileEdit: () => import('@/views/ProfileEdit.vue'),
  JumpGame: () => import('@/views/JumpGame.vue'),
  UserSelect: () => import('@/views/UserSelect.vue')
}

export const tabbarRoutes = [
  {
    path: '/public-chat',
    name: 'PublicChat',
    component: viewLoaders.PublicChat,
    meta: {
      title: '公共聊天',
      showBack: false,
      showTabbar: true,
      tabbarIcon: 'chat-o',
      tabbarOrder: 10,
      showHeaderAction: 'online-users'
    }
  },
  {
    path: '/nine-ball',
    name: 'NineBall',
    component: viewLoaders.NineBall,
    meta: {
      title: '九球计分',
      showBack: false,
      showTabbar: true,
      tabbarIcon: 'records-o',
      tabbarOrder: 20
    }
  },
  {
    path: '/about',
    name: 'About',
    component: viewLoaders.About,
    meta: {
      title: '我的',
      showBack: false,
      showTabbar: true,
      tabbarIcon: 'user-o',
      tabbarOrder: 30,
      keepAlive: true
    }
  }
]

export const appRoutes = [
  {
    path: '/',
    redirect: '/public-chat'
  },
  ...tabbarRoutes,
  {
    path: '/profile/edit',
    name: 'ProfileEdit',
    component: viewLoaders.ProfileEdit,
    meta: {
      title: '编辑资料',
      headerBgColor: '#1989fa'
    }
  },
  {
    path: '/jump-game',
    name: 'JumpGame',
    component: viewLoaders.JumpGame,
    meta: {
      title: '跳一跳'
    }
  },
  {
    path: '/user-select',
    name: 'UserSelect',
    component: viewLoaders.UserSelect,
    meta: {
      title: '选人页面',
      customBack: true,
      public: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/public-chat'
  }
]

export default appRoutes
