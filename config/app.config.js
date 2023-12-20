export const APP_CONFIG = {
  base_url: 'http://127.0.0.1:18080/v1/',
  apis: {
    oauth: {
      we_chat: 'oauth/we_chat',
    },
    admin_division: {
      spatial_lookup: 'admin_divisions/spatial/lookup',
      full_text_search: 'admin_divisions/search',
      query_by_id: 'admin_divisions/auto_incr/'
    },
    weather: {
      real_time: 'city_weather/',
      day_by_day: 'city_weather/7d/',
      hour_by_hour: 'city_weather/24h/'
    },
    air: {
      real_time: 'air/'
    },
    follow_city: {
      follow: 'follow_cities/follow',
      un_follow: 'follow_cities/',
      list_by_subject_id: 'follow_cities',
    },
    poster: {
      weather: 'posters/weather',
    }
  },
  constants: {
    auth_token: 'auth_token',
    followed_cities: 'followed_cities'
  }
}

export const MAP_CONFIG = {
  key: 'ZFYBZ-2JICQ-KLW5C-GEFGJ-3TXMS-4DB5G',
  style: '1',
  location: {
    latitude: 30.27415,
    longitude: 120.15515
  },
  scale: 12, // 缩放级别，取值范围为3-20
  showScale: true, // 显示比例尺，工具暂不支持
  showCompass: false, // 显示指南针
  showLocation: true, // 显示带有方向的当前定位点
  enableSatellite: false, // 是否开启卫星图
  // 配置项
  setting: {
    rotate: 0,
    skew: 0,
    enableRotate: true,
  }
}