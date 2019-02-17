const form = document.querySelector('.url-form');
const result = document.querySelector('.result-section');
form.addEventListener('submit', e => {
  e.preventDefault();

  const input = document.querySelector('.url-input');
  fetch('/new', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: input.value
    })
  })
  .then(res => {
    if (!res.ok) {
      throw Error(res.statusText);
    }
    return res.json();
  })
  .then(data => {
    while (result.hasChildNodes()) {
      result.removeChild(result.lastChild);
    }

    result.insertAdjacentHTML('afterbegin', `
      <div class="result red white-text">
        <a target="_blank" class="short-url" rel="noopener" href="/${data.short_id}">
          ${location.origin}/${data.short_id}
        </a>
      </div>
    `);
  })
  .catch(console.error)
});
