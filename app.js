const express = require('express');
const mysql = require('mysql2');
const Redis = require('ioredis');
const fs = require('fs');
const app = express();
const port = 3000;

// 日志写入文件
const logStream = fs.createWriteStream('/var/log/myapp.log', { flags: 'a' });
console.log = (...args) => {
    logStream.write(new Date().toISOString() + ' ' + args.join(' ') + '\n');
};
console.error = (...args) => {
    logStream.write(new Date().toISOString() + ' ERROR: ' + args.join(' ') + '\n');
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'appuser',
    password: 'AppPass123!',
    database: 'myapp'
});
db.connect(err => { if (err) throw err; console.log('MySQL connected'); });

const redis = new Redis({ password: 'Redis_2026@Admin!' });
redis.on('connect', () => console.log('Redis connected'));

// 静态首页
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

// API：获取所有文章
app.get('/api/posts', (req, res) => {
    db.query('SELECT * FROM posts ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// API：获取单篇文章
app.get('/api/posts/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM posts WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: '文章不存在' });
        res.json(results[0]);
    });
});

// API：发布文章
app.post('/api/posts', (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: '标题和内容不能为空' });
    db.query('INSERT INTO posts (title, content) VALUES (?, ?)', [title, content], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: result.insertId, message: '发布成功' });
    });
});

// API：删除文章
app.delete('/api/posts/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM posts WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: '文章不存在' });
        res.json({ success: true, message: '删除成功' });
    });
});

// API：访问计数
app.get('/api/count', async (req, res) => {
    try {
        const count = await redis.incr('page_views');
        res.json({ visits: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, '127.0.0.1', () => console.log(`Server running on port ${port}`));
