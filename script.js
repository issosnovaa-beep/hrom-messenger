document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const authBox = document.getElementById('auth-box');
  const profileBox = document.getElementById('profile-box');

  // Проверка сохраненной сессии при загрузке
  const currentUser = JSON.parse(localStorage.getItem('chrom_current_user'));
  if (currentUser) {
    showProfile(currentUser);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value.trim();
    const nickname = document.getElementById('nickname').value.trim();

    // Получаем текущий счетчик ID (по умолчанию 1)
    let lastId = parseInt(localStorage.getItem('chrom_last_id')) || 0;
    const newId = lastId + 1;

    const user = {
      id: newId,
      email: email,
      password: password,
      username: username,
      nickname: nickname
    };

    // Сохраняем пользователя и обновляем ID
    localStorage.setItem('chrom_last_id', newId);
    localStorage.setItem('chrom_current_user', JSON.stringify(user));

    showProfile(user);
    form.reset();
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('chrom_current_user');
    profileBox.classList.add('hidden');
    authBox.classList.remove('hidden');
  });

  function showProfile(user) {
    document.getElementById('user-id').textContent = user.id;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-username').textContent = user.username;
    document.getElementById('user-nickname').textContent = user.nickname;

    authBox.classList.add('hidden');
    profileBox.classList.remove('hidden');
  }
});
