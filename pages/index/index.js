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
    // 给swiper使用
    current_city: {},
    location_city: {},
    // 记录定位的坐标数据 精度在前，纬度在后
    location_coordinates: [],
    followed_cities: [],
    interested_cities: [],
    merged_cities: [],
    movable_view_direction: 'vertical',
    scroll_view_disabled: false,
    scroll_view_sliding: false,
    // 外部城市的临时位置，在merge回调中根据该值进行current的调整
    outer_index: 0,
    // 是否进行干预
    intervene: false,
    // 外部控制内部使用的current
    current: 0,
    // 内部swiper的current
    current_index: 0
  },
  // 点击地图事件
  onTapMap(event) {
    const {
      longitude,
      latitude
    } = event.detail
    this.setData({
      location: { longitude, latitude },
      scale: MAP_CONFIG.scale
    })
    request({
      url: APP_CONFIG.apis.admin_division.spatial_lookup,
      data: {
        location: 'POINT(' + longitude + ' ' + latitude + ')',
        spatialCapable: true
      }
    }).then(res => {
      const region = res.data[0]
      if (region && this.data.current_city.id != region.id) {
        this.switchToTop({ region: { ...res.data[0] } })
      }
    }).catch(err => {
      wx.showToast({
        title: '无法获取地图点击区域城市数据.',
        icon: 'error'
      })
    })
  },
  /**
   * 分享图片
   * @param {*} event 
   */
  onWeatherShare(event) {
    wx.showLoading({
      title: 'Loading...',
      mask: true
    })
    util.getScale(this.mapCtx).then((res) => {
      return new Promise((resolve, reject) => {
        if (res.scale > 15) {
          this.setData({
            scale: 15
          })
        }
        setTimeout(resolve.bind(null), 700)
      })
    }).then(() => {
      return util.getScale(this.mapCtx)
    }).then((res) => {
      return util.getRegion(this.mapCtx)
    }).then((res) => {
      return new Promise((resolve, reject) => {
        util.getCenterLocation(this.mapCtx).then((_res) => {
          resolve({
            ...res,
            ..._res
          })
        }).catch((err) => {
          reject(err)
        })
      })
    }).then((res) => {
      const current_node = this.data.merged_cities[this.data.current_index]
      const bounds = `${res.southwest.latitude},${res.southwest.longitude};${res.northeast.latitude},${res.northeast.longitude}`
      const wind = `${current_node.weather.windDir}${current_node.weather.windScale}级`
      const center = `${res.latitude},${res.longitude}`
      const aqi = current_node.air.category.length <= 2 ? current_node.air.category : current_node.air.category.substr(0, 2)
      request({
        url: APP_CONFIG.apis.poster.weather,
        data: {
          bounds,
          location: current_node.name,
          temperature: current_node.weather.temp,
          text: current_node.weather.text,
          wind,
          aqi,
          aqiColor: util.getAqiColor(current_node.air.category),
          center
        },
        method: 'POST'
      }).then(res => {
        wx.hideLoading()
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
    }).catch((err) => {
      wx.showToast({
        title: '分享失败',
        icon: 'error'
      })
    })
  },
  slidingStart(e) {
    this.setData({
      start_y: e.touches[0].pageY * 0.97 - this.data.screenTop
    })
  },
  slidingEnd(e) {
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
  /**
   * 定位
   * @param {*} e 
   */
  onLocation(e) {
    util.location().then((res) => {
      const {
        latitude,
        longitude
      } = res;
      this.setData({
        location_coordinates: [longitude, latitude],
        location: { longitude, latitude },
        scale: MAP_CONFIG.scale
      })
      request({
        url: APP_CONFIG.apis.admin_division.spatial_lookup,
        data: {
          location: 'POINT(' + longitude + ' ' + latitude + ')',
          spatialCapable: true
        }
      }).then((res) => {
        let region = res.data[0]
        region.centerPoint.coordinates[0] = longitude
        region.centerPoint.coordinates[1] = latitude
        this.setData({
          location_city: region
        })
        this.switchToTop({ region })
      }).catch(err => {
        wx.showToast({
          title: '行政区划数据获取失败',
          icon: 'error'
        })
      })
    }).catch((err) => {
      wx.showToast({
        title: '定位异常，将使用默认城市数据',
        icon: 'error'
      })
      this.switchToTop({
        region: this.data.location_city
      })
    })
    this.setData({
      located: true
    })
  },
  onFetchWeatherData(event) {
    const { id, source } = event.detail
    const merged_cities = this.data.merged_cities
    merged_cities.forEach(item => {
      if (item.id === id) {
        item.weather = source
        return
      }
    })
  },

  onFetchAirData(event) {
    const { id, source } = event.detail
    const merged_cities = this.data.merged_cities
    merged_cities.forEach(item => {
      if (item.id === id) {
        item.air = source
        return
      }
    })
  },
  /**
   * 城市关注事件处理, 事件穿透到index页面
   * @param {*} event 
   */
  handleFollow(event) {
    let { id, followed } = event.detail
    // 以下注释仅更改状态，删除时当前卡片保留
    // const { merged_cities } = this.data;
    // merged_cities.forEach(item => {
    //   if (item.id === id) {
    //     item.followed = followed;
    //     return
    //   }
    // })
    // this.setData({
    //   merged_cities
    // })
    // 以下语句会重新刷新所有关注城市
    if (followed) {
      this.followCitiesRefreshEvenHandler({ reflush: true })
    } else {
      // 取消关注
      this.followCitiesRefreshEvenHandler({ reflush: true, un_follow_id: id })
    }
  },
  swiperChange(event) {
    let current = event.detail.current
    this.setData({
      current_index: current
    })
    const { content } = event.detail;
    if (content) {
      this.setData({
        current_city: content
      })
      // 地图中心点切换
      const { centerPoint } = content;
      if (!centerPoint) {
        const id = parseInt(content.id)
        request({
          url: APP_CONFIG.apis.admin_division.query_by_id + id,
        }).then(res => {
          const _coordinates = res.data.centerPoint.coordinates
          const params = { longitude: _coordinates[0], latitude: _coordinates[1] }
          this.setData({
            location: params,
            scale: MAP_CONFIG.scale
          })
        }).catch(err => {
          wx.showToast({
            title: '行政区划数据获取失败',
            icon: 'error'
          })
        })
      } else {
        this.setData({
          location: {
            longitude: centerPoint.coordinates[0],
            latitude: centerPoint.coordinates[1]
          },
          scale: MAP_CONFIG.scale,
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
  /**
   * 同步内部 scroll-view的滑动状态
   * @param {*} event 
   */
  scrollSlidingHandle(event) {
    this.setData({
      scroll_view_sliding: event.status
    })
  },
  // 切换城市
  acceptSwithCityDataHandler(options) {
    const {
      region
    } = options;
    if (region.id === this.data.location_city.id) {
      region.centerPoint.coordinates = this.data.location_coordinates
    }
    const { coordinates } = region.centerPoint;
    // 将切换的城市置顶
    if (options.switch_to_top) {
      this.switchToTop({ region })
    }
    this.setData({
      location: {
        longitude: coordinates[0],
        latitude: coordinates[1]
      },
      scale: MAP_CONFIG.scale,
      current_city: region
    })
  },
  /**
   * 刷新关注城市数据
   * @param {*} options 
   */
  followCitiesRefreshEvenHandler(options) {
    const {
      reflush
    } = options;
    let _index = 0
    if (options.un_follow_id) {
      const interested_cities = this.data.interested_cities
      for (let index = interested_cities.length - 1; index >= 0; index--) {
        if (interested_cities[index].id === options.un_follow_id) {
          interested_cities.splice(index, 1)
        }
      }
      if (interested_cities.length === 0) {
        const for_fill_in_city = this.data.location_city;
        for_fill_in_city.followed = false;
        interested_cities.push(for_fill_in_city)
      }
      this.setData({
        interested_cities,
        outer_index: _index,
        intervene: true
      })
    }
    if (reflush) {
      request({
        url: APP_CONFIG.apis.follow_city.list_by_subject_id
      }).then(res => {
        const { merged_cities } = this.data
        const last_cities = util.mapFollowcities(res.data)
        for (let out_index = last_cities.length - 1; out_index >= 0; out_index--) {
          for (let index = merged_cities.length - 1; index >= 0; index--) {
            if (last_cities[out_index].code === merged_cities[index].code) {
              // 避免切换导致已存在的天气数据丢失
              last_cities[out_index] = {
                ...merged_cities[index],
                ...last_cities[out_index]
              }
            }
          }
        }
        // 因 merge cities 可能会删除 followed_cities中数据，所以刷新缓存动作需要放置在setData前
        wx.setStorageSync(APP_CONFIG.constants.followed_cities, last_cities)
        this.setData({
          followed_cities: last_cities,
          outer_index: _index,
          intervene: true
        })
      })
    }
  },
  // 页面跳转，城市选择, 消息通道绑定
  onChoose(e) {
    wx.navigateTo({
      url: '../city/city',
      events: {
        acceptSwithCityData: this.acceptSwithCityDataHandler,
        refreshEvent: this.followCitiesRefreshEvenHandler,
        refreshSwiperIndex: this.correctRecordIndex
      }
    })
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
        location_city: { ..._res.data[0], centerPoint: { coordinates: this.data.location_coordinates, type: 'Point' } },
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
        current_city: this.data.merged_cities[0]
      })
      this.selectComponent('#swiper').init(0);
      // this.setData({
      //   duration: '250'
      // })
      console.log('Init completed.')
    }).catch(err => {
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
   * 获取关注城市数据，并将结果放入 followed_cities 
   * @param {*} options 参数对象，目前仅对cached进行解析处理，意味是否通过缓存获取数据
   * @returns 
   */
  fetchFollowedCities(options) {
    return new Promise((resolve, reject) => {
      const { cached } = options;
      let completed = false;
      if (cached) {
        const cached_followed_cities = wx.getStorageSync(APP_CONFIG.constants.followed_cities);
        if (cached_followed_cities.length > 0) {
          this.setData({
            followed_cities: cached_followed_cities
          })
          completed = true
          resolve(cached_followed_cities)
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
  switchToTop(options) {
    const { region } = options
    const { interested_cities, merged_cities } = this.data
    let followed = false;
    merged_cities.forEach(item => {
      if (item.id === region.id) {
        followed = item.followed
      }
    })
    let _last_interested_city = {};
    interested_cities.forEach((item, index, object) => {
      if (item.id === region.id) {
        _last_interested_city = item;
        object.splice(index, 1)
      }
    })
    // 避免定位后丢失天气信息
    const new_interested_city = {
      ..._last_interested_city,
      ...region,
      followed
    }
    interested_cities.unshift(new_interested_city)
    this.setData({
      interested_cities,
      outer_index: 0,
      intervene: true
    })
  },
  /**
   * 用于合并interested_cities与followed_cities，合并为merged_cities，作为最终的城市列表数据
   * @param {*} params 
   */
  mergeCities: function (params) {
    var that = this;
    let {
      interested_cities,
      followed_cities
    } = that.data
    if (interested_cities.length > 0) {
      for (let out_index = followed_cities.length - 1; out_index >= 0; out_index--) {
        for (let index = interested_cities.length - 1; index >= 0; index--) {
          if (followed_cities[out_index].code === interested_cities[index].code) {
            interested_cities[index] = {
              ...followed_cities[out_index]
            }
            followed_cities.splice(out_index, 1)
            break
          }
        }
      }
    }
    const merged_cities = [...interested_cities, ...followed_cities]
    that.setData({
      merged_cities
    }, () => {
      that.interveneCurrent({ length: merged_cities.length })
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
  mergedCitiesWatch: function (callback) {
    var _data = this.data;
    Object.defineProperty(_data, "merged_cities", {
      enumerable: true,
      configurable: true,
      set: function (value) {
        this._merged_cities = value;
        callback(value);
      },
      get: function () {
        if (this._merged_cities) {
          return this._merged_cities
        } else {
          return []
        }
      }
    });
  },
  interveneCurrent({ length } = { length: 0 }) {
    const {intervene, merged_cities} = this.data
    if (intervene) {
      let index = this.data.outer_index
      if (index < 0 || length === 0 || (index > 0 && index >= length)) {
        index = 0
      }
      this.setData({
        current: index,
        current_city: merged_cities[index],
        location: {
          longitude: merged_cities[index].centerPoint.coordinates[0],
          latitude: merged_cities[index].centerPoint.coordinates[1]
        },
        intervene: false
      })
    }
  },
  /**
   * 设置_index
   * @param {*} param0 
   */
  correctRecordIndex: function ({ index } = { index: 0 }) {
    this.setData({
      current: index
    })
  },

  scaleToDefault() {
    const scale = MAP_CONFIG.scale
    util.getScale(this.mapCtx).then((res) => {
      return new Promise((resolve, reject) => {
        if (res.scale != scale) {
          this.setData({
            scale
          })
        }
        setTimeout(resolve.bind(null), 700)
      })
    }).then(() => {
      return util.getScale(this.mapCtx)
    }).then((res) => {
      // console.log(res)
    }).catch(err => {
      // console.log(err)
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
  onReady: function () { },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const { merged_cities, current_index } = this.data
    if (merged_cities.length > 0 && merged_cities[current_index] && merged_cities[current_index].centerPoint) {
      this.setData({
        location: {
          longitude: merged_cities[current_index].centerPoint.coordinates[0],
          latitude: merged_cities[current_index].centerPoint.coordinates[1]
        },
        scale: MAP_CONFIG.scale
      })
    }
  },
  /**
 * 生命周期函数--监听页面隐藏
 */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'Fuyi Weather 一个结合地理信息的天气小程序',
      path: '/pages/index/index'
    }
  },
  onShareTimeline: function () {
    return {
      title: 'Fuyi Weather',
      query: {
      },
      imageUrl: ''
    }
  }
})