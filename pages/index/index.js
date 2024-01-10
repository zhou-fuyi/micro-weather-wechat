// index.js
import {
  APP_CONFIG,
  MAP_CONFIG
} from '../../config/app.config'
import {
  request
} from '../../request/index';
import * as echarts from '../../components/ec-canvas/echarts';
const util = require('../../utils/util.js')
// 引入SDK核心类
var QQMapWX = require('../../libs/qqmap-wx-jssdk/qqmap-wx-jssdk');

const app = getApp();
var qqmapsdk;
let _charts = [];

function setOption(chart, args) {
  const {
    x_arr,
    pop_arr,
    temp_arr
  } = args
  const option = {
    title: {
      text: '逐小时天气预报（24h）',
      left: 'center',
      top: 'top',
      textStyle: {
        fontWeight: "lighter",
        color: 'rgba(72, 72, 72, 1)',
        fontStyle: "normal",
        fontFamily: "monospace",
        textShadowColor: "transparent"
      }
    },
    legend: {
      data: ['温度', '降水概率'],
      top: '12%'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    xAxis: {
      type: 'category',
      name: '\n\n时刻',
      nameLocation: 'end',
      nameGap: 7,
      nameTextStyle: {
        padding: [200, 0, 0, 0]
      },
      axisTick: {
        alignWithLabel: true
      },
      data: x_arr
    },
    yAxis: [{
        type: 'value',
        name: '降水概率',
        position: 'right',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value} %'
        }
      },
      {
        type: 'value',
        name: '温度',
        position: 'left',
        axisLabel: {
          formatter: '{value} °C'
        }
      }
    ],
    series: [{
        name: '降水概率',
        type: 'bar',
        yAxisIndex: 0,
        data: pop_arr,
        smooth: true
      },
      {
        name: '温度',
        type: 'line',
        data: temp_arr,
        yAxisIndex: 1,
        smooth: true
      }
    ],
    grid: {
      top: '30%',
      bottom: '13%',
      left: '13%',
      right: '13%'
    }
  }
  chart.setOption(option)
}

function initChart(canvas, width, height, dpr) {
  const _chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // 像素
  });
  canvas.setChart(_chart);
  setOption(_chart, {})

  _charts.push({
    canvas_id: parseInt(canvas.canvasId),
    chart: _chart
  })
  return _chart
}

