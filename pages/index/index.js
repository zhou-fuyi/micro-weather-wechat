// index.js
import { MAP_CONFIG } from '../../config/app.config'
const util = require('../../utils/util.js')
// 引入SDK核心类
var QQMapWX = require('../../libs/qqmap-wx-jssdk/qqmap-wx-jssdk');
var qqmapsdk;

Page({
  data: { 
    ...MAP_CONFIG
   },
  //获得地图
  getMapLocation(e) {
    wx.getLocation({
      type: 'gcj02',  //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      isHighAccuracy: true,
      // 箭头函数的this始终指向函数定义时的this
      success: (res) => {
        console.log(res)
        const { latitude, longitude } = res;
        this.setData({
          location: {
            latitude,
            longitude
          }
        });
      },
      fail: (err) => {
        console.log(err)
        this.setData({...this.data.location})
      }
    })
  },
  slidingStart(e){
    console.log(e)
    this.setData({
      start_y: e.touches[0].pageY * 0.97 - this.data.screenTop
    })
  },
  slidingEnd(e){
    console.log(e)
    let {pageY} = e.changedTouches[0];
    pageY = pageY * 0.97 - this.data.screenTop;
    // 上滑
    if(this.data.start_y > pageY){
      if(this.data.y != 0){
        this.setData({
          y: 0
        })
      }
    }
    // 下滑
    if(this.data.start_y < pageY){
      this.setData({
        y: this.data.max_y
      })
    }
  },
  locationTap(e){
    console.log(e)
    this.getMapLocation();
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
  },
  
})
