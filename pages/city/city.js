// pages/city/city.js
import {
  APP_CONFIG
} from '../../config/app.config'
import {
  request
} from '../../request/index';
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
        ...event.currentTarget.dataset
      }
    }).then((res) => {
      this.clearInput()
      // this.setData({
      //   follow_cities: [...this.data.follow_cities, ...[res.data]],
      //   search_cities: [],
      //   city_panel_showed: true
      // })
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
      eventChannel.emit('acceptDataFromOpenedPage', {
        data: res.data
      })
      wx.navigateBack({
        delta: 1
      })
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    request({
      url: APP_CONFIG.apis.follow_city.list_by_subject_id
    }).then((res) => {
      console.log(res)
      this.setData({
        follow_cities: res.data
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