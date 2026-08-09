// Настройки подключения к Supabase
const SUPABASE_URL = 'https://ndudwunthfxygkhdidlz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iAuPtvSyY8OHyGFWR8WJGA_Pjc3buqc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.endsWith('auth.html')) {
    initAuthPage();
  } else {
    initMainPage();
  }
});

// --- СТРАНИЦА АВТОРИЗАЦИИ / РЕГИСТРАЦИИ ---
function initAuthPage() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');

  // Переключение вкладок
  tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  });

  tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  // Логика Входа
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      errorEl.textContent = 'Ошибка входа: ' + error.message;
    } else {
      window.location.href = 'index.html';
    }
  });

  // Логика Регистрации
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawUsername = document.getElementById('reg-username').value.trim().toLowerCase();
    const displayName = document.getElementById('reg-displayname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('register-error');
    errorEl.textContent = '';

    // Валидация Юзернейма (от 4 до 20 символов)
    if (rawUsername.length < 4 || rawUsername.length > 20) {
      errorEl.textContent = 'Юзернейм должен быть от 4 до 20 символов.';
      return;
    }

    // 1. Проверка уникальности username в базе данных
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', rawUsername)
      .maybeSingle();

    if (existingUser) {
      errorEl.textContent = `Юзернейм @${rawUsername} уже занят! Выберите другой.`;
      return;
    }

    // 2. Регистрация аккаунта
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      errorEl.textContent = 'Ошибка регистрации: ' + signUpError.message;
      return;
    }

    // 3. Сохранение данных профиля в таблицу 'profiles'
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            username: rawUsername,
            display_name: displayName,
          }
        ]);

      if (profileError) {
        errorEl.textContent = 'Ошибка сохранения профиля: ' + profileError.message;
        return;
      }

      // Переход на главную страницу после регистрации
      window.location.href = 'index.html';
    }
  });
}

// --- ГЛАВНАЯ СТРАНИЦА ---
async function initMainPage() {
  const userPanel = document.getElementById('user-panel');
  const createPostBox = document.getElementById('create-post-box');

  // Проверка текущей сессии
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Пользователь авторизован — получаем его данные профиля
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', session.user.id)
      .single();

    const username = profile?.username ? `@${profile.username}` : '';
    const displayName = profile?.display_name || 'Пользователь';

    userPanel.innerHTML = `
      <span class="user-info"><strong>${displayName}</strong> <small>${username}</small></span>
      <button id="logout-btn" class="btn btn-secondary">Выйти</button>
    `;

    document.getElementById('logout-btn').addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.reload();
    });

    if (createPostBox) createPostBox.style.display = 'block';

    // Слушатель для кнопки публикаций
    const publishBtn = document.getElementById('publish-btn');
    if (publishBtn) {
      publishBtn.addEventListener('click', () => createPost(session.user.id));
    }

  } else {
    // Гость
    userPanel.innerHTML = `
      <a href="auth.html" class="btn">Войти / Регистрация</a>
    `;
  }

  // Загружаем ленту постов
  loadPosts();
}

// Загрузка постов
async function loadPosts() {
  const postsContainer = document.getElementById('posts-container');

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      created_at,
      profiles ( username, display_name )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    postsContainer.innerHTML = '<p class="status-msg">Ошибка при загрузке ленты.</p>';
    return;
  }

  if (!posts || posts.length === 0) {
    postsContainer.innerHTML = '<p class="status-msg">Пока нет постов. Напишите первый!</p>';
    return;
  }

  postsContainer.innerHTML = '';
  posts.forEach(post => {
    const author = post.profiles;
    const displayName = author?.display_name || 'Аноним';
    const username = author?.username ? `@${author.username}` : '';
    const date = new Date(post.created_at).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
      <div class="post-header">
        <span class="author-name">${displayName}</span>
        <span class="author-username">${username}</span>
        <span class="post-date">• ${date}</span>
      </div>
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <p class="post-body">${escapeHtml(post.content)}</p>
    `;
    postsContainer.appendChild(card);
  });
}

// Создание поста
async function createPost(userId) {
  const titleInput = document.getElementById('post-title');
  const contentInput = document.getElementById('post-content');

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    alert('Заполните заголовок и текст сообщения!');
    return;
  }

  const { error } = await supabase
    .from('posts')
    .insert([{ user_id: userId, title, content }]);

  if (error) {
    alert('Ошибка при публикации: ' + error.message);
  } else {
    titleInput.value = '';
    contentInput.value = '';
    loadPosts(); // Обновляем ленту
  }
}

// Защита от XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
