document.addEventListener('DOMContentLoaded', function() {
  const questions = document.querySelectorAll('.faq-question');

  questions.forEach(q => {
    q.addEventListener('click', function() {
      const answer = this.nextElementSibling;
      // Скрыть все ответы
      document.querySelectorAll('.faq-answer').forEach(a => {
        if (a !== answer) a.classList.remove('show');
      });
      // Переключить текущий
      answer.classList.toggle('show');
    });
  });
}); 