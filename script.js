// Подключение к Supabase
const SUPABASE_URL = 'https://ndudwunthfxygkhdidlz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iAuPtvSyY8OHyGFWR8WJGA_Pjc3buqc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const authBox = document.getElementById('auth-box');
  const forumBox = document.getElementById('forum-box');
  const userNav = document.getElementById('user-nav');
  const postInput = document.getElementById('post-input');
  const publishBtn = document.getElementById('publish-btn');
  const postsFeed = document.getElementById('posts-feed');

  // Проверка сессии
  let currentUser = JSON.parse(localStorage.getItem('astoria_user'));
  if (currentUser) {
    showMainPage();
  }

  // Регистрация / Вход
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const nickname = document.getElementById('nickname').value.trim();

    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!usernameRegex.test(username)) {
      alert('Юзернейм должен быть от 4 до 20 символов (латиница, цифры, _)');
      return;
    }

    currentUser = { username, nickname };
    localStorage.setItem('astoria_user', JSON.stringify(currentUser));
    showMainPage();
  });

  // Выход
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('astoria_user');
    location.reload();
  });

  // Переключение экранов и загрузка постов
  function showMainPage() {
    authBox.classList.add('hidden');
    forumBox.classList.remove('hidden');
    userNav.classList.remove('hidden');

    document.getElementById('nav-nickname').textContent = currentUser.nickname;
    document.getElementById('nav-username').textContent = `@${currentUser.username}`;

    loadPosts();
  }

  // Публикация поста
  publishBtn.addEventListener('click', async () => {
    const text = postInput.value.trim();
    if (!text) return;

    publishBtn.disabled = true;
    
    // Сохранение в Supabase
    const { error } = await supabase.from('posts').insert([
      {
        username: currentUser.username,
        nickname: currentUser.nickname,
        content: text
      }
    ]);

    publishBtn.disabled = false;

    if (error) {
      alert('Ошибка при публикации поста');
      console.error(error);
    } else {
      postInput.value = '';
      loadPosts(); // Обновить ленту
    }
  });

  // Загрузка постов из базы данных
  async function loadPosts() {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      postsFeed.innerHTML = '<p class="muted text-center">Ошибка загрузки постов</p>';
      return;
    }

    if (posts.length === 0) {
      postsFeed.innerHTML = '<p class="muted text-center">Пока нет постов. Будьте первым!</p>';
      return;
    }

    postsFeed.innerHTML = posts.map(post => `
      <div class="post">
        <div class="post-header">
          <span class="post-author">${escapeHtml(post.nickname)}</span>
          <span class="muted">@${escapeHtml(post.username)}</span>
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
      </div>
    `).join('');
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, "");
  }
});