Page({
  data: {
    ...MAP_CONFIG,
    map_context: null,
    located: false,
    admin_division: {},
    located_admin_division: {},
    city_list: [],
    followed_cities: [],
    interested_cities: [],
    merged_cities: [],
    weather_real_time: {},
    air_real_time: {},
    hour_by_hour: [],
    day_by_day: [],
    date_time_struct: {},
    ec: {
      onInit: initChart
      // 将 lazyLoad 设为 true 后，需要手动初始化图表
      // lazyLoad: true
    },
    movable_view_direction: 'vertical',
    scroll_view_disabled: false,
    scroll_view_sliding: false,
    swiper_index: 0
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
            spatialCapable: true
          }
        }).then((res) => {
          let city_list = this.data.city_list;
          let followed = false;
          if (city_list.length > 0) {
            const first_city = res.data[0];
            city_list.forEach((city, index, object) => {
              if (city.divisionId === first_city.id) {
                followed = city.followed
                object.splice(index, 1)
              }
            })
            city_list.unshift({
              followed,
              divisionId: first_city.id,
              divisionName: first_city.name,
              divisionCode: first_city.code
            })
          } else {
            city_list = [{
              followed,
              divisionId: res.data[0].id,
              divisionName: res.data[0].name,
              divisionCode: res.data[0].code
            }]
          }
          this.setData({
            admin_division: {
              ...res.data[0],
              followed
            },
            located_admin_division: {
              ...res.data[0]
            },
            city_list,
            swiper_index: 0
          })
          this.fetchHourByHourWeather({
            longitude,
            latitude
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

        this.fetchDayByDayWeather({
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
      this.acceptDataForSwitchCity({
        data: {
          ...res.data[0],
          switch_to_top: true
        }
      })
    })

    console.log(`经度：${longitude}，维度：${latitude}`)
  },
  onWeatherShare(event) {
    console.log(event)
    this.mapCtx.getRegion({
      success: res => {
        console.log(res)
        const bounds = `${res.southwest.latitude},${res.southwest.longitude};${res.northeast.latitude},${res.northeast.longitude}`
        const wind = `${this.data.weather_real_time.windDir}${this.data.weather_real_time.windScale}级`
        const center = `${this.data.location.latitude},${this.data.location.longitude}`
        request({
          url: APP_CONFIG.apis.poster.weather,
          data: {
            bounds,
            location: this.data.admin_division.name,
            temperature: this.data.weather_real_time.temp,
            text: this.data.weather_real_time.text,
            wind,
            aqi: this.data.air_real_time.category,
            aqiColor: util.getAqiColor(this.data.air_real_time.category),
            center
          },
          method: 'POST'
        }).then(res => {
          console.log(res)
          wx.previewImage({
            current: res.data,
            urls: [res.data]
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
  // 获取实时天气与空气质量
  fetchRealTimeWeather(options) {
    const {
      longitude,
      latitude,
      index
    } = options
    let _location = '' + longitude + ',' + latitude;
    let merged_cities = this.data.merged_cities;
    request({
      url: APP_CONFIG.apis.weather.real_time + _location,
    }).then((res) => {
      const {
        updateTime
      } = res.data;
      merged_cities[index].weather_real_time = {
        ...res.data,
        updateTime: util.formatTime(new Date(updateTime)),
        ...util.deconstructionTime(updateTime)
      }
      this.setData({
        merged_cities
      })
    })
    request({
      url: APP_CONFIG.apis.air.real_time + _location,
    }).then((res) => {
      merged_cities[index].air_real_time = res.data;
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
    let merged_cities = this.data.merged_cities;
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
    let merged_cities = this.data.merged_cities;
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
      if (cached) {
        const cached_followed_cities = wx.getStorageSync(APP_CONFIG.constants.followed_cities);
        if (cached_followed_cities.length > 0) {
          this.setData({
            followed_cities: cached_followed_cities
          })
          resolve(cached_followed_cities)
        }
        console.log('无法从缓存中获取 followed_cities')
      }
      request({
        url: APP_CONFIG.apis.follow_city.list_by_subject_id
      }).then((res) => {
        const followed_cities = res.data.map(item => ({
          city: item,
          followed: true
        }))
        this.setData({
          followed_cities
        })
        wx.setStorageSync(APP_CONFIG.constants.followed_cities, followed_cities)
        resolve(followed_cities)
      }).catch((err) => {
        reject(err)
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
  locationTap(e) {
    this.getMapLocation();
    this.setData({
      located: true
    })
  },
  swiperChangeHandler(event) {
    if (event.detail.source === 'touch') {
      const id = parseInt(event.detail.currentItemId);
      request({
        url: APP_CONFIG.apis.admin_division.query_by_id + id,
      }).then(res => {

        let followed = false;
        this.data.city_list.forEach(city => {
          if (city.divisionId === id) {
            followed = city.followed
          }
        })
        this.acceptDataForSwitchCity({
          data: {
            ...res.data,
            followed,
            swiper_index: event.detail.current
          }
        })
      })
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
  onFollowCity(event) {
    request({
      url: APP_CONFIG.apis.follow_city.follow,
      data: {
        ...event.currentTarget.dataset,
        state: 'Focus'
      },
      method: 'POST'
    }).then(res => {
      let city_list = this.data.city_list;
      city_list.forEach((city, index, object) => {
        if (city.divisionId === res.data.divisionId) {
          object.splice(index, 1)
        }
      })
      city_list.unshift({
        ...res.data,
        followed: true
      })

      this.setData({
        city_list,
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
    const city_list = this.data.city_list
    // 将切换的城市置顶
    if (options.data.switch_to_top) {
      city_list.forEach((city, index, object) => {
        if (city.divisionId === options.data.id) {
          object.splice(index, 1)
        }
      })
      city_list.unshift({
        followed: options.data.followed,
        divisionId: options.data.id,
        divisionName: options.data.name,
        divisionCode: options.data.code
      })
    }
    this.setData({
      admin_division: {
        ...options.data
      },
      location: {
        longitude: coordinates[0],
        latitude: coordinates[1]
      },
      city_list,
      date_time_struct: util.deconstructionTime(new Date())
    })
    this.fetchRealTimeWeather({
      longitude: coordinates[0],
      latitude: coordinates[1]
    })
    this.fetchHourByHourWeather({
      longitude: coordinates[0],
      latitude: coordinates[1]
    })
    this.fetchDayByDayWeather({
      longitude: coordinates[0],
      latitude: coordinates[1]
    })
    // 必须先完成跳转页面数据设定动作，最后进行跳转索引设置，避免swiper前后来回跳转导致未能达到正确的页面跳转效果问题
    this.setData({
      swiper_index: options.data.swiper_index,
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
        const followed_cities = res.data;
        let admin_division = this.data.admin_division
        let city_list = Object.values(this.data.city_list).filter(city => (!city.followed))
        admin_division.followed = false;
        if (followed_cities.length > 0) {
          admin_division = {
            id: followed_cities[0].divisionId,
            code: followed_cities[0].divisionId,
            name: followed_cities[0].divisionName,
            followed: true
          }
          followed_cities.forEach(city => {
            city_list.forEach((inner_city, index, object) => {
              if (city.divisionId === inner_city.divisionId) {
                object.splice(index, 1)
              }
            })
          })

        }
        if (city_list.length === 0 && followed_cities.length === 0 && Object.keys(this.data.located_admin_division).length > 0) {
          city_list.push({
            divisionId: this.data.located_admin_division.id,
            divisionName: this.data.located_admin_division.name,
            divisionCode: this.data.located_admin_division.code,
            followed: false
          })
          admin_division = {
            ...this.data.located_admin_division,
            followed: admin_division.followed
          }
        }
        const cities = [...city_list, ...followed_cities.map(city => ({
          ...city,
          followed: true
        }))]
        this.setData({
          city_list: cities
        })
        request({
          url: APP_CONFIG.apis.admin_division.query_by_id + admin_division.id,
        }).then(res => {
          this.setData({
            admin_division: {
              ...res.data,
              followed: admin_division.followed
            },
          })
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
    this.setData({
      date_time_struct: util.deconstructionTime(new Date())
    })
    this.fetchRealTimeWeather(this.data.location)
    this.fetchHourByHourWeather(this.data.location)
    this.fetchDayByDayWeather(this.data.location)
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
   * ，最终由两者合成城市列表（city_list） 其中，关注城市由服务接口提供，可使用缓存
   * ，但需要保持与远端的数据同步
   * 6、获取当前城市的天气数据（实时、24小时、7天）
   */
  init() {
    this.watch(this.mergeCities)
    // this.mergedCitiesWatch(this.correctSwiperShow)
    wx.showLoading({
      title: '数据加载中...',
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
        location_city: {
          ..._res.data[0],
          centerPoint: {
            coordinates: this.data.location_coordinates,
            type: 'Point'
          }
        },
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
      const params = {
        ...this.data.location,
        index: 0
      }
      this.fetchRealTimeWeather(params)
      this.fetchHourByHourWeather(params)
      this.fetchDayByDayWeather(params)
      wx.hideLoading()
      this.setData({
        date_time_struct: util.deconstructionTime(new Date()),
      })
      // this.selectComponent('#swiper').init(0);
      // this.setData({
      //   duration: '250'
      // })
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
      followed_cities.forEach((item) => {
        for (let index = interested_cities.length - 1; index >= 0; index--) {
          if (item.city.divisionCode === interested_cities[index].code) {
            interested_cities.splice(index, 1)
            break
          }
        }
      })
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
    // debugger
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