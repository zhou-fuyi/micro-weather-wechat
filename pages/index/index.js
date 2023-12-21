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
var qqmapsdk;

Page({
  data: {
    ...MAP_CONFIG,
    map_context: null,
    located: false,
    admin_division: {},
    weather_real_time: {

    },
    air_real_time: {

    }
  },
  //获得地图
  getMapLocation(e) {
    wx.getLocation({
      type: 'gcj02', //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      isHighAccuracy: true,
      // 箭头函数的this始终指向函数定义时的this
      success: (res) => {
        console.log(res)
        const {
          latitude,
          longitude
        } = res;
        request({
          url: APP_CONFIG.apis.admin_division.spatial_lookup,
          data: {
            location: 'POINT(' + longitude + ' ' + latitude + ')',
            spatialCapable: false
          }
        }).then((res) => {
          const follow_cities = this.data.follow_cities;
          let followed = false;
          if (follow_cities) {
            follow_cities.forEach(city => {
              if (city.divisionId = res.data[0].id) {
                followed = true;
              }
            })
          }
          this.setData({
            admin_division: {
              ...res.data[0],
              followed
            }
          })
        })
        this.setData({
          location: {
            latitude,
            longitude
          }
        });
        this.fetchRealTimeWeather({
          longitude,
          latitude
        })
      },
      fail: (err) => {
        console.log(err)
        this.setData({
          ...this.data.location
        })
      }
    })
  },
  // 获取实时天气与空气质量
  fetchRealTimeWeather(options) {
    const {
      longitude,
      latitude
    } = options
    let _location = '' + longitude + ',' + latitude;
    request({
      url: APP_CONFIG.apis.weather.real_time + _location,
    }).then((res) => {
      const {
        updateTime
      } = res.data
      this.setData({
        weather_real_time: {
          ...res.data,
          updateTime: util.formatTime(new Date(updateTime)),
          ...util.deconstructionTime(updateTime)
        }
      })
    })
    request({
      url: APP_CONFIG.apis.air.real_time + _location,
    }).then((res) => {
      this.setData({
        air_real_time: res.data
      })
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
    // 上滑
    if (this.data.start_y > pageY) {
      if (this.data.y != 0) {
        this.setData({
          y: 0
        })
      }
    }
    // 下滑
    if (this.data.start_y < pageY) {
      this.setData({
        y: this.data.max_y
      })
    }
  },
  locationTap(e) {
    this.getMapLocation();
    this.setData({
      located: true
    })
  },
  // 监听视野变化
  onChangeRegion(event) {
    // 当前事件中没有causeBy属性
    if (event.type === 'end' && this.data.located) {
      const mapCtx = wx.createMapContext('qq_map_wx', this);
      // if (!mapCtx) {
      //   mapCtx = wx.createMapContext('qq_map_wx', this)
      //   this.setData({
      //     map_context: mapCtx
      //   })
      // }
      mapCtx.getCenterLocation({
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
  onFollowCity(event) {
    request({
      url: APP_CONFIG.apis.follow_city.follow,
      data: {
        ...event.currentTarget.dataset
      }
    }).then(res => {
      let follow_cities = this.data.follow_cities;
      follow_cities.push({
        ...res.data,
        followed: true
      })

      this.setData({
        follow_cities,
        admin_division: {
          ...this.data.admin_division,
          followed: true
        }
      })
    })
  },
  // 切换城市
  acceptDataForSwitchCity(options) {
    console.log('accept data for switch city.')
    console.log(options)
    const {
      coordinates
    } = options.data.centerPoint;
    this.fetchRealTimeWeather({
      longitude: coordinates[0],
      latitude: coordinates[1]
    })
    this.setData({
      admin_division: {
        ...options.data,
        followed: true
      },
      location: {
        longitude: coordinates[0],
        latitude: coordinates[1]
      }
    })
  },
  followCitiesRefreshEvenHandler(options) {
    const {
      reflush
    } = options;
    if (reflush) {
      request({
        url: APP_CONFIG.apis.follow_city.list_by_subject_id
      }).then(res => {
        const cities = res.data;
        const admin_division = this.data.admin_division
        cities.forEach(city => {
          if (admin_division.id === city.divisionId) {
            admin_division.followed = false
          }
        })
        if (cities) {
          admin_division.followed = false
        }
        this.setData({
          admin_division,
          follow_cities: cities.map(city => ({
            ...city,
            followed: true
          }))
        })
      })
    }
  },
  // 页面跳转，城市选择, 消息通道绑定
  chooseCity(e) {
    console.log(e)
    console.log('页面跳转 --> city')
    wx.navigateTo({
      url: '../city/city',
      events: {
        acceptSwithCityData: this.acceptDataForSwitchCity,
        refreshEvent: this.followCitiesRefreshEvenHandler,
      }
    })
  },
  // 刷新天气数据（根据当前地图中心点）
  onWeatherflush(event) {
    this.fetchRealTimeWeather(this.data.location)
    this.animate('#icon-rotate-container', [{
        rotate: 0
      },
      {
        rotate: 90
      },
      {
        rotate: 180
      },
      {
        rotate: 270
      },
      {
        rotate: 360
      },
    ], 1000, function () {
      this.clearAnimation('#icon-rotate-container', {
        rotate: true
      }, function () {
        console.log("清除了#icon-rotate-container上的otate属性")
      })
    }.bind(this))
  },
  onLoad() {
    this.getMapLocation();
    // 实例化API核心类
    qqmapsdk = new QQMapWX({
      key: this.data.key
    });
    wx.getSystemInfo({
      complete: (res) => {
        console.log(res)
        this.setData({
          screenHeight: util.px2rpx(res.screenHeight, res.screenWidth),
          screenWidth: util.px2rpx(res.screenWidth, res.screenWidth),
          screenTop: res.screenTop ? res.screenTop : 0,
          originScreenHeight: res.screenHeight,
          y: 0.67 * res.windowHeight,
          max_y: 0.67 * res.windowHeight
        })
      },
    })
    this.followCitiesRefreshEvenHandler({ reflush: true })
  },

})