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

module.exports = {
  formatTime,
  px2rpx,
  deconstructionTime
}
