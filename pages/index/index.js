//index.js
//获取应用实例
const app = getApp()

const backgroundAudioManager = app.globalData.backgroundAudioManager
const apiRootUrl = app.globalData.apiRootUrl
Page({
  data: {
    isInput: false,
    // 搜索关键字
    keywords: '',
    searchlist: [],
    searchHistory: [],
    // 歌曲信息
    songinfo: {},
    // 播放状态：0播放/1暂停/2停止
    playstatus: 2,
    songList: [],
    currentIndex: 0,
    animationData: {}
  },
  onShow: function() {
    const page = this

    this.setData({
      songinfo: app.globalData.songList[app.globalData.currentIndex] || {},
      // 播放状态：0播放/1暂停/2停止
      playstatus: app.globalData.playstatus,
      songList: app.globalData.songList,
      currentIndex: app.globalData.currentIndex
    })
    // 获取本地缓存,搜索历史记录
    wx.getStorage({
      key: 'sHistory',
      success: function(res) {
        page.setData({
          searchHistory: res.data
        })
      },
    })
  },
  onReady() {
    //创建节点选择器
    var query = wx.createSelectorQuery();
    //获取容器的比例
    query.select('.container').boundingClientRect(function(rect) {
      app.globalData.scaleRate = (rect.width / 375).toPrecision(2)
    }).exec();
  },
  // 跳往播放器页面
  goPlayer() {
    if (app.globalData.songList.length == 0) {
      return
    }
    wx.navigateTo({
      url: '/pages/player/player'
    })
  },
  // 点击搜索历史项，添加到搜索框并搜索关键字
  addAndSearch(e) {
    const keywords = e.currentTarget.dataset.val
    this.setData({
      keywords,
      isInput: true
    })
    this.searchsongs()
  },
  // 搜索框输入时，离焦触发，修改关键字并搜索
  blurAndSearch(e) {
    const keywords = e.detail.value.trim()
    // 校验是否为空
    if (!keywords) {
      return
    }
    this.setData({
      keywords
    })
    this.searchsongs()
  },
  // 判断是否输入
  changeInput(e) {
    let input = e.detail.value
    let isInput = this.data.isInput
    if (Boolean(input) != isInput) {
      this.setData({
        isInput: !isInput,
        searchlist: []
      })
    }
  },
  // 搜索
  searchsongs() {
    const page = this
    const searchHistory = page.data.searchHistory
    const keywords = page.data.keywords

    wx.showLoading({
      title: '加载中',
    })
    // 记录搜索关键字
    // 是否已经被搜索
    searchHistory.forEach((item, index) => {
      if (item == keywords) {
        searchHistory.splice(index, 1)
        return
      }
    })
    searchHistory.unshift(keywords)
    // 历史记录是否大于15个
    if (searchHistory.length > 15) {
      searchHistory.pop()
    }
    page.setData({
      searchHistory
    })
    wx.setStorage({
      key: "sHistory",
      data: page.data.searchHistory
    })
    wx.request({
      url: 'https://api.imjad.cn/cloudmusic/?type=search&s=' + keywords,
      success: function(res) {
        // 关闭loading显示
        wx.hideLoading()
        if (res.statusCode == 200) {
          page.setData({
            searchlist: res.data.result.songs
          })
        } else {
          wx.showToast({
            title: '网络错误',
            image: '/assets/images/warning.png',
            duration: 2000
          })
        }
      }
    })
  },
  // 点击播放歌曲
  playSong(e) {
    const page = this
    const id = e.currentTarget.id

    // 获取要播放的歌曲信息，并将其添加到播放列表末尾
    wx.request({
      url: 'https://api.imjad.cn/cloudmusic/?type=detail&id=' + id,
      success: function(res) {
        console.log(res.data)
        // 更新歌曲列表
        let hasTheSong = false
        app.globalData.songList.forEach((item, index) => {
          if (item.id == res.data.songs[0].id) {
            app.globalData.currentIndex = index
            hasTheSong = true
            return
          }
        })

        if (hasTheSong == false) {
          app.globalData.songList.push(res.data.songs[0])
          app.globalData.currentIndex = app.globalData.songList.length - 1
        }

        // 开始播放歌曲
        app.letsPlay(page)
        page.setData({
          songinfo: res.data.songs[0]
        })
        // 缓存歌曲列表到本地
        app.cacheLocalSongList()
      }
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
    this.setData({
      songinfo: app.globalData.songList[app.globalData.currentIndex]
    })
  },
  // 下一首
  nextSong() {
    app.nextSong(this)
    this.setData({
      songinfo: app.globalData.songList[app.globalData.currentIndex]
    })
  }
})