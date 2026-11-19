'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const configPath = path.join(__dirname, 'config.js');
const config = require(configPath);
const pool = mysql.createPool({
  ...config.database,
  charset: 'utf8mb4',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 5,
});

const movieSelect = `SELECT m.id, m.title, m.description, m.duration_minutes, m.release_year, m.age_rating,
    COALESCE(mg_list.genres, '') AS genres
  FROM movies AS m
  LEFT JOIN (
    SELECT mg.movie_id, GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') AS genres
    FROM movie_genres AS mg JOIN genres AS g ON g.id = mg.genre_id
    GROUP BY mg.movie_id
  ) AS mg_list ON mg_list.movie_id = m.id`;

const queries = {
  movies: `${movieSelect} ORDER BY m.title, m.id`,
  genres: 'SELECT id, name, description FROM genres ORDER BY name, id',
  sessions: `SELECT s.id, m.title AS movie_title, h.name AS hall_name, s.starts_at, s.ticket_price,
      h.rows_count * h.seats_per_row AS capacity, COALESCE(t.sold_count, 0) AS sold_count
    FROM sessions AS s JOIN movies AS m ON m.id = s.movie_id JOIN halls AS h ON h.id = s.hall_id
    LEFT JOIN (SELECT session_id, COUNT(*) AS sold_count FROM tickets GROUP BY session_id) AS t ON t.session_id = s.id
    ORDER BY s.starts_at, s.id`,
  halls: 'SELECT id, name, rows_count, seats_per_row, rows_count * seats_per_row AS capacity FROM halls ORDER BY name, id',
  sales: `SELECT t.id, m.title AS movie_title, h.name AS hall_name, s.starts_at,
      t.\`row_number\`, t.seat_number, t.price, t.sold_at
    FROM tickets AS t JOIN sessions AS s ON s.id = t.session_id
    JOIN movies AS m ON m.id = s.movie_id JOIN halls AS h ON h.id = s.hall_id
    ORDER BY t.sold_at DESC, t.id DESC`,
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(data));
}

async function handleApi(request, response, url) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendJson(response, 405, { error: 'Доступен только метод GET.' });
  }
  const resource = url.searchParams.get('resource');
  if (!Object.hasOwn(queries, resource) && resource !== 'report') {
    return sendJson(response, 400, { error: 'Неизвестный раздел данных.' });
  }

  let genreId;
  if (resource === 'report') {
    const value = url.searchParams.get('genre_id') || '';
    genreId = Number(value);
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(genreId) || genreId > 4294967295) {
      return sendJson(response, 400, { error: 'Выберите жанр для отчёта.' });
    }
  }

  try {
    if (resource === 'report') {
      const [genres] = await pool.execute('SELECT id, name, description FROM genres WHERE id = ?', [genreId]);
      if (!genres.length) return sendJson(response, 404, { error: 'Выбранный жанр не найден.' });
      const [data] = await pool.execute(`${movieSelect}
        WHERE EXISTS (SELECT 1 FROM movie_genres AS selected_genre WHERE selected_genre.movie_id = m.id AND selected_genre.genre_id = ?)
        ORDER BY m.title, m.id`, [genreId]);
      return sendJson(response, 200, { genre: genres[0], data });
    }
    const [data] = await pool.query(queries[resource]);
    return sendJson(response, 200, { data });
  } catch (error) {
    console.error('Ошибка MySQL:', error.code || error.message);
    return sendJson(response, 500, { error: 'Не удалось получить данные. Проверьте подключение к MySQL и настройки базы данных.' });
  }
}

const staticFiles = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/assets/style.css': ['assets/style.css', 'text/css; charset=utf-8'],
  '/assets/app.js': ['assets/app.js', 'text/javascript; charset=utf-8'],
};

http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname === '/api') {
    handleApi(request, response, url);
    return;
  }
  const file = staticFiles[url.pathname];
  if (!file || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Страница не найдена.');
    return;
  }
  fs.readFile(path.join(__dirname, file[0]), (error, contents) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Не удалось открыть файл.');
      return;
    }
    response.writeHead(200, { 'Content-Type': file[1], 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : contents);
  });
}).listen(config.serverPort, '127.0.0.1', () => {
  console.log(`Сайт запущен: http://localhost:${config.serverPort}`);
});
