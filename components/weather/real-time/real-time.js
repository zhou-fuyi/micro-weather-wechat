// components/weather/real-time.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    admin_division: {
      type: Object,
      value: {}
    },
    followed: {
      type: Boolean,
      value: false
    },
    weatherRealTime: {
      type: Object,
      value: {}
    },
    airRealTime: {
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
      this.triggerEvent('choose', event)
    },
    /**
     * 新增当前城市为关注城市
     * @param {*} event 
     */
    onFollowCity(event){
      this.triggerEvent('follow', event.currentTarget.dataset)
    },
    /**
     * 刷新天气数据
     * @param {*} event 
     */
    onWeatherFlush(event){
      this.triggerEvent('flush', {})
    }
  }
})