//index.js
//获取应用实例
const app = getApp()

const innerAudioContext = app.globalData.innerAudioContext
Page({
  data: {
    input: '',
    searchlist: [],
    songinfo: {}
  },

  onLoad: function() {},
  // 搜索
  searchsongs(e) {
    if (!e.detail.value.trim()) {
      return
    }
    wx.showLoading({
      title: '加载中',
    })
    // 更新input value
    this.setData({
      input: e.detail.value
    })
    const page = this
    wx.request({
      url: 'https://api.imjad.cn/cloudmusic/?type=search&s=' + page.data.input,
      success: function(res) {
        wx.hideLoading()

        page.setData({
          searchlist: res.data.result.songs
        })
      }
    })
  },
  // 播放歌曲
  playSong(e) {
    const page = this
    const id = e.currentTarget.id

    // 获取要播放的歌曲信息
    wx.request({
      url: 'https://api.imjad.cn/cloudmusic/?type=detail&id=' + id,
      success: function(res) {
        page.setData({
          songinfo: res.data.songs[0]
        })
        app.globalData.songinfo = res.data.songs[0]
      }
    })

    // 开始播放歌曲
    // 停止当前播放歌曲
    innerAudioContext.stop()
    // 根据id请求歌曲地址
    wx.request({
      url: 'https://api.imjad.cn/cloudmusic/?type=song&id=' + id + '&br=128000',
      success: function(res) {
        innerAudioContext.src = res.data.data[0].url
      }
    })
  }

})