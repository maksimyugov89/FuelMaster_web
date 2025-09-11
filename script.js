document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');

    // Проверка сохраненной темы
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark');
        toggleButton.textContent = 'Светлая тема';
    } else {
        toggleButton.textContent = 'Темная тема';
    }

    toggleButton.addEventListener('click', () => {
        body.classList.toggle('dark');
        if (body.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
            toggleButton.textContent = 'Светлая тема';
        } else {
            localStorage.setItem('theme', 'light');
            toggleButton.textContent = 'Темная тема';
        }
    });
});
