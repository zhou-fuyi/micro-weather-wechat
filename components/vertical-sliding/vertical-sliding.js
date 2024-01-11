// components/vertical-sliding/vertical-sliding.js
const NO_PREV_PAGE = -1
const NO_NEXT_PAGE = -2
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    windowHeight: {
      type: Number,
      value: 0
    },
    current: {
      type: Number,
      value: 0
    },
    duration: {
      type: String,
      value: '250'
    },
    contents: {
      type: Array,
      value: []
    },
    scrollViewDisabled: {
      type: Boolean,
      value: false
    },
  },

  observers: {
    'current': function(index) {
      let that = this
      let {swiper_list} = that.data
      if (swiper_list.length == 0 || swiper_list[index] == null) {
        return
      }
      that.init(index)
      let info = {}
      info.source = 'custom'
      // info.content = swiper_list[index]
      info.current = index
      this.triggerEvent("change", info)
    },

  },

  /**
   * 组件的初始数据
   */
  data: {

    // 滑动到的位置
    swiper_index: 0,
    // 此值控制swiper的位置
    swiper_current: 0,
    // 当前swiper渲染的items
    swiper_list: []
  },

  /**
   * 组件的方法列表
   */
  methods: {
    init (defaulaIndex) {
      let that = this
      let swiper_list = that.data.contents
      if (swiper_list == null || swiper_list.length == 0) {
        return
      }
      // 默认显示的index
      that.setData({
        swiper_list,
        swiper_index: defaulaIndex,
        swiper_current: defaulaIndex
      })
    },
    clear () {
      this.setData({
        contents: [],
        swiper_list: []
      })
    },

    onChange: function (e) {
      let that = this
      let current = e.detail.current
      let lastIndex = that.data.swiper_index
      let currentItem = that.data.swiper_list[current]
      let info = {}
      info.source = e.detail.source
      info.content = currentItem
      // 正向滑动，到下一个的时候
      // 是正向衔接
      if (current - lastIndex == 1) {
        // 如果是滑到了右边界或者下一个还未有值，弹回去
        if (currentItem == null) {
          info.current = NO_NEXT_PAGE
          that.triggerEvent("change", info)
          that.setData({
            swiper_current: lastIndex
          })
          return
        }
      }

      // 反向滑动，到上一个的时候
      // 是反向衔接
      if (lastIndex - current == 1) {
        // 如果滑到了右边界或者上一个还未有值，弹回去
        if (currentItem == null) {
          info.current = NO_PREV_PAGE
          that.triggerEvent("change", info)
          that.setData({
            swiper_current: lastIndex
          })
          return
        }
      }

      if (currentItem == null) return 
      info.current = current
      that.triggerEvent("change", info)
      // 记录滑过来的位置，此值对于下一次滑动的计算很重要
      that.data.swiper_current = current
    },
    onAnimationfinish(event) {
      // console.log(event)
    },
    scrollSlidingHandle(event){
      this.triggerEvent('scrollslidingstatus', {status: event})
    }
  }
})