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

module.exports = {
  formatTime,
  px2rpx
}
