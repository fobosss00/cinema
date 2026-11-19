"use strict";

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const safe = (value, fallback = "—") => escapeHtml(value == null || value === "" ? fallback : value);
const integer = (value) => value != null && value !== "" && Number.isFinite(Number(value)) ? new Intl.NumberFormat("ru-RU").format(Number(value)) : "—";
const money = (value) => value != null && value !== "" && Number.isFinite(Number(value)) ? `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(value))} ₽` : "—";
const dateTime = (value) => {
  if (!value) return "—";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return match ? `${match[3]}.${match[2]}.${match[1]} · ${match[4]}:${match[5]}` : escapeHtml(value);
};

async function getResource(resource, params = {}) {
  const query = new URLSearchParams({ resource, ...params });
  let response;
  try { response = await fetch(`/api?${query}`); } catch { throw new Error("Проверьте запуск веб-сервера и подключение к нему."); }
  let result;
  try { result = await response.json(); } catch { throw new Error("Сервер вернул некорректный ответ."); }
  if (!response.ok || result.error) throw new Error(result.error || "Не удалось получить данные.");
  if (!Array.isArray(result.data)) throw new Error("Сервер вернул данные в неожиданном формате.");
  return result;
}

function emptyRow(columns, message) {
  return `<tr><td colspan="${columns}" class="empty">${escapeHtml(message)}</td></tr>`;
}

function renderMovies(movies) {
  $("#movie-count").textContent = integer(movies.length);
  $("#movie-total").textContent = `Всего: ${integer(movies.length)}`;
  $("#movie-list").innerHTML = movies.length ? movies.map((movie, index) => `
    <article class="movie-card">
      <div class="movie-number"><span>ФИЛЬМ / ${String(index + 1).padStart(2, "0")}</span><span aria-hidden="true">✳</span></div>
      <div class="movie-body"><div class="movie-topline"><span>${safe(movie.release_year)}</span><span>${safe(movie.age_rating)}</span></div>
      <h3>${safe(movie.title)}</h3><p class="movie-description">${safe(movie.description, "Описание не указано.")}</p>
      <div class="movie-footer"><span>${safe(movie.genres, "Жанр не указан")}</span><span>${integer(movie.duration_minutes)} мин.</span></div></div>
    </article>`).join("") : '<p class="empty empty-block">В каталоге пока нет фильмов.</p>';
}

function renderGenres(genres) {
  $("#genre-count").textContent = integer(genres.length);
  $("#genre-select").innerHTML = '<option value="">Выберите жанр</option>' + genres.map((genre) => `<option value="${safe(genre.id)}">${safe(genre.name)}</option>`).join("");
}

function renderSessions(sessions) {
  $("#session-list").innerHTML = sessions.length ? sessions.map((session) => `<tr>
    <td>${dateTime(session.starts_at)}</td><td class="table-title">${safe(session.movie_title)}</td><td>${safe(session.hall_name)}</td><td>${money(session.ticket_price)}</td><td>${integer(session.sold_count)} / ${integer(session.capacity)}</td>
  </tr>`).join("") : emptyRow(5, "Сеансы пока не добавлены.");
}

function renderHalls(halls) {
  $("#hall-count").textContent = integer(halls.length);
  $("#hall-list").innerHTML = halls.length ? halls.map((hall, index) => `<article class="hall-card"><span class="hall-index">ЗАЛ / ${String(index + 1).padStart(2, "0")}</span><h3>${safe(hall.name)}</h3><div class="hall-details"><span><b>${integer(hall.capacity)}</b> мест</span><span>${integer(hall.rows_count)} рядов · ${integer(hall.seats_per_row)} мест в ряду</span></div></article>`).join("") : '<p class="empty empty-block">Залы пока не добавлены.</p>';
}

function renderSales(sales) {
  $("#sales-list").innerHTML = sales.length ? sales.map((sale) => `<tr><td>${dateTime(sale.sold_at)}</td><td><span class="table-title">${safe(sale.movie_title)}</span><small class="table-subtitle">${dateTime(sale.starts_at)}</small></td><td>${safe(sale.hall_name)}</td><td>Ряд ${integer(sale.row_number)}, место ${integer(sale.seat_number)}</td><td>${money(sale.price)}</td></tr>`).join("") : emptyRow(5, "Продаж билетов пока нет.");
}

$("#report-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const genreId = $("#genre-select").value;
  if (!genreId) return;
  const result = $("#report-result");
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  result.innerHTML = '<p class="empty">Формируем отчёт…</p>';
  try {
    const report = await getResource("report", { genre_id: genreId });
    const genre = report.genre || {};
    result.innerHTML = `<div class="result-heading"><div><span class="section-label">РЕЗУЛЬТАТ ОТЧЁТА</span><h3>${safe(genre.name, "Выбранный жанр")}</h3>${genre.description ? `<p>${safe(genre.description)}</p>` : ""}</div><span>Фильмов: <b>${integer(report.data.length)}</b></span></div>` + (report.data.length ? `<div class="table-wrap report-table"><table><thead><tr><th>Название</th><th>Год</th><th>Длительность</th><th>Жанры</th></tr></thead><tbody>${report.data.map((movie) => `<tr><td class="table-title">${safe(movie.title)}</td><td>${safe(movie.release_year)}</td><td>${integer(movie.duration_minutes)} мин.</td><td>${safe(movie.genres)}</td></tr>`).join("")}</tbody></table></div>` : '<p class="empty">Фильмов этого жанра пока нет.</p>');
  } catch (error) {
    result.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  } finally { button.disabled = false; }
});

async function load() {
  const resources = [
    ["movies", renderMovies, "#movie-list"], ["genres", renderGenres, "#genre-select"],
    ["sessions", renderSessions, "#session-list"], ["halls", renderHalls, "#hall-list"], ["sales", renderSales, "#sales-list"]
  ];
  const outcomes = await Promise.allSettled(resources.map(async ([name, render]) => render((await getResource(name)).data)));
  const failures = outcomes.map((outcome, index) => outcome.status === "rejected" ? { name: resources[index][0], error: outcome.reason } : null).filter(Boolean);
  if (failures.length) {
    const message = failures[0].error?.message || "Проверьте подключение к серверу и базе данных.";
    $("#error").textContent = `Не удалось загрузить часть данных. ${message}`;
    $("#error").hidden = false;
    for (const failure of failures) {
      const target = $(resources.find(([name]) => name === failure.name)[2]);
      if (failure.name === "genres") target.innerHTML = '<option value="">Не удалось загрузить жанры</option>';
      else if (failure.name === "sessions" || failure.name === "sales") target.innerHTML = emptyRow(5, "Не удалось загрузить данные.");
      else target.innerHTML = '<p class="empty empty-block">Не удалось загрузить данные.</p>';
    }
  }
}

load();
