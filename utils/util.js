const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * px to rpx
 * 
 * 参考：https://juejin.cn/post/6877373754601013255
 * 
 * @param {*} px 
 * @param {*} windowWidth 
 * @returns 
 */
const px2rpx = (px, windowWidth) => {
  return px * (750 / windowWidth)
}

const rpx2px = (rpx, windowWidth) => {
  return px / (750 / windowWidth)
}

/**
 * 时间解构
 * @param {*} time_str such as: '2022-02-03T11:53+08:00'
 * @returns {year, month, day, hour, minute, second}
 */
const deconstructionTime = (time_str) => {
  let date = new Date(time_str)
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds()
  }
}

const _week_day = '日一二三四五六';

const dayOfTheWeek = (time_str) => {
  let date = new Date();
  if (time_str) {
    date = new Date(time_str)
  }
  return '周' + _week_day.charAt(date.getDay())
}

const _aqi_category = ['优', '良', '轻微污染', '轻度污染', '中度污染', '重污染'];
const _aqi_color = [
  [50, 205, 50],
  [255, 215, 0],
  [255, 126, 0],
  [255, 0, 0],
  [153, 0, 76],
  [126, 0, 35]
]
const getAqiColor = aqi => {
  let color = []
  for (var index = 0; index < _aqi_category.length; index++) {
    if (_aqi_category[index] === aqi) {
      color = _aqi_color[index]
      break
    }
  }
  return color
}

// 箭头函数的this始终指向函数定义时的this
/**
 * 获取当前定位
 * @returns 
 */
const location = ({
  type,
  altitude,
  isHighAccuracy
} = {
    type: 'gcj02',
    altitude: false,
    isHighAccuracy: true
  }) => {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type,
      altitude,
      isHighAccuracy,
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

const mapFollowcities = (followCities) => {
  return followCities.map(item => ({
    id: item.divisionId,
    name: item.divisionName,
    code: item.divisionCode,
    followed: true,
    ref_id: item.id
  }))
}

/**
 * 获取当前地图中心的经纬度。返回的是 gcj02 坐标系 Promise
 * @param {*} mapContext 
 * @returns 
 */
const getCenterLocation = (mapContext) => {
  return new Promise((resolve, reject) => {
    mapContext.getCenterLocation({
      success: res => {
        resolve(res)
      },
      fail: err => {
        reject(err)
      }
    })
  })
}

/**
 * 获取当前地图的视野范围
 * @param {*} mapContext 
 * @returns 
 */
const getRegion = (mapContext) => {
  return new Promise((resolve, reject) => {
    mapContext.getRegion({
      success: res => {
        resolve(res)
      },
      fail: err => {
        reject(err)
      }
    })
  })
}

/**
 * 获取当前地图的缩放级别
 * @param {*} mapContext 
 * @returns 
 */
const getScale = (mapContext) => {
  return new Promise((resolve, reject) => {
    mapContext.getScale({
      success: res => {
        resolve(res)
      },
      fail: err => {
        reject(err)
      }
    })
  })
}

module.exports = {
  formatTime,
  px2rpx,
  deconstructionTime,
  dayOfTheWeek,
  getAqiColor,
  location,
  mapFollowcities,
  getScale,
  getRegion,
  getCenterLocation
}