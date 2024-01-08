// pages/city/city.js
import {
  APP_CONFIG
} from '../../config/app.config'
import {
  request
} from '../../request/index';
const util = require('../../utils/util.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputShowed: false,
    inputVal: '',
    city_panel_showed: true,
    follow_cities: [],
    search_cities: []
  },
  showInput() {
    this.setData({
      inputShowed: true,
    });
  },
  hideInput() {
    this.setData({
      inputVal: '',
      inputShowed: false,
    });
  },
  // 清除文本内容
  clearInput() {
    this.setData({
      inputVal: '',
    });
  },
  inputTyping(e) {
    // console.log(e)
    this.setData({
      inputVal: e.detail.value,
      city_panel_showed: !e.detail.value
    });
    if (e.detail.value) {
      request({
        url: APP_CONFIG.apis.admin_division.full_text_search,
        data: {
          name: e.detail.value
        }
      }).then((res) => {
        // console.log(res.data.data)
        this.setData({
          search_cities: res.data
        })
      })
    }
  },
  // 选择城市，从Search Result中选择
  chooseCity(event) {
    request({
      url: APP_CONFIG.apis.follow_city.follow,
      data: {
        ...event.currentTarget.dataset,
        state: 'Focus'
      },
      method: 'POST'
    }).then((res) => {
      this.clearInput()
      // this.setData({
      //   follow_cities: [...this.data.follow_cities, ...[res.data]],
      //   search_cities: [],
      //   city_panel_showed: true
      // })
      // 通知地图页面进行刷新
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.emit('refreshEvent', {
        reflush: true
      })
      // 切回地图页面
      this.backup(event.currentTarget.dataset.divisionId)
    })
  },
  // 切换城市
  toggleCity(event) {
    this.backup(event.currentTarget.dataset.divisionId)
  },
  backup(divisionId) {
    request({
      url: APP_CONFIG.apis.admin_division.query_by_id + divisionId
    }).then(res => {
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.emit('acceptSwithCityData', {
        data: {
          ...res.data,
          ...{
            followed: true,
            switch_to_top: true,
            swiper_index: 0
          }
        }
      })
      wx.navigateBack({
        delta: 1
      })
    })
  },
  unFollow(event) {
    console.log(event)
    const {
      id
    } = event.currentTarget.dataset;
    request({
      url: APP_CONFIG.apis.follow_city.un_follow + id,
      method: "DELETE"
    }).then(res => {
      const follow_cities = this.data.follow_cities;
      follow_cities.forEach((element, index, object) => {
        if (id === element.id) {
          object.splice(index, 1)
        }
      })
      this.setData({
        follow_cities
      })
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.emit('refreshEvent', {
        reflush: true
      })
    })
  },
  slidingStart(e) {
    // let cities = this.data.follow_cities;
    // cities.forEach(element => {
    //   if (element.offset) {
    //     element.offset = 0
    //   }
    // });
    this.setData({
      start_x: e.touches[0].pageX,
      // follow_cities: cities
    })
  },
  slidingEnd(e) {
    console.log(e)
    const {
      id
    } = e.currentTarget.dataset
    let {
      pageX
    } = e.changedTouches[0];
    const abs = Math.abs(pageX - this.data.start_x)
    let offset_x = 0;
    let cities = this.data.follow_cities;
    if (abs > 30) {
      // 状态清除
      cities.forEach(element => {
        if (element.offset) {
          element.offset = 0
        }
      });
      // 左滑
      if (this.data.start_x > pageX) {
        offset_x = -this.data.max_x;
      }
      // 右滑
      if (this.data.start_x < pageX) {
        this.setData({
          x: 0
        })
      }

      // 状态填充
      cities.forEach(element => {
        if (element.id === id) {
          element.offset = offset_x
        }
      });
    }
    this.setData({
      follow_cities: cities
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.getSystemInfo({
      complete: (res) => {
        const delBtnWidth = 160
        this.setData({
          screenHeight: util.px2rpx(res.screenHeight, res.screenWidth),
          screenWidth: util.px2rpx(res.screenWidth, res.screenWidth),
          screenTop: res.screenTop ? res.screenTop : 0,
          originScreenHeight: res.screenHeight,
          x: 0,
          max_x: delBtnWidth,
          delBtnWidth,
        })
      },
    })
    request({
      url: APP_CONFIG.apis.follow_city.list_by_subject_id
    }).then((res) => {
      console.log(res)
      this.setData({
        follow_cities: res.data.map(x => ({
          ...x,
          ...{
            offset: 0
          }
        }))
      })
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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

  }
})