// index.js
import {
  APP_CONFIG,
  MAP_CONFIG
} from '../../config/app.config'
import {
  request
} from '../../request/index';
const util = require('../../utils/util.js')
// 引入SDK核心类
var QQMapWX = require('../../libs/qqmap-wx-jssdk/qqmap-wx-jssdk');

const app = getApp();
var qqmapsdk;

Page({
  data: {
    ...MAP_CONFIG,
    located: false,
    admin_division: {},
    current_city: {},
    location_city: {},
    followed_cities: [],
    interested_cities: [],
    merged_cities: [],
    date_time_struct: {},
    movable_view_direction: 'vertical',
    scroll_view_disabled: false,
    scroll_view_sliding: false,
    swiper_index: 0
  },
  // 点击地图事件
  onTapMap(event) {
    const {
      longitude,
      latitude
    } = event.detail
    request({
      url: APP_CONFIG.apis.admin_division.spatial_lookup,
      data: {
        location: 'POINT(' + longitude + ' ' + latitude + ')',
        spatialCapable: true
      }
    }).then(res => {
      this.switchCity({
        admin_division: {
          ...res.data[0]
        },
        switch_to_top: true
      })
    })

    console.log(`经度：${longitude}，维度：${latitude}`)
  },
  /**
   * 分享图片
   * @param {*} event 
   */
  onWeatherShare(event) {
    console.log(event)
    this.mapCtx.getRegion({
      success: res => {
        console.log(res)
        const current_node = this.data.merged_cities[this.data.current_index]
        const bounds = `${res.southwest.latitude},${res.southwest.longitude};${res.northeast.latitude},${res.northeast.longitude}`
        const wind = `${current_node.weather_real_time.windDir}${current_node.weather_real_time.windScale}级`
        const center = `${res.latitude},${res.longitude}`
        const aqi = current_node.air.category.length <= 2 ? current_node.air.category : current_node.air.category.substr(0, 2)
        request({
          url: APP_CONFIG.apis.poster.weather,
          data: {
            bounds,
            location: this.data.current_city.name,
            temperature: current_node.weather.temp,
            text: current_node.weather.text,
            wind,
            aqi,
            aqiColor: util.getAqiColor(current_node.air.category),
            center
          },
          method: 'POST'
        }).then(res => {
          console.log(res)
          wx.previewImage({
            current: res.data,
            urls: [res.data]
          })
        }).catch((err) => {
          wx.showToast({
            title: '图片获取失败',
            icon: 'error'
          })
        })
      },
      fail: err => {
        wx.showToast({
          title: '分享失败',
          icon: 'error'
        })
      }
    })
  },
  // 获取实时天气
  fetchRealTimeWeather(options) {
    const {
      longitude,
      latitude,
      index
    } = options
    let _location = '' + longitude + ',' + latitude;
    let merged_cities = this.data.merged_cities
    request({
      url: APP_CONFIG.apis.weather.real_time + _location,
    }).then((res) => {
      const {
        updateTime
      } = res.data
      merged_cities[index].weather_real_time = {
        ...res.data,
        updateTime: util.formatTime(new Date(updateTime)),
        ...util.deconstructionTime(updateTime)
      }
      this.setData({
        merged_cities
      })
    })
  },
  /**
   * 获取实时空气质量
   * @param {*} options 
   * @returns 
   */
  fetchRealTimeaAir(options) {
    const {
      longitude,
      latitude,
      index
    } = options
    let _location = '' + longitude + ',' + latitude;
    let merged_cities = this.data.merged_cities
    request({
      url: APP_CONFIG.apis.air.real_time + _location,
    }).then((res) => {
      merged_cities[index].air_real_time = res.data
      this.setData({
        merged_cities
      })
    })
  },
  fetchHourByHourWeather(options) {
    const {
      longitude,
      latitude,
      index
    } = options
    let _location = '' + longitude + ',' + latitude;
    let merged_cities = this.data.merged_cities
    request({
      url: APP_CONFIG.apis.weather.hour_by_hour + _location,
    }).then((res) => {
      this.setData({
        hour_by_hour: {
          ...res.data
        }
      })
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
      merged_cities[index].hour_by_hour = {
        x_arr,
        temp_arr,
        pop_arr
      }
      this.setData({
        merged_cities
      })
    })
  },
  fetchDayByDayWeather(options) {
    const {
      longitude,
      latitude,
      index
    } = options
    let _location = '' + longitude + ',' + latitude;
    let merged_cities = this.data.merged_cities
    request({
      url: APP_CONFIG.apis.weather.day_by_day + _location,
    }).then((res) => {
      merged_cities[index].day_by_day = {
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
        merged_cities
      })
    })
  },
  /**
   * 获取关注城市数据，并将结果放入 followed_cities 
   * @param {*} options 参数对象，目前仅对cached进行解析处理，意味是否通过缓存获取数据
   * @returns 
   */
  fetchFollowedCities(options) {
    return new Promise((resolve, reject) => {
      const {
        cached
      } = options;
      let completed = false;
      if (cached) {
        const cached_followed_cities = wx.getStorageSync(APP_CONFIG.constants.followed_cities);
        if (cached_followed_cities.length > 0) {
          this.setData({
            followed_cities: cached_followed_cities
          })
          completed = true;
          resolve(cached_followed_cities)
        } else {
          completed = false;
          console.log('无法从缓存中获取 followed_cities')
        }
      }
      if (!completed) {
        request({
          url: APP_CONFIG.apis.follow_city.list_by_subject_id
        }).then((res) => {
          const followed_cities = util.mapFollowcities(res.data)
          // 因 merge cities 可能会删除 followed_cities中数据，所以刷新缓存动作需要放置在setData前
          wx.setStorageSync(APP_CONFIG.constants.followed_cities, followed_cities)
          this.setData({
            followed_cities
          })
          resolve(followed_cities)
        }).catch((err) => {
          reject(err)
        })
      }
    })
  },
  slidingStart(e) {
    console.log(e)
    this.setData({
      start_y: e.touches[0].pageY * 0.97 - this.data.screenTop
    })
  },
  slidingEnd(e) {
    console.log(e)
    let {
      pageY
    } = e.changedTouches[0];
    pageY = pageY * 0.97 - this.data.screenTop;
    const disabled = this.data.scroll_view_sliding
    if (!disabled && Math.abs(pageY - this.data.start_y) > 30) {
      // 上滑
      if (this.data.start_y > pageY) {
        if (this.data.y != 0) {
          this.setData({
            y: 0,
            scroll_view_disabled: true
          })
        }
      }
      // 下滑
      if (this.data.start_y < pageY) {
        this.setData({
          y: this.data.max_y,
          scroll_view_disabled: false
        })
      }
    } else {
      this.setData({
        y: this.data.y
      })
    }
  },
  onLocation(e) {
    util.location().then((res) => {
      const {
        latitude,
        longitude
      } = res;
      request({
        url: APP_CONFIG.apis.admin_division.spatial_lookup,
        data: {
          location: 'POINT(' + longitude + ' ' + latitude + ')',
          spatialCapable: true
        }
      }).then((res) => {
        let admin_division = res.data[0]
        admin_division.centerPoint.coordinates[0] = longitude
        admin_division.centerPoint.coordinates[1] = latitude
        this.switchCity({
          admin_division,
          switch_to_top: true
        })
      })
    }).catch((err) => {
      this.switchCity({
        admin_division: this.data.location_city,
        switch_to_top: true
      })
    })
    this.setData({
      located: true
    })
  },
  swiperChangeHandler(event) {
    if (event.detail.source === 'touch') {
      const index = event.detail.current
      const _current_city = this.data.merged_cities[index]
      if (!_current_city.city.centerPoint) {
        const id = parseInt(event.detail.currentItemId);
        request({
          url: APP_CONFIG.apis.admin_division.query_by_id + id,
        }).then(res => {
          const merged_cities = this.data.merged_cities;
          merged_cities.forEach((item) => {
            if (item.city.id === res.data.id) {
              item.city = res.data
            }
          })
          this.setData({
            merged_cities
          })
          this.switchCity({
            admin_division: {
              ...res.data
            },
            index
          })
        })
      } else {
        this.switchCity({
          admin_division: _current_city.city,
          index
        })
      }
    }
  },
  // 监听视野变化
  onChangeRegion(event) {
    // 当前事件中没有causeBy属性
    if (event.type === 'end' && this.data.located) {
      this.mapCtx.getCenterLocation({
        success: res => {
          const _latitude = res.latitude;
          const _longitude = res.longitude;
          const {
            latitude,
            longitude
          } = this.data.location
          if (latitude != _latitude || longitude != _longitude) {
            this.setData({
              located: false
            })
          }
        }
      });

    }
  },
  onFollow(event) {
    const temp_city = this.data.merged_cities.filter(item => event.detail.divisionId === item.city.id)[0]
    if (temp_city && !temp_city.followed) {
      request({
        url: APP_CONFIG.apis.follow_city.follow,
        data: {
          ...event.detail,
          state: 'Focus'
        },
        method: 'POST'
      }).then(res => {
        const interested_cities = this.data.interested_cities
        interested_cities.forEach(item => {
          if (event.detail.divisionId === item.city.id) {
            item.followed = true;
          }
        })
        this.setData({
          interested_cities
        })
      })
    } else {
      console.log('follow completed.')
    }
  },
  // 切换城市
  switchCity(options) {
    const {
      coordinates
    } = options.admin_division.centerPoint;
    let _index = options.index;
    if (options.switch_to_top) {
      const {
        interested_cities,
        merged_cities
      } = this.data
      let followed = false;
      merged_cities.forEach(item => {
        if (item.city.id === options.admin_division.id) {
          followed = item.followed
        }
      })
      interested_cities.forEach((item, index, object) => {
        if (item.city.id === options.admin_division.id) {
          object.splice(index, 1)
        }
      })
      interested_cities.unshift({
        city: options.admin_division,
        followed
      })
      _index = 0
      this.setData({
        interested_cities
      })
    }
    this.setData({
      location: {
        longitude: coordinates[0],
        latitude: coordinates[1]
      },
      scale: MAP_CONFIG.scale,
      current_city: options.district,
      date_time_struct: util.deconstructionTime(new Date())
    })
    const params = {
      longitude: coordinates[0],
      latitude: coordinates[1],
      index: _index
    }
    this.fetchRealTimeWeather(params)
    this.fetchRealTimeaAir(params)
    this.fetchHourByHourWeather(params)
    this.fetchDayByDayWeather(params)
    // 必须先完成跳转页面数据设定动作，最后进行跳转索引设置，避免swiper前后来回跳转导致未能达到正确的页面跳转效果问题
    this.setData({
      swiper_index: _index,
    })
  },
  followCitiesRefreshEvenHandler(options) {
    const {
      reflush
    } = options;
    if (options.un_follow_id) {
      const interested_cities = this.data.interested_cities
      for (let index = interested_cities.length - 1; index >= 0; index--) {
        if (interested_cities[index].city.id === options.un_follow_id) {
          interested_cities.splice(index, 1)
        }
      }
      if (interested_cities.length === 0) {
        interested_cities.push({
          city: this.data.location_city
        })
      }
    }
    if (reflush) {
      request({
        url: APP_CONFIG.apis.follow_city.list_by_subject_id
      }).then(res => {
        const followed_cities = util.mapFollowcities(res.data)
        // 因 merge cities 可能会删除 followed_cities中数据，所以刷新缓存动作需要放置在setData前
        wx.setStorageSync(APP_CONFIG.constants.followed_cities, followed_cities)
        this.setData({
          followed_cities
        })
        const params = {
          ...this.data.location,
          index: this.data.swiper_index
        }
        this.fetchRealTimeWeather(params)
        this.fetchRealTimeaAir(params)
        this.fetchHourByHourWeather(params)
        this.fetchDayByDayWeather(params)
      })
    }
  },
  // 页面跳转，城市选择, 消息通道绑定
  onChoose(e) {
    console.log(e)
    console.log('页面跳转 --> city')
    wx.navigateTo({
      url: '../city/city',
      events: {
        acceptSwithCityData: this.switchCity,
        refreshEvent: this.followCitiesRefreshEvenHandler,
      }
    })
  },
  // 刷新天气数据（根据当前地图中心点）
  onFlush(event) {
    this.setData({
      date_time_struct: util.deconstructionTime(new Date())
    })
    const params = {
      ...this.data.location,
      index: this.data.swiper_index
    }
    this.fetchRealTimeWeather(params)
    this.fetchRealTimeaAir(params)
    this.fetchHourByHourWeather(params)
    this.fetchDayByDayWeather(params)
  },
  dragEndHandler(event) {
    console.log(event)
    // this.setData({
    //   scroll_view_sliding: true
    // })
  },
  scroll(event) {
    console.log(event)
  },
  scrollToUpperHandler(event) {
    console.log(event)
    this.setData({
      scroll_view_sliding: false
    })
  },
  scrollToLowerHandler(event) {
    console.log(event)
    this.setData({
      scroll_view_sliding: true
    })
  },
  onShareAppMessage: res => {
    return {
      title: 'Fuyi Weather 一个结合地理信息的天气小程序！',
      path: '/pages/index/index',
      success: function (res) {
        console.log(res)
      },
      fail: function (err) {
        console.log(err)
      }
    }
  },
  onShareTimeline: function () {
    return {
      title: 'Fuyi Weather',
      query: {},
      imageUrl: ''
    }
  },
  /**
   * 1、初始化地图
   * 2、初始化布局参数
   * 3、获取定位数据
   * 4、根据定位数据获取当前所在区域
   * 5、获取关注城市数据（关注城市followed_cities与临时点击新增城市interested_cities分开存储）
   * ，最终由两者合成城市列表（merged_cities） 其中，关注城市由服务接口提供，可使用缓存
   * ，但需要保持与远端的数据同步
   * 6、获取当前城市的天气数据（实时、24小时、7天）
   */
  init() {
    this.watch(this.mergeCities)
    // this.mergedCitiesWatch(this.correctSwiperShow)
    wx.showLoading({
      title: 'Loading...',
      mask: true
    })
    util.location().then((res) => {
      const {
        latitude,
        longitude
      } = res;
      this.setData({
        location: {
          latitude,
          longitude
        },
        location_coordinates: [longitude, latitude]
      })
      return request({
        url: APP_CONFIG.apis.admin_division.spatial_lookup,
        data: {
          location: 'POINT(' + longitude + ' ' + latitude + ')',
          spatialCapable: true
        }
      })
    }).then((_res) => {
      this.setData({
        located: true,
        location_city: _res.data[0],
        interested_cities: _res.data.map(item => ({
          ...item,
          centerPoint: {
            coordinates: this.data.location_coordinates,
            type: 'Point'
          },
          followed: false
        }))
      })
    }).then(() => {
      return this.fetchFollowedCities({
        cached: false
      })
    }).then(() => {
      wx.hideLoading()
      this.setData({
        current_city: this.data.merged_cities[0].city,
        date_time_struct: util.deconstructionTime(new Date())
      })
      const coordinates = this.data.merged_cities[0].city.centerPoint.coordinates
      const params = {
        longitude: coordinates[0],
        latitude: coordinates[1],
        index: 0
      }
      this.fetchRealTimeWeather(params)
      this.fetchRealTimeaAir(params)
      this.fetchHourByHourWeather(params)
      this.fetchDayByDayWeather(params)

      console.log('Init completed.')
    }).catch(err => {
      console.log(err)
      wx.showToast({
        title: '初始化数据失败',
        icon: 'error'
      })
    })

    // 实例化API核心类
    qqmapsdk = new QQMapWX({
      key: this.data.key
    });
    this.mapCtx = wx.createMapContext('qq_map_wx', this);
    wx.getSystemInfo({
      complete: (res) => {
        this.setData({
          screenHeight: util.px2rpx(res.screenHeight, res.screenWidth),
          screenWidth: util.px2rpx(res.screenWidth, res.screenWidth),
          screenTop: res.screenTop ? res.screenTop : 0,
          originScreenHeight: res.screenHeight,
          windowHeight: res.windowHeight,
          y: 0.608 * res.windowHeight,
          max_y: 0.608 * res.windowHeight
        })
      },
    })
  },
  /**
   * 用于合并interested_cities与followed_cities，合并为merged_cities，作为最终的城市列表数据
   * @param {*} params 
   */
  mergeCities: function (params) {
    let {
      interested_cities,
      followed_cities
    } = this.data
    if (interested_cities.length > 0) {
      for (let out_index = followed_cities.length - 1; out_index >= 0; out_index--) {
        for (let index = interested_cities.length - 1; index >= 0; index--) {
          if (followed_cities[out_index].city.code === interested_cities[index].code) {
            interested_cities[index] = {
              ...followed_cities[out_index],
              city: {
                ...interested_cities[index],
                ...followed_cities[out_index].city
              }
            }
            followed_cities.splice(out_index, 1)
            break
          }
        }
      }
    }
    const merged_cities = [...interested_cities, ...followed_cities]
    this.setData({
      merged_cities
    })
    return merged_cities;
  },
  /**
   * 数据监听器，对interested_cities与followed_cities进行监听，用于实时合并数据
   * @param {*} callback 回调函数，在监听对象发生变化时调用
   */
  watch: function (callback) {
    var _data = this.data;

    Object.defineProperty(_data, "followed_cities", {
      enumerable: true,
      configurable: true,
      set: function (value) {
        this._followed_cities = value;
        callback(value);
      },
      get: function () {
        if (this._followed_cities) {
          return this._followed_cities
        } else {
          return []
        }
      }
    });

    Object.defineProperty(_data, "interested_cities", {
      enumerable: true,
      configurable: true,
      set: function (value) {
        this._interested_cities = value;
        callback(value);
      },
      get: function () {
        if (this._interested_cities) {
          return this._interested_cities
        } else {
          return []
        }
      }
    });
  },
  onLoad() {
    if (app.globalData.hasLogged) {
      this.init()
    } else {
      app.watch((params) => {
        this.init()
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

    if (this.data.admin_division && this.data.admin_division.centerPoint) {
      this.acceptDataForSwitchCity({
        data: {
          ...this.data.admin_division
        }
      })
    }
  },
})