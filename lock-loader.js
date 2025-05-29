
// lock-loader.js
fetch('/lock.json')
  .then(res => res.json())
  .then(data => {
    const box = document.querySelector('.lock-box');
    if (data && data.player && data.status === 'healthy') {
      box.innerHTML = `
        🔒 <strong>Lock of the Day:</strong> ${data.player} ${data.prop} —
        ${Math.round(data.cover_prob * 100)}% cover,
        +${Math.round(data.ev * 100)}% EV,
        <em>Best line: ${data.line} (${data.book})</em>
      `;
    } else {
      box.innerHTML = "🔒 No qualified Lock of the Day available. Check back tomorrow at 6 AM EST.";
    }
  })
  .catch(err => {
    document.querySelector('.lock-box').innerHTML = "🔒 Unable to load Lock of the Day.";
  });
