// ==== "Карусель" карточек ====

// Функция для одной карусели
function initCarousel(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const cards = Array.from(container.querySelectorAll('.card'));
    const n = cards.length;
    let pos = 2;
    
    function render() {
        cards.forEach(card => card.className = 'card');
        cards[(pos + n - 2) % n].classList.add('far-left');
        cards[(pos + n - 1) % n].classList.add('left');
        cards[pos].classList.add('center');
        cards[(pos + 1) % n].classList.add('right');
        cards[(pos + 2) % n].classList.add('far-right');
    }
    
    container.querySelector('.arrow__left').onclick = () => {
        pos = (pos + 1) % n;
        render();
    };
    
    container.querySelector('.arrow__right').onclick = () => {
        pos = (pos + n - 1) % n;
        render();
    };
    
    render();
}

// Запустить для каждой "карусели"
initCarousel('.carousel-1');
initCarousel('.carousel-2');




// ==== Прайс-лист ====

// Получить элементы
const tableViewport = document.querySelector('.tv__table-viewport');
const tableScroll = tableViewport.querySelector('.tv__table-scroll');
const upBtn = tableViewport.querySelector('.tv__arrow__wrap--up');
const downBtn = tableViewport.querySelector('.tv__arrow__wrap--down');

// параметры карточки
const cardHeight = 313;
const cardMargin = 30;
const visibleHeight = 793;
const totalCardHeight = cardHeight + cardMargin;
const minBottomSpace = 25;

let curPos = 0; // текущая "строка" (верхняя видимая)
let totalCards = tableScroll.children.length;

// Считаем сколько карточек помещается в viewport
const visibleCards = Math.floor(visibleHeight / totalCardHeight);

// Обновить scroll
function updateScroll() {
  // ограничение: не уходить за край таблицы
  const allContentHeight = tableScroll.scrollHeight;
  const maxTop = Math.min(0, visibleHeight - allContentHeight - minBottomSpace);

  let top = -curPos * totalCardHeight;
  if (top < maxTop) top = maxTop;
  if (top > 0) top = 0;
  tableScroll.style.top = top + 'px';
}

// Обработчики стрелок
upBtn.addEventListener('click', () => {
  curPos--;
  if(curPos < 0) curPos = 0;
  updateScroll();
});
downBtn.addEventListener('click', () => {
  curPos++;
  updateScroll();
});

// Скролл колесиком мыши (только внутри viewport)
tableViewport.addEventListener('wheel', (e) => {
  if (e.deltaY > 0) {
    curPos++;
    updateScroll();
  } else if (e.deltaY < 0) {
    curPos--;
    if(curPos < 0) curPos = 0;
    updateScroll();
  }
  e.preventDefault();
}, { passive: false });

// Инициализация при загрузке
updateScroll();


const scrollTopBtn = document.getElementById('scrollTopBtn');
const zonesSection = document.getElementById('zones');

// Минимальное смещение до показа кнопки (например, за 100px до секции)
const showOffset = 400;

window.addEventListener('scroll', () => {
    // Получаем top координату блока #zones относительно страницы
    const zonesY = zonesSection.getBoundingClientRect().top + window.scrollY;
    // Проверяем, прокрутили ли выше/ниже с дополнительным порогом
    if (window.scrollY > (zonesY - showOffset)) {
        scrollTopBtn.style.display = 'flex';
    } else {
        scrollTopBtn.style.display = 'none';
    }
});

// Плавный возврат наверх при клике
scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }, 400);
});


