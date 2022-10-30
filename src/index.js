import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import GetArticles from './findCards';
import LoadMore from './load-more-btn';

const createArticle = new GetArticles();
const loadMoreBtn = new LoadMore('.btn-primary', true);

const refs = {
  searchForm: document.querySelector('#search-form'),
  galleryField: document.querySelector('.gallery'),
  loadMoreBtn: document.querySelector('.btn-primary'),
};

refs.searchForm.addEventListener('submit', onSearch);
refs.loadMoreBtn.addEventListener('click', onLoadMore);

let lightbox = new SimpleLightbox('.gallery a', {
  animationSpeed: 250,
});

async function onSearch(event) {
  event.preventDefault();
  refs.galleryField.innerHTML = '';

  createArticle.query = event.currentTarget.elements.searchQuery.value.trim();

  if (!createArticle.query) {
    loadMoreBtn.hide();
    loadMoreBtn.disable();
    refs.galleryField.innerHTML = '';
    Notify.failure('Sorry, search field is empty :(');
    return;
  }

  try {
    createArticle.resetPage();
    const newArticle = await createArticle.createArticle();
    const articleData = newArticle.data.hits;
    const totalArticles = newArticle.data.totalHits;
    const totalPages = Math.ceil(totalArticles / 40) + 1;

    if (!articleData.length) {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      loadMoreBtn.hide();
      loadMoreBtn.disable();
      refs.galleryField.innerHTML = '';
      return;
    }

    loadMoreBtn.show();
    loadMoreBtn.disable();

    Notify.success(`Hooray! We found ${totalArticles} images.`);

    let markup = markupCreator(articleData);
    refs.galleryField.insertAdjacentHTML('beforeend', markup);
    lightbox.refresh();

    // let infScroll = new InfiniteScroll(refs.galleryField, {
    //   // options
    //   path: '.pagination__next',
    //   append: '.post',
    //   history: false,
    // });

    loadMoreBtn.enable();
    totalPagesCheck(createArticle.page, totalPages);
  } catch (error) {
    console.log(error);
  }
}

async function onLoadMore() {
  loadMoreBtn.disable();
  try {
    const newArticle = await createArticle.createArticle();
    const articleData = newArticle.data.hits;
    const totalArticles = newArticle.data.totalHits;
    const totalPages = Math.ceil(totalArticles / 40) + 1;

    let markup = markupCreator(articleData);
    refs.galleryField.insertAdjacentHTML('beforeend', markup);
    lightbox.refresh();

    pageScroll();

    loadMoreBtn.enable();

    totalPagesCheck(createArticle.page, totalPages);
  } catch (error) {
    console.log(error);
  }
}

function pageScroll() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  console.log(cardHeight);
  console.log(document.querySelector('.gallery').firstElementChild);
  console.log(
    document.querySelector('.gallery').firstElementChild.getBoundingClientRect()
  );

  const options = {
    top: cardHeight * 3.6,
    behavior: 'smooth',
  };

  window.scrollBy(options);
}

function markupCreator(items) {
  return items
    .map(item => {
      return `
 <a href="${item.largeImageURL}" class="wrapper post">
  <img src="${item.webformatURL}" alt="${item.tags}" loading="lazy" />
  <div class="info">
    <p class="info-item"><b>Likes: ${item.likes}</b></p>
    <p class="info-item"><b>Views: ${item.views}</b></p>
    <p class="info-item"><b>Comments: ${item.comments}</b></p>
    <p class="info-item"><b>Downloads: ${item.downloads}</b></p>
  </div>
</a>
`;
    })
    .join('');
}

function totalPagesCheck(page, totalPages) {
  if (page === totalPages) {
    loadMoreBtn.hide();
    loadMoreBtn.disable();
    Notify.info(`We're sorry, but you've reached the end of search results.`);
    return;
  }
}
