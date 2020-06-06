const IMG_URL = 'https://image.tmdb.org/t/p/w185_and_h278_bestv2';
const SERVER = 'https://api.themoviedb.org/3';
const API_KEY = 'c3991bfbbb2efbee7ac90c72b9afa233';

const leftMenu = document.querySelector('.left-menu');
const hamburger = document.querySelector('.hamburger');
const modal = document.querySelector('.modal');
const tvShowsList = document.querySelector('.tv-shows__list');
const tvShows = document.querySelector('.tv-shows');
const tvCardImg = document.querySelector('.tv-card__img');
const modalTitle = document.querySelector('.modal__title');
const genresList = document.querySelector('.genres-list');
const description = document.querySelector('.description');
const modalLink = document.querySelector('.modal__link');
const rating = document.querySelector('.rating');
const searchForm = document.querySelector('.search__form');
const searchFormInput = document.querySelector('.search__form-input');
const preloader = document.querySelector('.preloader');
const dropdown = document.querySelectorAll('dropdown');
const tvShowsHead = document.querySelector('.tv-shows__head');
const posterWrapper = document.querySelector('.poster__wrapper');
const modalContent = document.querySelector('.modal__content');
const pagination = document.querySelector('.pagination');

const loading = document.createElement('div');
loading.classList.add('loading');

const closeDropdown = () => {
    dropdown.forEach(item => {
        item.classList.remove('active');
    })
};

const changeImage = event => {
    const card = event.target.closest('.tv-shows__item');

    if (card) {
        const img = card.querySelector('.tv-card__img');
        const changeImg = img.dataset.backdrop;
        if (changeImg) {
            img.dataset.backdrop = img.src;
            img.src = changeImg;
        }
    }
};

const renderCard = (response, target) => {
    tvShowsList.textContent = '';



    if(!response.total_results){
        loading.remove();
        tvShowsHead.textContent = 'К сожалению по вашему запросу ничего не найдено...';
        return;
    }

    tvShowsHead.textContent = target ? target.textContent : 'Результат поиска';

    response.results.forEach(item => {

        const { 
            backdrop_path: backdrop, 
            name: title, 
            poster_path: poster, 
            vote_average: vote ,
            id
            } = item;

        const posterIMG = poster ? IMG_URL + poster : 'img/no-poster.jpg';
        const backdropIMG = backdrop ? IMG_URL + backdrop : ''; //knn
        const voteElem = vote ? `<span class="tv-card__vote">${vote}</span>` : '' ; //ohhk

        const card = document.createElement('li');
        card.idTv = id;
        card.classList.add('tv-shows__item');
        card.innerHTML = `
            <a href="#" id="${id}" class="tv-card">
                ${voteElem}
                <img class="tv-card__img"
                    src="${posterIMG}"
                    data-backdrop="${backdropIMG}"
                    alt="${title}">
                <h4 class="tv-card__head">${title}</h4>
            </a>
        `;

        loading.remove();
        tvShowsList.append(card);
    });

    pagination.textContent = '';
    
    if (!target && response.total_pages > 1) {
        for (let i = 1; i <= response.total_pages; i++) {
            if (i <= 10) {
                pagination.innerHTML += `<li><a href="#" class="pages">${i}</a></li>`
            } else {
                break;
            }
        }
    }
};

hamburger.addEventListener('click', () => {
    leftMenu.classList.toggle('openMenu');
    hamburger.classList.toggle('open');
    closeDropdown();
});

document.addEventListener('click', event => {
    if (!event.target.closest('.left-menu')) {
        leftMenu.classList.remove('openMenu');
        hamburger.classList.remove('open');
        closeDropdown();
    }
});

