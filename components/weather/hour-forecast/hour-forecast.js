// components/weather/hour-forecast/hour-forecast.js
import * as echarts from '../../ec-canvas/echarts';

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

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    region: {
      type: Object,
      value: {}
    },
    content: {
      type: Object,
      value: {}
    }
  },
  observers: {
    'content': function (_content) {
      if (_content && Object.keys(_content).length > 0) {
        if (this.chart) {
          setOption(this.chart, _content)
        } else {
          if (!this.ecComponent) {
            const _arg = '#ec_' + this.data.region.id;
            this.ecComponent = this.selectComponent(_arg);
          }
          setTimeout(() => {
            if (this.chart) {
              setOption(this.chart, _content)
            } else {
              this.initChart()
            }
          }, 500)
        }
      }
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    ec: {
      // 将 lazyLoad 设为 true 后，需要手动初始化图表
      lazyLoad: true
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
    attached: function () {
      const _arg = '#ec_' + this.data.region.id;
      this.ecComponent = this.selectComponent(_arg);
      this.initChart()
    },
    moved: function () { },
    detached: function () { },
  },
  pageLifetimes: {
    show: function () {
    },
    hide: function () {
      // 页面被隐藏
    },
    resize: function (size) {
      // 页面尺寸变化
    }
  },
  ready() { },
  /**
   * 组件的方法列表
   */
  methods: {
    // 点击按钮后初始化图表
    initChart: function () {
      this.ecComponent.init((canvas, width, height, dpr) => {
        // 获取组件的 canvas、width、height 后的回调函数
        // 在这里初始化图表
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr // new
        });
        const content = this.data.content
        if (content && Object.keys(content).length > 0) {
          setOption(chart, this.data.content);
        } else {
          setOption(chart, {});
        }
        // 将图表实例绑定到 this 上，可以在其他成员函数（如 dispose）中访问
        this.chart = chart

        // 注意这里一定要返回 chart 实例，否则会影响事件处理等
        return chart;
      });
    },
  }
})