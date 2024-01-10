// components/weather/hour-forecast/hour-forecast.js
import * as echarts from '../../ec-canvas/echarts';
let _charts = [];

function initChart(canvas, width, height, dpr) {
  const _chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // 像素
  });
  canvas.setChart(_chart);
  setOption(_chart, {})

  _charts.push({
    canvas_id: parseInt(canvas.canvasId),
    chart: _chart
  })
  return _chart
}

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
    admin_division: {
      type: Object,
      value: {}
    },
    hourByHour: {
      type: Object,
      value: {}
    },
    index: {
      type: Number,
      value: 0
    },
    cities: {
      type: Array,
      value: []
    }

  },

  observers: {
    'index, hourByHour': function (index, _hourByHour) {
      if (_hourByHour && _charts.length > 0) {
        setOption(_charts[index].chart, _hourByHour)
      }
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    ec: {
      onInit: initChart
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  ready() {},
  /**
   * 组件的方法列表
   */
  methods: {

  }
})