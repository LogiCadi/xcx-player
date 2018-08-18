//app.js
App({
  globalData: {
    userInfo: null,
    // 当前播放歌曲信息
    songinfo: {},
    // 播放器对象
    innerAudioContext: wx.createInnerAudioContext()
  },
  onLaunch: function() {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    const innerAudioContext = this.globalData.innerAudioContext
    innerAudioContext.autoplay = true
    innerAudioContext.onPlay(() => {
      console.log('开始播放')
    })
    innerAudioContext.onStop(() => {
      console.log('停止播放')
    })
    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    })

  }

})