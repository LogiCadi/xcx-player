// pages/playlist/playlist.js
const app = getApp()
Page({
  data: {
    playlist: {},
    playlistSongs: [],
    singerinfo: {},
    // 歌曲信息
    songinfo: {},
    // 播放状态：0播放/1暂停/2停止
    playstatus: 2,
    songList: [],
    currentIndex: 0,
    showList: false,
    topic: '',
  },
  onLoad(query) {
    this.setData({
      flag: app.globalData.flag,
    })
    if (query.for == "listenHistory") {
      this.setData({
        topic: 'listenHistory',
        playlistSongs: app.globalData.listenHistory,
      })
    } else if (query.for == "mylove") {
      this.setData({
        topic: 'mylove',
        playlistSongs: app.globalData.myCollection,
      })
    } else if (query.for == "singer") {
      this.setData({
        topic: 'singer',
      })
      this.getSingerInfo()
      wx.setNavigationBarTitle({
        title: app.globalData.songList[app.globalData.currentIndex].ar[0].name,
      })
    } else {
      this.setData({
        topic: 'playlist',
        playlist: app.globalData.currentPlaylist
      })
      this.getPlaylistSongs()
    }
  },
  onShow() {
    this.setData({
      songinfo: app.globalData.songList[app.globalData.currentIndex] || {},
      // 播放状态：0播放/1暂停/2停止
      playstatus: app.globalData.playstatus,
      songList: app.globalData.songList,
      currentIndex: app.globalData.currentIndex,
      isLoad: app.globalData.isLoad
    })
  },
  getPlaylistSongs() {
    wx.showLoading({
      title: '加载中',
    })
    wx.request({
      url: 'https://api.imjad.cn/cloudmusic/?type=playlist&id=' + this.data.playlist.id,
      success: (res) => {
        if (res.data.playlist.tracks) {
          var playlistSongs = []
          res.data.playlist.tracks.forEach((item, index) => {
            var song = {}
            song.id = item.id
            song.name = item.name
            song.al = item.al
            song.alia = item.alia
            song.ar = item.ar
            song.dt = item.dt
            playlistSongs.push(song)
          })
          this.setData({
            playlistSongs
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
  },
  getSingerInfo() {
    wx.showLoading({
      title: '加载中',
    })
    wx.request({
      url: 'https://api.imjad.cn/cloudmusic/?type=artist&id=' + app.globalData.songList[app.globalData.currentIndex].ar[0].id,
      success: (res) => {
        if (res.data.artist && res.data.hotSongs) {
          // console.log(res.data)
          var singerinfo = {}
          singerinfo.name = res.data.artist.name
          singerinfo.picUrl = res.data.artist.picUrl

          var playlistSongs = []
          res.data.hotSongs.forEach((item, index) => {
            var song = {}
            song.id = item.id
            song.name = item.name
            song.al = item.al
            song.alia = item.alia
            song.ar = item.ar
            song.dt = item.dt
            playlistSongs.push(song)
          })

          this.setData({
            singerinfo,
            playlistSongs,
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
  },
  playSong(e) {
    if (this.data.flag) {
      const song = this.data.playlistSongs[e.currentTarget.dataset.index]
      app.playSong(song)
    }
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
  // 播放暂停
  playOrPause() {
    app.playOrPause()
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
  // 跳往播放器页面
  goPlayer() {
    if (app.globalData.songList.length == 0) {
      return
    }
    wx.navigateTo({
      url: '/pages/player/player'
    })
  },
  // 播放歌单所有歌曲
  playall() {
    // 加入播放列表的歌曲是否已被收藏
    app.globalData.myCollection.forEach((item, index) => {
      this.data.playlistSongs.forEach((item1, index1) => {
        if (item.id == item1.id) {
          this.data.playlistSongs[index1].love = true
          return
        }
      })
    })

    this.setData({
      songList: this.data.playlistSongs,
      currentIndex: 0,
      songinfo: this.data.playlistSongs[0],
    })
    app.globalData.songList = this.data.playlistSongs
    app.globalData.currentIndex = 0

    app.letsPlay()

    app.cacheLocalSongList()
  },
})