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
    diezi: true,
    // 播放方式：xunhuanbofang 循环播放/suijibofang 随机播放/danquxunhuan单曲循环
    playWay: 'xunhuanbofang',
    showSonginfo: false,
  },
  onLoad() {

  },
  onShow: function(options) {
    const page = this

    this.setData({
      playstatus: app.globalData.playstatus,
      songinfo: app.globalData.songList[app.globalData.currentIndex],
      songList: app.globalData.songList,
      currentIndex: app.globalData.currentIndex,
      isLoad: app.globalData.isLoad,
      playWay: app.globalData.playWay,
    })
    // 设置顶部导航栏文字
    wx.setNavigationBarTitle({
      title: this.data.songinfo.name + " - " + this.data.songinfo.ar[0].name
    })
    this.getLyric()
    // 获取时间并启动定时器
    this.getTime()
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
    // 设置歌词
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
    app.playOrPause()
  },
  // 上一首
  preSong() {
    app.preSong()
  },
  // 下一首
  nextSong() {
    app.nextSong()
  },
  // 图片加载完成
  imgLoad(e) {
    this.setData({
      forLoadPic: this.data.songinfo.al.picUrl
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
    app.changeSong(index)
    // 加载歌词
    this.getLyric()
    // 设置顶部导航栏文字
    wx.setNavigationBarTitle({
      title: app.globalData.songList[app.globalData.currentIndex].name + " - " + app.globalData.songList[app.globalData.currentIndex].ar[0].name
    })
  },
  // 删除一首歌
  delOneSong(e) {
    let index = e.currentTarget.dataset.index
    app.delOneSong(index)
  },
  // 获得当前歌曲歌词
  getLyric() {
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
        } else if (res.data.lrc.lyric) {

          // console.log(res.data.lrc.lyric)
          var lyric = res.data.lrc.lyric

          if (!lyric || lyric == "") {
            this.data.lrcTime = []
            this.setData({
              lrcText: ['', '暂无歌词']
            })
          } else {
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
              lrcText,
              lrcIndex: 0,
              lrcScroll: "active"
            })
          }
        } else {
          // console.error(res.data)
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
          duration: 2000
        })
      }
    })
  },
  seekTo(e) {
    // console.log("跳转")

    var x = e.touches[0].clientX - 67 * app.globalData.scaleRate

    // clearInterval(app.globalData.timeId)
    this.setData({
      movebarX: x,
      lrcIndex: 0,
      lrcScroll: "active",
    })
    let duration = backgroundAudioManager.duration || app.globalData.songList[app.globalData.currentIndex].dt / 1000
    if (app.globalData.playstatus == 0) {
      app.globalData.backgroundAudioManager.seek(duration * this.data.movebarX / (242 * app.globalData.scaleRate))
    } else {
      app.letsPlay(false, duration * this.data.movebarX / (242 * app.globalData.scaleRate))
    }
  },
  // 点击碟子container切换到歌词页面
  tapswiper() {
    this.setData({
      diezi: !this.data.diezi
    })
  },
  // 播放方式切换
  playWay() {
    if (this.data.playWay == 'xunhuanbofang') {
      // 切换到随机播放
      this.setData({
        playWay: 'suijibofang'
      })
      wx.showToast({
        title: '随机播放',
        icon: "none"
      })
      app.globalData.playWay = 'suijibofang'
    } else if (this.data.playWay == 'suijibofang') {
      // 切换到单曲循环
      this.setData({
        playWay: 'danquxunhuan'
      })
      wx.showToast({
        title: '单曲循环',
        icon: "none"
      })
      app.globalData.playWay = 'danquxunhuan'
    } else if (this.data.playWay == 'danquxunhuan') {
      // 切换到列表循环
      this.setData({
        playWay: 'xunhuanbofang'
      })
      wx.showToast({
        title: '列表循环',
        icon: "none"
      })
      app.globalData.playWay = 'xunhuanbofang'
    } else {
      // console.error("!!!")
    }
    wx.setStorage({
      key: 'playWay',
      data: app.globalData.playWay,
    })
  },
  // 显示歌曲操作列表
  showSonginfo() {
    this.setData({
      showSonginfo: true
    })

  },
  hideSonginfo() {
    this.setData({
      showSonginfo: false
    })
  },
  // 跳转到歌手详情
  singerInfo() {
    wx.navigateTo({
      url: '/pages/playlist/playlist?for=singer'
    })
    this.setData({
      showSonginfo: false
    })
  },
  // 收藏 或 取消收藏 本曲
  addLove() {
    if (!this.data.songinfo.love) {
      // 收藏
      this.data.songinfo.love = true
      this.setData({
        songinfo: this.data.songinfo
      })
      app.globalData.songList[app.globalData.currentIndex].love = true

      app.globalData.myCollection.unshift(this.data.songinfo)
    } else {
      // 取消收藏
      this.data.songinfo.love = false
      this.setData({
        songinfo: this.data.songinfo
      })
      app.globalData.songList[app.globalData.currentIndex].love = false

      app.globalData.myCollection.forEach((item, index) => {
        if (item.id == this.data.songinfo.id) {
          app.globalData.myCollection.splice(index, 1)
          return
        }
      })
    }
    wx.setStorage({
      key: 'myCollection',
      data: app.globalData.myCollection,
    })
  },
})