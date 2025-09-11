document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');

    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light');
        toggleButton.textContent = 'Темная тема';
    } else {
        toggleButton.textContent = 'Светлая тема';
    }

    toggleButton.addEventListener('click', () => {
        body.classList.toggle('light');
        if (body.classList.contains('light')) {
            localStorage.setItem('theme', 'light');
            toggleButton.textContent = 'Темная тема';
        } else {
            localStorage.setItem('theme', 'dark');
            toggleButton.textContent = 'Светлая тема';
        }
    });
});
