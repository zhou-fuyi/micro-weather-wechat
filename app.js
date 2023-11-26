// app.js
import { APP_CONFIG } from './config/app.config'
import { request } from './request/index';

App({
  onLaunch() {
    this.checkSession().then((res) => {
      this.globalData.hasLogged = true
    }).catch((err) => {
      this.globalData.hasLogged = false
    })
  },
  checkSession() {
    return new Promise((resolve, reject) => {
      if (!wx.getStorageSync(APP_CONFIG.constants.auth_token)) {
        console.log('token does not exist.')
        this.wechatOauth().then((res) => {
          resolve(res)
          console.log(res)
        }).catch((err) => {
          reject(err)
        })
      } else {
        resolve(res)
        console.log('check session successful.')
      }
    })
  },
  wechatOauth() {
    return new Promise((resolve, reject) => {
      // 登录
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          request({
            url: APP_CONFIG.apis.oauth.we_chat,
            data: {
              code: res.code
            }
          }).then((res) => {
            wx.removeStorageSync(APP_CONFIG.constants.auth_token)
            wx.setStorageSync(APP_CONFIG.constants.auth_token, res.data.auth_token)
            resolve(res)
          }).catch((err) => {
            reject(err)
            wx.showToast({
              title: '微信登录失败.'
            })
          })
        }
      })
    })
  },
  watch(callback) {
    var _global = this.globalData
    Object.defineProperty(_global, 'hasLogged', {
      configurable: true,
      enumerable: true,
      set: function (value) {
        this._hasLogged = value;
        callback(value);
      },
      get: function () {
        return this._hasLogged
      }
    })
  },
  globalData: {
    subject: null,
    hasLogged: false
  }
})
