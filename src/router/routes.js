export default [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      showHeader: false,
      showTabbar: false
    }
  },
  {
    path: '/public-chat',
    name: 'PublicChat',
    component: () => import('@/views/PublicChat.vue'),
    meta: {
      title: '公共聊天',
      showBack: false,
      showTabbar: true,
      showHeaderAction: 'online-users',
      requiresAuth: true
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: {
      title: '我的',
      showBack: false,
      showTabbar: true,
      requiresAuth: true
    }
  },
  {
    path: '/profile/edit',
    name: 'ProfileEdit',
    component: () => import('@/views/ProfileEdit.vue'),
    meta: {
      title: '编辑资料',
      headerBgColor: '#1989fa',
      requiresAuth: true
    }
  },
  {
    path: '/nine-ball',
    name: 'NineBall',
    component: () => import('@/views/NineBall.vue'),
    meta: {
      title: '九球计分',
      showBack: false,
      showTabbar: true,
      requiresAuth: true
    }
  },
  {
    path: '/jump-game',
    name: 'JumpGame',
    component: () => import('@/views/JumpGame.vue'),
    meta: {
      title: '跳一跳',
      requiresAuth: true
    }
  },
  {
    path: '/user-select',
    name: 'UserSelect',
    component: () => import('@/views/UserSelect.vue'),
    meta: {
      title: '选人页面',
      customBack: true,
      requiresAuth: true
    }
  }
]
