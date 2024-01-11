// components/weather/weather-card/weather-card.js
import { APP_CONFIG } from '../../../config/app.config'
import { request } from '../../../request/index';
const util = require('../../../utils/util')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    region: {
      type: Object,
      value: {}
    },
    followed: {
      type: Boolean,
      value: false
    },
    scrollViewDisabled: {
      type: Boolean,
      value: false
    },
    windowHeight: {
      type: Number,
      value: 0
    }
  },
  observers: {
    'region': function (_region) {
      if (_region && Object.keys(_region).length > 0) {
        const last_region = this.data.last_region;
        if (last_region == null || Object.keys(last_region).length === 0) {
          this.init(_region)
          return
        }
        // if (_region.id != last_region.id) {
        //   this.init(_region)
        //   return
        // }
      }
    },
    'scrollViewDisabled': function (_scrollViewDisabled) {
      this.setData({
        scroll_view_disabled: _scrollViewDisabled
      })
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    last_region: {},
    weather_real_time: {},
    air_real_time: {},
    hour_by_hour: {},
    day_by_day: {},
    locaion_coordinates: {},
    scroll_view_disabled: false,
    scroll_view_sliding: false,
    date_time_struct: util.deconstructionTime(new Date())
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
    attached: function () {
      // const region = this.data.region
      // if(region && Object.keys(region).length > 0){
      //   this.init(this.data.region)
      // }
    },
    moved: function () { },
    detached: function () { },
  },

  pageLifetimes: {
    show: function () {
    },
    hide: function () {
      // 页面被隐藏
    },
    resize: function (size) {
      // 页面尺寸变化
    }
  },

  ready() {
  },
  /**
   * 组件的方法列表
   */
  methods: {

    init(region) {
      if (region == null) {
        return
      }
      const { locaion_coordinates } = this.data;
      if (Object.keys(locaion_coordinates).length === 0) {
        const id = parseInt(region.id)
        request({
          url: APP_CONFIG.apis.admin_division.query_by_id + id,
        }).then(res => {
          const _coordinates = res.data.centerPoint.coordinates
          const params = { longitude: _coordinates[0], latitude: _coordinates[1] }
          this.setData({
            locaion_coordinates: params
          })
          this.flush(params)
        }).catch(err => {
          wx.showToast({
            title: '行政区划数据获取失败',
            icon: 'error'
          })
        })
      } else {
        this.flush(locaion_coordinates)
      }
      this.setData({
        last_region: region
      })
    },

    onFollow(event) {
      let region = this.data.region
      if (region && !region.followed) {
        request({
          url: APP_CONFIG.apis.follow_city.follow,
          data: {
            ...event.detail,
            state: 'Focus'
          },
          method: 'POST'
        }).then(res => {
          region.followed = true
          this.setData({
            region
          })
        }).catch(err => {
          wx.showToast({
            title: '关注城市失败',
            icon: 'error'
          })
        })
      } else {
        console.log('follow completed.')
      }
    },

    onFlush(event) {
      const { locaion_coordinates } = this.data;
      if (Object.keys(locaion_coordinates).length === 0) {
        return
      }
      this.flush(locaion_coordinates)
    },

    flush(options) {
      if (options == null) {
        return
      }
      this.setData({
        date_time_struct: util.deconstructionTime(new Date())
      })
      this.fetchRealTimeWeather(options)
      this.fetchRealTimeaAir(options)
      this.fetchHourByHourWeather(options)
      this.fetchDayByDayWeather(options)
    },

    // 获取实时天气
    fetchRealTimeWeather(options) {
      const { longitude, latitude } = options
      let _location = '' + longitude + ',' + latitude;
      request({
        url: APP_CONFIG.apis.weather.real_time + _location,
      }).then((res) => {
        const { updateTime } = res.data
        const weather_real_time = {
          ...res.data,
          updateTime: util.formatTime(new Date(updateTime)),
          ...util.deconstructionTime(updateTime)
        }
        this.setData({
          weather_real_time
        })
        this.triggerEvent('fetchweatherData', {
          id: this.data.region.id,
          source: weather_real_time
        }, { bubbles: true, composed: true })
      }).catch(err => {
        wx.showToast({
          title: '获取实时天气数据失败',
          icon: 'error'
        })
      })
    },
    /**
     * 获取实时空气质量
     * @param {*} options 
     * @returns 
     */
    fetchRealTimeaAir(options) {
      const { longitude, latitude } = options
      let _location = '' + longitude + ',' + latitude;
      request({
        url: APP_CONFIG.apis.air.real_time + _location,
      }).then((res) => {
        const air_real_time = res.data
        this.setData({
          air_real_time
        })
        this.triggerEvent('fetchairdata', {
          id: this.data.region.id, source: air_real_time
        }, { bubbles: true, composed: true })
      }).catch(err => {
        wx.showToast({
          title: '获取实时空气质量数据失败',
          icon: 'error'
        })
      })
    },
    fetchHourByHourWeather(options) {
      const { longitude, latitude } = options
      let _location = '' + longitude + ',' + latitude;
      request({
        url: APP_CONFIG.apis.weather.hour_by_hour + _location,
      }).then((res) => {
        const x_arr = res.data.map(item => new Date(item.fxTime).getHours())
        const temp_arr = res.data.map(item => parseInt(item.temp))
        const pop_arr = res.data.map(item => {
          const pop = item.pop;
          if (pop) {
            return parseInt(item.pop);
          } else {
            return 0;
          }
        })
        const hour_by_hour = { x_arr, temp_arr, pop_arr }
        this.setData({
          hour_by_hour
        })
      }).catch(err => {
        wx.showToast({
          title: '获取24小时天气预报数据失败',
          icon: 'error'
        })
      })
    },
    fetchDayByDayWeather(options) {
      const { longitude, latitude } = options
      let _location = '' + longitude + ',' + latitude;
      request({
        url: APP_CONFIG.apis.weather.day_by_day + _location,
      }).then((res) => {
        const day_by_day = {
          ...res.data.map(item => {
            if (new Date().getDate() === new Date(item.fxDate).getDate()) {
              item.day_of_week = '今天'
            } else {
              item.day_of_week = util.dayOfTheWeek(item.fxDate)
            }
            return item
          })
        }
        this.setData({
          day_by_day
        })
      }).catch(err => {
        wx.showToast({
          title: '获取7天天气预报数据失败',
          icon: 'error'
        })
      })
    },

    dragEndHandler(event) {
    },
    scroll(event) {
    },
    scrollToUpperHandler(event) {
      this.setData({
        scroll_view_sliding: false
      })
      this.triggerEvent('scrollslidingstatus', { status: false })
    },
    scrollToLowerHandler(event) {
      this.setData({
        scroll_view_sliding: true
      })
      this.triggerEvent('scrollslidingstatus', { status: true })
    },
  }
})