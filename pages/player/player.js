// pages/player/player.js

const app = getApp()
const backgroundAudioManager = app.globalData.backgroundAudioManager
Page({
  data: {
    // 播放状态：0播放/1暂停/2停止
    playstatus: 0,
    duration: '00:00',
    currentTime: "00:00",
    songinfo: {},
    forLoadPic: '',
    // 歌曲加载是否已完成
    isLoad: false,
    songList: [],
    currentIndex: 0,
    showList: false,
    lrcTime: [],
    lrcText: [],
    lrcIndex: 0,
    lrcScroll: "active",
    // 进度条offset
    movebarX: 0,
    diezi: true
  },
  onLoad() {

  },
  onShow: function(options) {
    const page = this
    // 设置顶部导航栏文字
    wx.setNavigationBarTitle({
      title: app.globalData.songList[app.globalData.currentIndex].name + " - " + app.globalData.songList[app.globalData.currentIndex].ar[0].name
    })
    this.setData({
      playstatus: app.globalData.playstatus,
      songinfo: app.globalData.songList[app.globalData.currentIndex],
      songList: app.globalData.songList,
      currentIndex: app.globalData.currentIndex,
      isLoad: app.globalData.isLoad
    })
    // 获取时间并启动定时器
    this.getTime()
    this.getLyric()

  },
  getTime() {
    this.setTime()
    if (this.data.playstatus == 0) {
      clearInterval(app.globalData.timeId)
      app.globalData.timeId = setInterval(() => {
        this.setTime()
      }, 1000)
    }
  },
  setTime() {
    let duration = backgroundAudioManager.duration || app.globalData.songList[app.globalData.currentIndex].dt / 1000
    let currentTime = backgroundAudioManager.currentTime || 0

    this.data.lrcTime.length > 0 && this.data.lrcTime.forEach((item, index) => {

      if (currentTime * 1000 + 500 >= item && this.data.lrcIndex < index) {
        this.setData({
          lrcIndex: index,
          lrcScroll: "active"
        })
        return
      }
    })
    this.setData({
      duration: String(Math.floor(duration / 60)).padStart(2, 0) + ":" + String(Math.round(duration % 60)).padStart(2, 0),
      currentTime: String(Math.floor(currentTime / 60)).padStart(2, 0) + ":" + String(Math.round(currentTime % 60)).padStart(2, 0),

      movebarX: currentTime / duration * 242 * app.globalData.scaleRate
    })
  },
  // 播放暂停
  playOrPause() {
    if (this.data.playstatus == 0) {
      // 当前正在播放
      backgroundAudioManager.pause()
    } else if (this.data.playstatus == 1) {
      // 当前正在暂停
      backgroundAudioManager.play()
    } else {
      // 停止状态
      this.setData({
        playstatus: 0
      })
      app.globalData.playstatus = 0
      app.letsPlay(this)
    }
  },
  // 上一首
  preSong() {
    app.preSong(this)

    // 设置顶部导航栏文字
    wx.setNavigationBarTitle({
      title: app.globalData.songList[app.globalData.currentIndex].name + " - " + app.globalData.songList[app.globalData.currentIndex].ar[0].name
    })
  },
  // 下一首
  nextSong() {
    app.nextSong(this)

    // 设置顶部导航栏文字
    wx.setNavigationBarTitle({
      title: app.globalData.songList[app.globalData.currentIndex].name + " - " + app.globalData.songList[app.globalData.currentIndex].ar[0].name
    })
  },
  // 图片加载完成
  imgLoad(e) {
    this.setData({
      forLoadPic: this.data.songinfo.al.picUrl
    })
  },
  // 循环
  loop() {
    wx.showToast({
      title: '列表循环',
      icon: "none"
    })
  },
  // 显示歌曲列表
  showSongList() {
    this.setData({
      showList: true
    })
  },
  hideSongList() {
    this.setData({
      showList: false
    })
  },
  // 切换歌曲
  changeSong(e) {
    let index = e.currentTarget.dataset.index

    // 更改歌曲列表信息，改变当前歌曲索引
    app.globalData.currentIndex = index

    // 开始播放歌曲
    app.letsPlay(this)

    // 设置顶部导航栏文字
    wx.setNavigationBarTitle({
      title: app.globalData.songList[app.globalData.currentIndex].name + " - " + app.globalData.songList[app.globalData.currentIndex].ar[0].name
    })
    // 缓存歌曲列表到本地
    app.cacheLocalSongList()
  },
  // 删除一首歌
  delOneSong(e) {
    let index = e.currentTarget.dataset.index
    app.delOneSong(this, index)
  },
  // 获得当前歌曲歌词
  getLyric() {
    this.setData({
      lrcIndex: 0
    })
    let id = app.globalData.songList[app.globalData.currentIndex].id
    wx.request({
      url: 'https://api.imjad.cn/cloudmusic/?type=lyric&id=' + id + '&br=128000',
      success: (res) => {
        // console.log(res.data)
        if (res.data.nolyric) {
          this.data.lrcTime = []
          this.setData({
            lrcText: ['', '纯音乐，请欣赏']
          })
        } else {
          var lyric = res.data.lrc.lyric

          if (!lyric || lyric == "") {
            this.data.lrcTime = []
            this.setData({
              lrcText: ['', '暂无歌词']
            })
            return
          }
          //把歌词拆分成两部分 时间点 和 歌词句
          var lrcTime = lyric.match(/\d+\:\d+\.\d+/g)
          // 将字符串格式的时间转换成毫秒级别的数字格式
          lrcTime.forEach((item, index) => {
            lrcTime[index] = parseInt(item.slice(0, item.indexOf(':'))) * 60 * 1000 +
              parseInt(item.slice(item.indexOf(':') + 1, item.indexOf('.'))) * 1000 +
              parseInt(item.slice(item.indexOf('.') + 1))
          })

          this.data.lrcTime = lrcTime

          let lrcTextForEach = lyric.split("\n")
          let lrcText = lrcTextForEach.concat()

          let count = 0
          lrcTextForEach.forEach((item, index) => {
            if (item.search(/\[\d+\:\d+\.\d+\]/) == -1) {
              lrcText.splice(index - count++, 1)
            } else {
              lrcText[index - count] = item.replace(/\[\d+\:\d+\.\d+\]/g, "")
            }
          })

          this.setData({
            lrcText
          })
        }
      }
    })
  },
  seekTo(e) {
    console.log("跳转")

    var x = e.touches[0].clientX - 67 * app.globalData.scaleRate

    // clearInterval(app.globalData.timeId)
    this.setData({
      movebarX: x,
      lrcIndex: 0
    })
    let duration = backgroundAudioManager.duration || app.globalData.songList[app.globalData.currentIndex].dt / 1000
    if (app.globalData.playstatus == 0) {
      app.globalData.backgroundAudioManager.seek(duration * this.data.movebarX / (242 * app.globalData.scaleRate))
    } else {
      app.letsPlay(this, false, duration * this.data.movebarX / (242 * app.globalData.scaleRate))
    }
  },
  tapswiper() {
    this.setData({
      diezi: !this.data.diezi
    })
  }
})