leftMenu.addEventListener('click', event => {
    event.preventDefault();
    const target = event.target;
    const dropdown = target.closest('.dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
        leftMenu.classList.add('openMenu');
        hamburger.classList.add('open');
    }

    if (target.closest('#top-rated')) {
        tvShows.append(loading);
        new DBService().getTopRated().then((response) => renderCard(response, target));
    }

    if (target.closest('#popular')) {
        tvShows.append(loading);
        new DBService().getPopular().then((response) => renderCard(response, target));
    }

    if (target.closest('#today')) {
        tvShows.append(loading);
        new DBService().getNewToday().then((response) => renderCard(response, target));
    }

    if (target.closest('#week')) {
        tvShows.append(loading);
        new DBService().getNewWeek().then((response) => renderCard(response, target));
    }

    if (target.closest('#search')) {
        tvShowsList.textContent = '';
        tvShowsHead.textContent = 'Введите название сериала или выберите пункт меню';
    }

});

tvShowsList.addEventListener('click', event => {
    event.preventDefault();
    const target = event.target;
    const card = target.closest('.tv-card');
    
    if (card) { 

        preloader.style.display = 'block';

        dbService.getTvShow(card.id)
            .then(data => {

                if (data.poster_path) {
                    tvCardImg.src = IMG_URL + data.poster_path;
                    tvCardImg.alt = data.name;
                    posterWrapper.style.display = '';
                    modalContent.style.paddingLeft = '';
                } else {
                    posterWrapper.style.display = 'none';
                    modalContent.style.paddingLeft = '25px';
                }
                
                modalTitle.textContent = data.name;
                //genresList.innerHTML = data.genres.reduce((acc, item) => {
                //    return `${acc}<li>${item.name}</li>`
                //}, '');
                genresList.textContent = '';
                for (const item of data.genres) {
                    genresList.innerHTML += `<li>${item.name}</li>`
                }
                rating.textContent = data.vote_average;
                description.textContent = data.overview;
                modalLink.href = data.homepage;
            })
            .then(() => {
                modal.classList.remove('hide');
                document.body.style.overflow = 'hidden';
            })
            .finally(() => {
                preloader.style.display = '';
            })
        
    }
});

modal.addEventListener('click', event => {

    if (event.target.closest('.cross') || 
        event.target.classList.contains('modal')) {

        modal.classList.add('hide');
        document.body.style.overflow = '';

    }
});

searchForm.addEventListener('submit', event => {
    event.preventDefault();
    const value = searchFormInput.value.trim();
    if (value) {
        tvShows.append(loading);
        dbService.getSearchResult(value).then(renderCard);
    }
    searchFormInput.value = '';
});

pagination.addEventListener('click', event => {
    event.preventDefault();
    if (event.target.classList.contains('pages')) {
        tvShows.append(loading);
        dbService.getNextPages(event.target.textContent).then(renderCard);
    }
});

tvShowsList.addEventListener('mouseover', changeImage);
tvShowsList.addEventListener('mouseout', changeImage);

const DBService = class {
    getData = async (url) => {
        const res = await fetch(url);
        if (res.ok) {
            return res.json();
        } else {
            throw new Error(`Не удалось получить данные
                по адресу ${url}`);
        }
    } 

    getTestData = async () => {
        return await this.getData('test.json');
    }

    getTestCard = () => {
        return this.getData('card.json');
    }

    getSearchResult = query => {
        this.temp = `${SERVER}/search/tv?api_key=${API_KEY}&query=${query}&language=ru-RU`;
        return this.getData(this.temp);
    }

    getNextPages = page => {
        return this.getData(this.temp + '&page=' + page);
    }

    getTvShow = id => {
        return this.getData(`${SERVER}/tv/${id}?api_key=${API_KEY}&language=ru-RU`);
    }

    getTopRated = () => this.getData(`${SERVER}/tv/top_rated?api_key=${API_KEY}&language=ru-RU`);

    getPopular = () => this.getData(`${SERVER}/tv/popular?api_key=${API_KEY}&language=ru-RU`);

    getNewToday = () => this.getData(`${SERVER}/tv/airing_today?api_key=${API_KEY}&language=ru-RU`);

    getNewWeek = () => this.getData(`${SERVER}/tv/on_the_air?api_key=${API_KEY}&language=ru-RU`);
}

const dbService = new DBService();