# 微天气微信小程序

集地理信息与天气预报为一体的天气预报类小程序，界面精美，使用便捷。【致敬：和风天气】

ps: 天气小程序是为了验证自己进入全栈的磨刀石，如今产出物已可以正常对外提供常规天气预报服务。

> 原名：拂衣天气，由于微信认证相关问题，目前在某些地方同时存在拂衣天气与微天气的表达，但其实他们指代的同一个事物。

## 快速体验

![微天气小程序二维码](https://cdn.jsdelivr.net/gh/zhou-fuyi/micro-weather-docs/refs/imgs/v1/8.jpg)

## 状态

不定期更新...

## 特性

- [x] 微信小程序
- [x] 集成腾讯地图，支持基础地图漫游，地图点击以及定位
- [x] 接入和风天气数据，确保数据真实可用
- [x] 提供实时天气预报、空气质量预报
- [x] 提供24小时天气预报
- [x] 提供7天天气预报
- [x] 提供城市实时天气海报分享
- [x] 提供城市搜索功能，可自定义关注城市
- [ ] 提供极端天气提醒+消息推送
- [ ] 结合AIGC优化分享海报
- [ ] 提供Web端+自定义地图模块

## 工程结构
微天气小程序存在独立的服务端程序，用于提供认证（微信小程序登录）、城市数据以及天气数据代理。当前仓库仅仅是小程序前端内容，服务端程序存在于独立仓库[micro-weather-backend](https://github.com/zhou-fuyi/micro-weather-backend)中。

1. components： 用于存放组件

    echats([echarts-for-weixin](https://github.com/ecomfe/echarts-for-weixin)): echarts-for-weixin 项目提供了一个小程序组件，用这种方式可以方便地使用 ECharts。
    
    vertical-sliding: 自定义组件，提供垂直方向滑动
    
    weather/weather-card: 自定义组件，城市天气卡片

    weather/real-time: 自定义组件，实时天气、空气质量预报

    weather/hour-foreacast: 自定义组件，24小时天气预报
    
    weather/day-foreacast: 自定义组件，7天天气预报

2. config: 提供全局的配置信息

    如: 服务端访问地址、服务端API、腾讯地图配置

3. libs: 三方sdk, 此处存放腾讯地址sdk

4. pages：页面，目前一共分为两个页面。即主页和城市页面

5. request: 封装的请求工具

6. styles: 全局的外部的样式文件

7. utils: 封装的常用工具

## 先决条件

如果需要调试本项目，那么需要先搭建服务端环境，具体的参见: [micro-weather-backend](https://github.com/zhou-fuyi/micro-weather-backend)

而后使用自己的小程序、和风天气、腾讯地图密钥替换即可

## 截图

<div style="display:inline-block">
  <img src="https://cdn.jsdelivr.net/gh/zhou-fuyi/micro-weather-docs/refs/imgs/v1/1.jpg" alt="主页1">
  <img src="https://cdn.jsdelivr.net/gh/zhou-fuyi/micro-weather-docs/refs/imgs/v1/2.jpg" alt="主页2">
  <img src="https://cdn.jsdelivr.net/gh/zhou-fuyi/micro-weather-docs/refs/imgs/v1/3.jpg" alt="主页3">
</div>

<div style="display:inline-block">
  <img src="https://cdn.jsdelivr.net/gh/zhou-fuyi/micro-weather-docs/refs/imgs/v1/4.jpg" alt="城市1">
  <img src="https://cdn.jsdelivr.net/gh/zhou-fuyi/micro-weather-docs/refs/imgs/v1/5.jpg" alt="城市2">
</div>

<div style="display:inline-block">
  <img src="https://cdn.jsdelivr.net/gh/zhou-fuyi/micro-weather-docs/refs/imgs/v1/6.jpg" alt="海报1">
  <img src="https://cdn.jsdelivr.net/gh/zhou-fuyi/micro-weather-docs/refs/imgs/v1/7.png" alt="海报2">
</div>

## 支持

- thread.zhou@gmail.com
- thread_zhou@126.com


## 声明与致谢

- 部分图标来自阿里巴巴矢量图标库
- 天气部分图标由和风天气提供
- 目前全部的天气数据均由和风天气免费提供
- echarts组件由Apache Echarts提供
- 小程序内地图由腾讯地图提供

感谢和风天气、微信、腾讯地图、阿里巴巴矢量图标库以及所有为本项目提供支持的主体。

## 版权许可

 [GPL-3.0 license](https://cdn.jsdelivr.net/gh/zhou-fuyi/micro-weather-wechat/LICENSE)

 版权所有 (c) 2022-至今，Fuyi Atlas。