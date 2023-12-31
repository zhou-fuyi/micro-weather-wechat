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
var qqmapsdk;

let chart = null;


function initChart(canvas, width, height, dpr) {
  chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // 像素
  });
  canvas.setChart(chart);

  var option = {
  };
  chart.setOption(option);
  return chart;
}

Page({
  data: {
    ...MAP_CONFIG,
    map_context: null,
    located: false,
    admin_division: {},
    weather_real_time: {
    },
    air_real_time: {
    },
    hour_by_hour: [],
    day_by_day: [],
    date_time_struct: {},
    ec: {
      onInit: initChart
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
              if (city.divisionId === res.data[0].id) {
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
        this.fetchHourByHourWeather({ longitude, latitude })
        this.fetchDayByDayWeather({ longitude, latitude })
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
  fetchHourByHourWeather(options) {
    const { longitude, latitude } = options
    let _location = '' + longitude + ',' + latitude;
    request({
      url: APP_CONFIG.apis.weather.hour_by_hour + _location,
    }).then((res) => {
      this.setData({
        hour_by_hour: { ...res.data }
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
      chart.setOption({
        title: {
          text: '逐小时天气预报（24h）',
          left: 'center',
          top: 'top'
        },
        legend: {
          data: ['温度', '降水概率'],
          top: '12%'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
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
        yAxis: [
          {
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
        series: [
          {
            name: '降水概率',
            type: 'bar',
            yAxisIndex: 0,
            data: pop_arr,
            // markPoint: {
            //   data: [
            //     { type: 'max', name: 'Max' },
            //     { type: 'min', name: 'Min' }
            //   ]
            // },
            // markLine: {
            //   data: [{ type: 'average', name: 'Avg' }]
            // },
            smooth: true
          },
          {
            name: '温度',
            type: 'line',
            data: temp_arr,
            yAxisIndex: 1,
            // markPoint: {
            //   data: [
            //     { type: 'max', name: 'Max' },
            //     { type: 'min', name: 'Min' }
            //   ]
            // },
            // markLine: {
            //   data: [{ type: 'average', name: 'Avg' }]
            // },
            smooth: true
          }
        ],
        grid: {
          top: '30%',
          bottom: '13%'
        }
      })
    })
  },
  fetchDayByDayWeather(options) {
    const { longitude, latitude } = options
    let _location = '' + longitude + ',' + latitude;
    request({
      url: APP_CONFIG.apis.weather.day_by_day + _location,
    }).then((res) => {
      this.setData({
        day_by_day: { ...res.data.map(item => {
          if(new Date().getDate() === new Date(item.fxDate).getDate()){
            item.day_of_week = '今天'
          }else {
            item.day_of_week = util.dayOfTheWeek(item.fxDate)
          }
          return item
        }) }
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
    if (Math.abs(pageY - this.data.start_y) > 30) {
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
    this.fetchHourByHourWeather({ longitude: coordinates[0], latitude: coordinates[1] })
    this.fetchDayByDayWeather({ longitude: coordinates[0], latitude: coordinates[1] })
    this.setData({
      admin_division: {
        ...options.data,
        followed: true
      },
      location: {
        longitude: coordinates[0],
        latitude: coordinates[1]
      },
      date_time_struct: util.deconstructionTime(new Date())
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
        admin_division.followed = false;
        cities.forEach(city => {
          if (admin_division.id === city.divisionId) {
            admin_division.followed = true
          }
        })
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
  onLoad() {
    this.setData({
      date_time_struct: util.deconstructionTime(new Date())
    })
    this.getMapLocation();
    // 实例化API核心类
    qqmapsdk = new QQMapWX({
      key: this.data.key
    });
    wx.getSystemInfo({
      complete: (res) => {
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