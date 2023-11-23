// app.js
import { APP_CONFIG } from './config/app.config'
import { request } from './request/index';

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        console.log(res)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        request({
          url: APP_CONFIG.apis.oauth.we_chat,
          data: {
            code: res.code
          }
        }).then((res) => {
          console.log(res)
        }).catch((err) => {
          wx.showToast({
            title: '微信登录失败.'
          })
        })
      }
    })
  },
  globalData: {
    userInfo: null
  }
})
