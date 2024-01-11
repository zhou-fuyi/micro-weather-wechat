// components/weather/real-time.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    region: {
      type: Object,
      value: {}
    },
    followed: {
      type: Boolean,
      value: false
    },
    weather: {
      type: Object,
      value: {}
    },
    air: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChooseCity(event) {
      this.triggerEvent('choose', event, { bubbles: true, composed: true })
    },
    /**
     * 新增当前城市为关注城市
     * @param {*} event 
     */
    onFollowCity(event){
      this.triggerEvent('follow', event.currentTarget.dataset, { bubbles: true, composed: true })
    },
    /**
     * 刷新天气数据
     * @param {*} event 
     */
    onWeatherFlush(event){
      this.triggerEvent('flush', {})
      this.animate('#icon-rotate-container', [
        { rotate: 0 },
        { rotate: 90 },
        { rotate: 180 },
        { rotate: 270 },
        { rotate: 360 },
      ], 1000, function () {
        this.clearAnimation('#icon-rotate-container', { rotate: true }, function () {
        })
      }.bind(this))
    }
  }
})