import { askAssistant } from './assistant.mjs';
const el = id => document.getElementById(id);
const form = el('askForm');
let busy = false;

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content) node.textContent = content;
  return node;
}

async function ask(query) {
  if (busy || !query.trim()) return;
  busy = true;
  el('question').value = query;
  el('submit').disabled = true;
  el('response').setAttribute('aria-busy', 'true');
  el('response').replaceChildren(element('p', 'thinking', 'Finding your next stop…'));
  try {
    const context = window.campusAssistantContext || {};
    el('connection').textContent = context.pins ? 'Campus data connected · map actions available' : 'Standalone preview · map not connected';
    const answer = await askAssistant(query, context);
    const response = el('response');
    response.replaceChildren(element('div', 'answer-label', '✳ CAMPUS PULSE'), element('p', 'answer', answer.text));
    const cards = element('div', 'result-grid');
    answer.results.forEach(pin => {
      const card = element('article', 'result-card');
      card.append(element('span', 'pin-kind', `${pin.kind} · ${pin.dataStatus === 'verified' ? 'Verified' : 'Demo data'}`), element('h3', '', pin.name), element('p', '', pin.details));
      cards.append(card);
    });
    response.append(cards);
    if (answer.actions.length) {
      el('mapPlace').textContent = answer.results[0]?.name || answer.destination?.buildingId || 'Destination selected';
      document.querySelector('.map-preview').classList.add('selected');
      // Host listens on window; no cross-origin messages or implicit map mutations.
      window.dispatchEvent(new CustomEvent('campus-pulse:assistant-actions', { detail: answer }));
    }
  } catch {
    el('response').replaceChildren(element('p', 'answer', 'The assistant is temporarily unavailable. Please try again.'));
  } finally {
    busy = false;
    el('submit').disabled = false;
    el('response').setAttribute('aria-busy', 'false');
  }
}
form.addEventListener('submit', event => { event.preventDefault(); ask(el('question').value); });
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => ask(button.dataset.query)));
