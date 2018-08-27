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
    // 设置歌曲进度条的定时器
    timeId: 0,
    // 当前歌曲是否加载完成
    isLoad: false,
    // 页面宽度与原始750rpx的缩放比例
    scaleRate: 1,
    //当前显示的歌单
    currentPlaylist: {},
    // 播放方式
    playWay: "xunhuanbofang",
    // 听歌记录
    listenHistory: [],
    // 我的收藏
    myCollection: [],
    flag: false
  },
  onLaunch: function() {
    // 关闭调试
    wx.setEnableDebug({
      enableDebug: false
    })
    wx.request({
      url: 'https://api.imjad.cn/cloudmusic/?type=playlist&id=419585557',
      success: res => {
        if (res.data.playlist.trackIds[0].id == 1429338) {
          this.globalData.flag = false
        } else {
          this.globalData.flag = true
        }
      },
    })
    //获取歌曲列表和当前歌曲序号
    this.globalData.songList = wx.getStorageSync('songList') || [{
      al: {
        id: 40148,
        name: "A Cup Of Coffee",
        pic: 881808325476577,
        picUrl: "https://p1.music.126.net/P1ac-TWkFzjDqcvl5_oK7Q==/881808325476577.jpg"
      },
      ar: [{
        id: 13950,
        name: "DJ Okawari"
      }],
      dt: 266345,
      id: 406238,
      name: "Flower Dance",
      alia: []
    }]
    this.globalData.currentIndex = wx.getStorageSync('currentIndex') || 0
    wx.getStorage({
      key: 'listenHistory',
      success: (res) => {
        this.globalData.listenHistory = res.data || []
      },
    })
    wx.getStorage({
      key: 'myCollection',
      success: (res) => {
        this.globalData.myCollection = res.data || []
      },
    })
    wx.getStorage({
      key: 'playWay',
      success: (res) => {
        this.globalData.playWay = res.data || 'xunhuanbofang'
      },
    })
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

  /**
   * 获取并加载歌曲的url等信息，每次播放另一首歌曲都会调用此方法
   * @param pre 是否通过点击`preSong()`上一首方法来调用
   * @param startTime 歌曲播放的起始位置，单位：s
   */
  letsPlay(pre, startTime) {
    var page = getCurrentPages()[getCurrentPages().length - 1]
    const song = this.globalData.songList[this.globalData.currentIndex]
    const backgroundAudioManager = this.globalData.backgroundAudioManager
    // backgroundAudioManager.stop()

    wx.request({
      url: "https://api.imjad.cn/cloudmusic/?type=song&id=" + song.id + "&br=128000",
      success: (res) => {
        if (!res.data.data[0].url) {
          wx.showToast({
            title: '本曲无法播放',
            image: '/assets/images/warning.png',
            duration: 3000
          })
          if (pre) {
            this.preSong()
          } else {
            this.nextSong()
          }
        } else if (res.data.data[0].url) {
          backgroundAudioManager.title = song.name
          // backgroundAudioManager.epname = song.al.name
          backgroundAudioManager.singer = song.ar[0].name
          backgroundAudioManager.coverImgUrl = song.al.picUrl
          backgroundAudioManager.src = res.data.data[0].url
          if (startTime) {
            backgroundAudioManager.startTime = startTime
          } else {
            backgroundAudioManager.startTime = 0
          }
        } else {
          // console.error(res)
          wx.showToast({
            title: '服务器正忙',
            image: '/assets/images/warning.png',
            duration: 2000
          })
        }
      },
      fail() {
        wx.showToast({
          title: '网络错误',
          image: '/assets/images/warning.png',
          duration: 3000
        })
      }
    })

    // 添加听歌记录
    this.globalData.listenHistory.forEach((item, index) => {
      if (item.id == song.id) {
        this.globalData.listenHistory.splice(index, 1)
        return
      }
    })
    this.globalData.listenHistory.unshift(song)

    // 是否超过100首
    if (this.globalData.listenHistory.length > 100) {
      this.globalData.listenHistory.pop()
    }
    wx.setStorage({
      key: 'listenHistory',
      data: this.globalData.listenHistory,
    })
  },
  /**
   * 播放或暂停
   */
  playOrPause() {
    var page = getCurrentPages()[getCurrentPages().length - 1]

    if (this.globalData.playstatus == 0) {
      // 当前正在播放
      this.globalData.backgroundAudioManager.pause()
    } else if (this.globalData.playstatus == 1) {
      // 当前正在暂停
      this.globalData.backgroundAudioManager.play()
    } else {
      // 停止状态
      page.setData({
        playstatus: 0
      })
      this.globalData.playstatus = 0
      this.letsPlay()
    }
  },

  /**
   * 从播放列表删除一首歌曲
   * @param index 被删除的歌曲在播放列表的索引
   */
  delOneSong(index) {
    var page = getCurrentPages()[getCurrentPages().length - 1]
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
        wx.redirectTo({
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
        this.letsPlay()
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

      // 设置顶部导航栏文字
      page.setTime && wx.setNavigationBarTitle({
        title: this.globalData.songList[this.globalData.currentIndex].name + " - " + this.globalData.songList[this.globalData.currentIndex].ar[0].name
      })

    } else {
      page.setData({
        songList: this.globalData.songList
      })
    }
    this.cacheLocalSongList()
  },

  /**
   * 上一首
   */
  preSong() {
    var page = getCurrentPages()[getCurrentPages().length - 1]
    if (this.globalData.playWay == 'xunhuanbofang' || 'danquxunhuan') {
      this.globalData.currentIndex = this.globalData.currentIndex - 1
      if (this.globalData.currentIndex < 0) {
        this.globalData.currentIndex = this.globalData.songList.length - 1
      }
    } else if (this.globalData.playWay == 'suijibofang') {
      var index = this.globalData.currentIndex
      while (this.globalData.currentIndex == index) {
        index = Math.floor(Math.random() * this.globalData.songList.length)
      }
      this.globalData.currentIndex = index
    } else {
      // console.error("!!!")
    }
    page.setData({
      currentIndex: this.globalData.currentIndex,
      songinfo: this.globalData.songList[this.globalData.currentIndex],
    })
    // 加载歌词
    page.getLyric && page.getLyric()
    // 设置顶部导航栏文字
    page.setTime && wx.setNavigationBarTitle({
      title: this.globalData.songList[this.globalData.currentIndex].name + " - " + this.globalData.songList[this.globalData.currentIndex].ar[0].name
    })

    this.letsPlay(true)
    this.cacheLocalSongList()
  },

  /**
   * 播放下一首
   * @param isNature 是否是自然播放到下一曲
   */
  nextSong(isNature) {
    var page = getCurrentPages()[getCurrentPages().length - 1]

    if (this.globalData.playWay == 'xunhuanbofang') {
      this.globalData.currentIndex = this.globalData.currentIndex + 1
      if (this.globalData.currentIndex > this.globalData.songList.length - 1) {
        this.globalData.currentIndex = 0
      }
    } else if (this.globalData.playWay == 'suijibofang') {
      var index = this.globalData.currentIndex
      while (this.globalData.currentIndex == index) {
        index = Math.floor(Math.random() * this.globalData.songList.length)
      }
      this.globalData.currentIndex = index
    } else if (this.globalData.playWay == 'danquxunhuan') {
      if (!isNature) {
        this.globalData.currentIndex = this.globalData.currentIndex + 1
        if (this.globalData.currentIndex > this.globalData.songList.length - 1) {
          this.globalData.currentIndex = 0
        }
      }
    } else {
      // console.error("!!!")
    }
    page.setData({
      currentIndex: this.globalData.currentIndex,
      songinfo: this.globalData.songList[this.globalData.currentIndex],
    })
    // 加载歌词
    page.getLyric && page.getLyric()
    // 设置顶部导航栏文字
    page.setTime && wx.setNavigationBarTitle({
      title: this.globalData.songList[this.globalData.currentIndex].name + " - " + this.globalData.songList[this.globalData.currentIndex].ar[0].name
    })
    this.letsPlay()
    this.cacheLocalSongList()
  },

  /**
   * 开启播放器全局监听
   * 
   */
  openAudioListener() {
    const backgroundAudioManager = this.globalData.backgroundAudioManager
    let page;
    backgroundAudioManager.onPlay(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      // console.log('开始播放')
      page.setData({
        playstatus: 0,
        lrcIndex: 0,
      })
      this.globalData.playstatus = 0
      page.getTime && page.getTime()
    })
    backgroundAudioManager.onWaiting(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      // console.log('加载中')
      page.setData({
        isLoad: false,
        playstatus: 0,
      })
      page.setTime && page.setTime()
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
      // console.log('可以播放')
      page.setData({
        isLoad: true,
      })
      this.globalData.isLoad = true
      wx.hideLoading()
    })
    backgroundAudioManager.onPause(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      // console.log('暂停')
      clearInterval(this.globalData.timeId)
      page.setData({
        playstatus: 1
      })
      this.globalData.playstatus = 1
    })
    backgroundAudioManager.onStop(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      // console.log('停止')
      clearInterval(this.globalData.timeId)
      page.setData({
        playstatus: 2
      })
      this.globalData.playstatus = 2
    })
    backgroundAudioManager.onEnded(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      // console.log('本曲播放完毕')
      clearInterval(this.globalData.timeId)
      // 当前歌曲播放自然结束
      page.setData({
        playstatus: 2
      })
      this.globalData.playstatus = 2
      // 下一首
      this.nextSong(true)
    })
    backgroundAudioManager.onPrev(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      // console.log('上一首')
      clearInterval(this.globalData.timeId)
      // 点击上一首
      this.preSong()
    })
    backgroundAudioManager.onNext(() => {
      page = getCurrentPages()[getCurrentPages().length - 1]
      // console.log('下一首')
      clearInterval(this.globalData.timeId)
      // 点击下一首
      this.nextSong()
    })
    backgroundAudioManager.onError((res) => {
      // console.log(res.errMsg)
      // console.log(res.errCode)
      backgroundAudioManager.stop()
      page.setData({
        playstatus: 2
      })
      this.globalData.playstatus = 2
      wx.showToast({
        title: '网络错误',
        image: '/assets/images/warning.png',
        duration: 2000
      })
    })
  },
  /**
   * 点击播放歌曲（例如从搜索列表或者歌单）
   * @param song 需要播放的歌曲
   */
  playSong(song) {
    const page = getCurrentPages()[getCurrentPages().length - 1]
    // 更新歌曲列表
    let hasTheSong = false
    this.globalData.songList.forEach((item, index) => {
      if (item.id == song.id) {
        this.globalData.currentIndex = index
        hasTheSong = true
        return
      }
    })

    if (hasTheSong == false) {

      // 加入播放列表的歌曲是否已被收藏
      this.globalData.myCollection.forEach((item, index) => {
        if (item.id == song.id) {
          song.love = true
          return
        }
      })

      this.globalData.songList.push(song)
      this.globalData.currentIndex = this.globalData.songList.length - 1
    }

    // 开始播放歌曲
    this.letsPlay()
    page.setData({
      songinfo: song,
      songList: this.globalData.songList,
      currentIndex: this.globalData.currentIndex
    })
    // 缓存歌曲列表到本地
    this.cacheLocalSongList()
  },
  /**
   * 在播放列表中切换歌曲
   * @param index 将要播放的歌曲在播放列表中的索引
   */
  changeSong(index) {
    const page = getCurrentPages()[getCurrentPages().length - 1]
    // 更改歌曲列表信息，改变当前歌曲索引
    this.globalData.currentIndex = index
    page.setData({
      currentIndex: this.globalData.currentIndex,
      songinfo: this.globalData.songList[this.globalData.currentIndex],
    })
    // 开始播放歌曲
    this.letsPlay()
    // 缓存歌曲列表到本地
    this.cacheLocalSongList()
  },
})