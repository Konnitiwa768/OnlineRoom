const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const threads = {};  // { threadId: [{msg, timestamp}] }

io.on('connection', (socket) => {
  console.log('ユーザー接続:', socket.id);

  // 新しいスレッド作成
  socket.on('createThread', (threadName, callback) => {
    if (!threadName) return callback({ error: 'スレッド名は必須です' });

    const threadId = `thread_${Date.now()}`;
    threads[threadId] = [];
    console.log(`スレッド作成: ${threadName} (${threadId})`);

    io.emit('threadList', getThreadList());
    callback({ threadId });
  });

  // スレッド一覧要求
  socket.on('getThreads', () => {
    socket.emit('threadList', getThreadList());
  });

  // 投稿送信
  socket.on('postMessage', ({ threadId, msg }) => {
    if (!threads[threadId]) return;
    const timestamp = new Date().toLocaleTimeString();
    const post = { msg, timestamp };
    threads[threadId].push(post);
    io.emit('newPost', { threadId, post });
  });

  socket.on('disconnect', () => {
    console.log('ユーザー切断:', socket.id);
  });
});

function getThreadList() {
  return Object.entries(threads).map(([id, posts]) => ({
    id,
    name: id, // ここは本来スレッド名も持つとよいが簡略化のためIDのみ
    count: posts.length,
  }));
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`サーバー起動 http://localhost:${PORT}`);
});
