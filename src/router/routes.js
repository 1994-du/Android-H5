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
      title: '登录'
    }
  },
  {
    path: '/public-chat',
    name: 'PublicChat',
    component: () => import('@/views/PublicChat.vue'),
    meta: {
      title: '公共聊天',
      requiresAuth: true
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: {
      title: '我的',
      requiresAuth: true
    }
  },
  {
    path: '/profile/edit',
    name: 'ProfileEdit',
    component: () => import('@/views/ProfileEdit.vue'),
    meta: {
      title: '编辑资料',
      requiresAuth: true
    }
  },
  {
    path: '/nine-ball',
    name: 'NineBall',
    component: () => import('@/views/NineBall.vue'),
    meta: {
      title: '九球计分',
      requiresAuth: true
    }
  },
  {
    path: '/user-select',
    name: 'UserSelect',
    component: () => import('@/views/UserSelect.vue'),
    meta: {
      title: '选人页面',
      requiresAuth: true
    }
  },
  {
    path: '/card-type',
    name: 'CardType',
    component: () => import('@/views/CardType.vue'),
    meta: {
      title: '卡片类型',
      requiresAuth: true
    }
  },
  {
    path: '/issue-card',
    name: 'IssueCard',
    component: () => import('@/views/IssueCard.vue'),
    meta: {
      title: '发卡',
      requiresAuth: true
    }
  }
]
