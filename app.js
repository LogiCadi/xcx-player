//app.js
App({
  globalData: {
    // 请求地址
    apiRootUrl: 'https://api.imjad.cn/cloudmusic/',
    // 播放列表
    songList: [],
    // 当前歌曲索引
    currentIndex: 0,
    // 播放器对象
    backgroundAudioManager: wx.getBackgroundAudioManager(),
    // 播放状态：0播放/1暂停/2停止
    playstatus: 2,
    timeId: 0,
    isLoad: false,
    // 页面宽度与原始750rpx的缩放比例
    scaleRate: 1
  },
  onLaunch: function() {

    //获取歌曲列表和当前歌曲序号
    this.globalData.songList = wx.getStorageSync('songList') || []
    this.globalData.currentIndex = wx.getStorageSync('currentIndex') || 0
    this.openAudioListener()
  },
  // 将歌曲列表缓存到本地
  cacheLocalSongList() {
    wx.setStorage({
      key: 'songList',
      data: this.globalData.songList,
    })
    wx.setStorage({
      key: 'currentIndex',
      data: this.globalData.currentIndex,
    })
  },
  // 获取歌曲url
  getUrl(id, callback) {
    wx.request({
      url: "https://api.imjad.cn/cloudmusic/?type=song&id=" + id + "&br=128000",
      success(res) {
        callback && callback(res.data.data[0].url)
      }
    })
  },
  // 开始播放
  letsPlay(page, pre, startTime) {
    const song = this.globalData.songList[this.globalData.currentIndex]
    const backgroundAudioManager = this.globalData.backgroundAudioManager
    backgroundAudioManager.stop()

    this.getUrl(song.id, url => {
      if (!url) {
        wx.showToast({
          title: '无法播放该歌曲',
          image: '/assets/images/warning.png',
          duration: 3000
        })
        if (pre) {
          page.preSong()
        } else {
          page.nextSong()
        }
        return
      }
      backgroundAudioManager.title = song.name
      backgroundAudioManager.epname = song.alia[0]
      backgroundAudioManager.singer = song.ar[0].name
      backgroundAudioManager.coverImgUrl = song.al.picUrl
      backgroundAudioManager.src = url
      if (startTime) {
        backgroundAudioManager.startTime = startTime
      } else {
        backgroundAudioManager.startTime = 0
      }
    })
  },

  // 从播放列表删除一首歌曲
  delOneSong(page, index) {
    this.globalData.songList.splice(index, 1)
    // 判断当前歌曲索引位置
    if (this.globalData.currentIndex > index) {
      this.globalData.currentIndex = this.globalData.currentIndex - 1
      page.setData({
        songList: this.globalData.songList,
        currentIndex: this.globalData.currentIndex
      })
    } else if (this.globalData.currentIndex == index) {
      // 删除的是当前歌曲
      // 删除了列表中唯一一首歌
      if (this.globalData.songList.length == 0) {
        this.globalData.currentIndex = -1
        if (this.globalData.playstatus != 3) {
          this.globalData.backgroundAudioManager.stop()
        }
        this.cacheLocalSongList()
        wx.navigateTo({
          url: '/pages/index/index',
        })
        return
      }
      // 删除的是列表末尾的歌曲,但不是唯一一首
      // 要播放列表第一首
      if (this.globalData.currentIndex > this.globalData.songList.length - 1) {
        this.globalData.currentIndex = 0
      }

      if (this.globalData.playstatus == 0) {
        this.letsPlay(page)
      } else if (this.globalData.playstatus == 1) {
        this.globalData.backgroundAudioManager.stop()
        page.setTime && page.setTime()
      } else if (this.globalData.playstatus == 2) {
        page.setTime && page.setTime()
      }
      page.setData({
        songList: this.globalData.songList,
        currentIndex: this.globalData.currentIndex,
        songinfo: this.globalData.songList[this.globalData.currentIndex],
      })
      if (page.setTime) {
        // 设置顶部导航栏文字
        wx.setNavigationBarTitle({
          title: this.globalData.songList[this.globalData.currentIndex].name + " - " + this.globalData.songList[this.globalData.currentIndex].ar[0].name
        })
      }
    } else {
      page.setData({
        songList: this.globalData.songList
      })
    }
    this.cacheLocalSongList()
  },

  // 上一首
  preSong(page) {
    this.globalData.currentIndex = this.globalData.currentIndex - 1
    if (this.globalData.currentIndex < 0) {
      this.globalData.currentIndex = this.globalData.songList.length - 1
    }

    this.letsPlay(page, true)
    this.cacheLocalSongList()
  },
  // 下一首
  nextSong(page) {
    this.globalData.currentIndex = this.globalData.currentIndex + 1
    if (this.globalData.currentIndex > this.globalData.songList.length - 1) {
      this.globalData.currentIndex = 0
    }

    this.letsPlay(page)
    this.cacheLocalSongList()
  },
  // 开启播放器全局监听
  openAudioListener() {
    const backgroundAudioManager = this.globalData.backgroundAudioManager
    let page;
    backgroundAudioManager.onPlay(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      console.log('开始播放')
      page.setData({
        playstatus: 0
      })
      this.globalData.playstatus = 0
      page.getTime && page.getTime()
    })
    backgroundAudioManager.onWaiting(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      console.log('加载中')
      page.setData({
        isLoad: false,
        playstatus: 0,
        songinfo: this.globalData.songList[this.globalData.currentIndex],
        currentIndex: this.globalData.currentIndex
      })
      // 加载歌词
      page.getLyric && page.getLyric()
      this.globalData.isLoad = false
      this.globalData.playstatus = 0
      setTimeout(() => {
        if (this.globalData.isLoad == false) {
          wx.showLoading({
            title: '加载中',
          })
        }
      }, 1000)
    })
    backgroundAudioManager.onCanplay(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      console.log('可以播放')
      page.setData({
        isLoad: true,
        lrcScroll: "active"
      })
      this.globalData.isLoad = true
      wx.hideLoading()
    })
    backgroundAudioManager.onPause(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      console.log('暂停')
      clearInterval(this.globalData.timeId)
      page.setData({
        playstatus: 1
      })
      this.globalData.playstatus = 1
    })
    backgroundAudioManager.onStop(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      console.log('停止')
      clearInterval(this.globalData.timeId)
      page.setData({
        playstatus: 2
      })
      this.globalData.playstatus = 2
    })
    backgroundAudioManager.onEnded(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      console.log('本曲播放完毕')
      clearInterval(this.globalData.timeId)
      // 当前歌曲播放自然结束
      page.setData({
        playstatus: 2
      })
      this.globalData.playstatus = 2
      // 下一首
      page.nextSong()
    })
    backgroundAudioManager.onPrev(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      console.log('上一首')
      clearInterval(this.globalData.timeId)
      // 点击上一首
      page.preSong()
    })
    backgroundAudioManager.onNext(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      console.log('下一首')
      clearInterval(this.globalData.timeId)
      // 点击下一首
      page.nextSong()
    })
    backgroundAudioManager.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
      wx.showToast({
        title: '网络错误',
      })
    })
  }
})