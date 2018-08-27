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
    animationData: {},
    // 歌单id集合
    playlistsIds: ['360062344', '2201879658', '2236351380', '2121679666', "2366527805", "2360129270", "2166790155", "370535134", "2139324915", "2364912946", "2369163080", "2219988682", "2339316534", "123216450", "379133594", "2352800595", "2148086011", "152261", "37432514", "306397077", "8418150", "131149308", "321674374", "85175934", "8575496", "897089", "387465322", "117712470", "94284266", "115900031", "123243715", "368529707", "379014204", "375779419"],
    // 展示的歌单数量
    showPlaylistCount: 9,
    playlists: [],
    showList: false,
    showAside: 0,
    transitionend: true,
    asideBack: false,
  },
  onShow: function() {
    this.setData({
      songinfo: app.globalData.songList[app.globalData.currentIndex] || {},
      // 播放状态：0播放/1暂停/2停止
      playstatus: app.globalData.playstatus,
      songList: app.globalData.songList,
      currentIndex: app.globalData.currentIndex,
      isLoad: app.globalData.isLoad,
    })
  },
  onLoad() {
    this.setData({
      flag: app.globalData.flag
    })
    // 获取本地缓存,搜索历史记录
    wx.getStorage({
      key: 'searchHistory',
      success: (res) => {
        this.setData({
          searchHistory: res.data
        })
      },
    })
    // 初始化推荐歌单
    this.initPlaylists()
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
      key: "searchHistory",
      data: page.data.searchHistory
    })
    wx.showLoading({
      title: '加载中',
    })
    wx.request({
      url: 'https://api.imjad.cn/cloudmusic/?type=search&s=' + keywords,
      success: function(res) {
        // console.log(res.data)
        if (res.data.code == 200 && res.data.result.songCount == 0) {
          // 没有找到歌曲
          wx.showToast({
            title: '找不到相关信息',
            image: '/assets/images/warning.png',
            duration: 2000
          })
        } else if (res.data.code == 200 && res.data.result.songs) {
          var searchlist = []
          res.data.result.songs.forEach((item, index) => {
            var song = {}
            song.id = item.id
            song.name = item.name
            song.al = item.al
            song.alia = item.alia
            song.ar = item.ar
            song.dt = item.dt
            searchlist.push(song)
          })

          page.setData({
            searchlist
          })
        } else {
          // console.error(res.data)
          wx.showToast({
            title: '服务器正忙',
            image: '/assets/images/warning.png',
            duration: 2000
          })
        }
      },
      complete() {
        wx.hideLoading()
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
  // 点击播放歌曲
  playSong(e) {
    const song = this.data.searchlist[e.currentTarget.dataset.index]
    app.playSong(song)
  },
  // 播放暂停
  playOrPause() {
    app.playOrPause()
  },
  // 初始化首页歌单
  initPlaylists() {
    // 从所有歌单中随机选择 `showPlaylistCount` 个，以作首页展示
    var playlistsIds = this.data.playlistsIds.concat()
    var showPlaylistsIds = []
    var index

    for (var i = 0; i < this.data.showPlaylistCount; i++) {
      index = Math.floor(Math.random() * playlistsIds.length)
      showPlaylistsIds.push(playlistsIds[index])
      playlistsIds.splice(index, 1)
    }

    wx.showLoading({
      title: '加载中',
    })
    showPlaylistsIds.forEach((item, index) => {
      wx.request({
        url: 'https://api.imjad.cn/cloudmusic/?type=playlist&id=' + item,
        success: (res) => {
          if (res.data.code == 200 && res.data.playlist) {
            var playlist = {}

            playlist.id = res.data.playlist.id
            playlist.coverImgUrl = res.data.playlist.coverImgUrl
            playlist.name = res.data.playlist.name
            playlist.description = res.data.playlist.description
            if (res.data.playlist.playCount / 10000 >= 1) {
              playlist.playCount =
                Math.round(res.data.playlist.playCount / 10000) + "万"
            } else {
              playlist.playCount = res.data.playlist.playCount
            }

            this.data.playlists.push(playlist)

            this.setData({
              playlists: this.data.playlists
            })
          } else {
            // console.error(res.data)
            wx.showToast({
              title: '服务器正忙',
              image: '/assets/images/warning.png',
              duration: 2000
            })
          }
        },
        complete() {
          setTimeout(() => {
            wx.hideLoading()
          }, 300)
        },
        fail() {
          wx.showToast({
            title: '网络错误',
            image: '/assets/images/warning.png',
            duration: 2000
          })
        }
      })
    })
  },
  // 去歌单页面
  goPlaylist(e) {
    app.globalData.currentPlaylist = e.currentTarget.dataset.playlist
    wx.navigateTo({
      url: '/pages/playlist/playlist',
    })
  },
  // 显示歌曲列表
  showSongList() {
    this.setData({
      showList: true,
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
  },
  // 删除一首歌
  delOneSong(e) {
    let index = e.currentTarget.dataset.index
    app.delOneSong(index)
  },
  // 清空输入框
  clearInput() {
    this.setData({
      keywords: '',
      isInput: false
    })
  },
  // 删除一条搜索历史记录
  delSearchHistory(e) {
    wx.showModal({
      title: '提示',
      content: '删除该条记录？',
      confirmColor: '#89d0e7',
      success: (res) => {
        if (res.confirm) {
          var index = e.currentTarget.dataset.index
          this.data.searchHistory.splice(index, 1)
          this.setData({
            searchHistory: this.data.searchHistory
          })
          wx.setStorage({
            key: 'searchHistory',
            data: this.data.searchHistory,
          })
        }
      }
    })
  },
  showAside() {
    this.setData({
      showAside: 270 * app.globalData.scaleRate
    })
  },
  hideAside() {
    this.setData({
      showAside: 0,
      transitionend: false,
    })
  },
  // 用于mask的层级改变
  changeZindex() {
    if (this.data.showAside == 0) {
      this.setData({
        transitionend: true
      })
    }
  },
  // 移动侧边栏
  changeAside(e) {
    if (e.detail.source == "touch") {
      // 拖动距离
      if (e.detail.x < 270 / 2 * app.globalData.scaleRate) {
        this.data.asideBack = true
      } else {
        this.data.asideBack = false
      }
    }
  },
  asideTouchend() {
    if (this.data.asideBack) {
      this.setData({
        showAside: 0,
        transitionend: false,
      })
    } else {
      this.setData({
        showAside: 270 * app.globalData.scaleRate,
      })
    }
  },
  goListenHistory() {
    wx.navigateTo({
      url: '/pages/playlist/playlist?for=listenHistory',
    })
  },
  goMylove() {
    wx.navigateTo({
      url: '/pages/playlist/playlist?for=mylove',
    })
  },
  showAuthorInfo() {
    wx.showModal({
      title: '关于',
      content: '感谢journey.ad\n作者wx:luokai34619545',
      showCancel: false,
      confirmColor: '#89d0e7',
    })
  },
  showOtherInfo() {
    wx.showModal({
      title: '关于',
      content: '分享喜欢的音乐',
      showCancel: false,
      confirmColor: '#89d0e7',
    })
  },
})