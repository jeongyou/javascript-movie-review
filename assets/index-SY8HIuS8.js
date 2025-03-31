var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
class TmdbApi {
  constructor(apiKey, baseUrl) {
    __publicField(this, "apiKey");
    __publicField(this, "baseUrl");
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  async fetchData(endpoint, params) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append("api_key", this.apiKey);
    url.searchParams.append("language", "ko-KR");
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP 오류! 상태: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error("API 호출 오류:", error);
      throw error;
    }
  }
  async popularMovies(page = 1) {
    const endpoint = "/movie/popular";
    const params = {
      page: page.toString()
    };
    return this.fetchData(endpoint, params);
  }
  async searchMovies(query, page = 1) {
    const endpoint = "/search/movie";
    const params = {
      query,
      page: page.toString()
    };
    return this.fetchData(endpoint, params);
  }
  async getMovieDetail(movieId) {
    const endpoint = `/movie/${movieId}`;
    return this.fetchData(endpoint, {});
  }
}
class Movie {
  constructor(movieData) {
    __publicField(this, "id");
    __publicField(this, "title");
    __publicField(this, "posterPath");
    __publicField(this, "voteAverage");
    __publicField(this, "overview");
    this.id = movieData.id;
    this.title = movieData.title;
    this.posterPath = movieData.posterPath;
    this.voteAverage = movieData.voteAverage;
    this.overview = movieData.overview;
  }
  getPosterUrl() {
    if (this.posterPath === "") {
      return "./images/nullImage.png";
    }
    return `https://image.tmdb.org/t/p/w500/${this.posterPath}`;
  }
  getVoteAverage() {
    return this.voteAverage.toFixed(1);
  }
  render() {
    const movieElement = document.createElement("div");
    movieElement.classList.add("movie-item");
    movieElement.innerHTML = `
      <img src="${this.getPosterUrl()}" alt="${this.title}">
      <h3>${this.title}</h3>
      <p>평점: ${this.getVoteAverage()}</p>
    `;
    return movieElement;
  }
}
class MovieService {
  constructor(apiKey, baseUrl) {
    __publicField(this, "api");
    this.api = new TmdbApi(apiKey, baseUrl);
  }
  async getPopularResults(page = 1) {
    try {
      const response = await this.api.popularMovies(page);
      return {
        movies: response.results.map(
          (movie) => new Movie({
            id: movie.id,
            title: movie.title,
            posterPath: movie.poster_path || "",
            voteAverage: movie.vote_average,
            overview: movie.overview
          })
        ),
        page: response.page,
        totalPages: response.total_pages
      };
    } catch (error) {
      console.error("영화 목록 가져오기 실패:", error);
      alert("영화 목록 가져오기 실패");
      throw error;
    }
  }
  async searchMovies(query, page = 1) {
    try {
      const validQuery = query ?? "";
      const response = await this.api.searchMovies(validQuery, page);
      return {
        movies: response.results.map(
          (movie) => new Movie({
            id: movie.id,
            title: movie.title,
            posterPath: movie.poster_path || "",
            voteAverage: movie.vote_average,
            overview: movie.overview
          })
        ),
        page: response.page,
        totalPages: response.total_pages
      };
    } catch (error) {
      console.error("영화 검색 실패", error);
      alert("영화 검색 실패");
      throw error;
    }
  }
  async getMovieDetail(movieId) {
    try {
      const response = await this.api.getMovieDetail(movieId);
      return { genres: response.genres, releaseDate: response.release_date };
    } catch (error) {
      console.error("영화 장르 가져오기 실패", error);
      alert("영화 장르 가져오기 실패");
      throw error;
    }
  }
}
class Store {
  constructor() {
    __publicField(this, "state");
    this.state = {
      currentMode: "popularAdd",
      query: null
    };
  }
  setMode(newMode) {
    this.state.currentMode = newMode;
  }
  getMode() {
    return this.state.currentMode;
  }
  setQuery(query) {
    this.state.query = query;
  }
  getQuery() {
    return this.state.query;
  }
}
const store = new Store();
class SearchHandler {
  constructor(movieListHandler2) {
    this.movieListHandler = movieListHandler2;
  }
  async handleSearch(query) {
    this.hideHeader();
    await this.movieListHandler.initMovieList(query);
  }
  hideHeader() {
    var _a, _b, _c;
    (_a = document.querySelector(".overlay")) == null ? void 0 : _a.classList.add("hide");
    (_b = document.querySelector(".top-rated-movie")) == null ? void 0 : _b.classList.add("hide");
    (_c = document.querySelector(".background-container")) == null ? void 0 : _c.classList.add("hide-background");
  }
}
class SearchBar {
  constructor(searchHandler2) {
    this.searchHandler = searchHandler2;
  }
  createSearchBar() {
    const searchBarContainer = document.createElement("div");
    searchBarContainer.classList.add("search-bar-container");
    const input = document.createElement("input");
    input.classList.add("search-bar-input");
    input.placeholder = "검색어를 입력하세요...";
    input.addEventListener("keydown", async (e) => this.handleInputKeydown(e, input));
    const searchButton = document.createElement("button");
    searchButton.classList.add("search-bar-button");
    searchButton.addEventListener("click", async () => this.handleSearchButtonClick(input));
    const buttonImage = document.createElement("img");
    buttonImage.src = "images/find.png";
    buttonImage.alt = "검색";
    buttonImage.classList.add("search-icon");
    searchButton.appendChild(buttonImage);
    searchBarContainer.appendChild(input);
    searchBarContainer.appendChild(searchButton);
    const searchHeader = document.querySelector(".search-header");
    if (searchHeader) {
      searchHeader.appendChild(searchBarContainer);
    }
  }
  async handleInputKeydown(e, input) {
    if (e.key === "Enter") {
      await this.searchHandler.handleSearch(input.value);
      store.setMode("searchAdd");
      store.setQuery(input.value);
    }
  }
  async handleSearchButtonClick(input) {
    await this.searchHandler.handleSearch(input.value);
    store.setMode("searchAdd");
    store.setQuery(input.value);
  }
}
function setRating(movieId, score) {
  const ratings = JSON.parse(localStorage.getItem("ratings") || "{}");
  ratings[movieId] = score;
  localStorage.setItem("ratings", JSON.stringify(ratings));
}
function getRating(movieId) {
  const ratings = JSON.parse(localStorage.getItem("ratings") || "{}");
  return ratings[movieId] || 0;
}
class StarRating {
  constructor(movieId, onSelect) {
    this.movieId = movieId;
    this.rating = getRating(movieId);
    this.onSelect = onSelect;
  }
  render() {
    const wrapper = document.createElement("div");
    wrapper.className = "user-rating";
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("img");
      star.src = "./images/star_empty.png";
      star.className = "star";
      star.dataset.value = i;
      star.addEventListener("click", () => {
        this.rating = i;
        setRating(this.movieId, this.rating);
        this.updateStars(wrapper);
        if (this.onSelect) this.onSelect(i);
      });
      wrapper.appendChild(star);
    }
    this.updateStars(wrapper);
    return wrapper;
  }
  updateStars(wrapper) {
    const stars = wrapper.querySelectorAll(".star");
    stars.forEach((star, index) => {
      star.src = index < this.rating ? "./images/star_filled.png" : "./images/star_empty.png";
    });
  }
  getRating() {
    return this.rating;
  }
}
class MovieModal {
  constructor(movie, movieService2) {
    __publicField(this, "handleEsc", (e) => {
      if (e.key === "Escape") {
        this.close();
      }
    });
    this.movie = movie;
    this.movieService = movieService2;
    this.modalRoot = document.querySelector("#modalBackground");
  }
  render() {
    const modal = this.createModalContent();
    this.modalRoot.textContent = "";
    this.modalRoot.appendChild(modal);
    this.modalRoot.classList.add("active");
    document.body.classList.add("modal-open");
    this.addEventListeners();
  }
  close() {
    this.modalRoot.classList.remove("active");
    document.body.classList.remove("modal-open");
    this.modalRoot.textContent = "";
    document.removeEventListener("keydown", this.handleEsc);
  }
  createModalContent() {
    const modal = document.createElement("div");
    modal.className = "modal";
    const closeButton = document.createElement("button");
    closeButton.className = "close-modal";
    closeButton.id = "closeModal";
    const closeImg = document.createElement("img");
    closeImg.src = "images/modal_button_close.png";
    closeButton.appendChild(closeImg);
    const container = document.createElement("div");
    container.className = "modal-container";
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "modal-image";
    const poster = document.createElement("img");
    poster.src = this.movie.getPosterUrl();
    poster.alt = this.movie.title;
    imageWrapper.appendChild(poster);
    const description = document.createElement("div");
    description.className = "modal-description";
    const movieBasicInfo = document.createElement("div");
    movieBasicInfo.className = "movie-basic-info";
    const title = document.createElement("h2");
    title.textContent = this.movie.title;
    const category = document.createElement("p");
    category.className = "category";
    category.textContent = "불러오는 중...";
    this.getMovieDetailText().then((text) => {
      category.textContent = text;
    });
    const rateBox = document.createElement("div");
    rateBox.className = "rate-box";
    const rate = document.createElement("p");
    rate.className = "rate";
    const starImg = document.createElement("img");
    starImg.src = "./images/star_filled.png";
    starImg.className = "star";
    const rateText = document.createElement("span");
    rateText.textContent = this.movie.getVoteAverage();
    rate.append(starImg, rateText);
    const rateTitle = document.createElement("p");
    rateTitle.textContent = "평균";
    rateBox.append(rateTitle, rate);
    movieBasicInfo.append(title, category, rateBox);
    const hr1 = document.createElement("hr");
    const hr2 = document.createElement("hr");
    const myRatingTitle = document.createElement("p");
    myRatingTitle.textContent = "내 별점";
    myRatingTitle.className = "user-rating-title";
    const ratingBox = document.createElement("div");
    ratingBox.className = "rating-box";
    const ratingMessage = document.createElement("p");
    ratingMessage.className = "rating-message";
    const starRating = new StarRating(this.movie.id, (score) => {
      ratingMessage.textContent = this.getMessageByScore(score);
    });
    const starUI = starRating.render();
    const rating = starRating.getRating();
    if (rating > 0) {
      ratingMessage.textContent = this.getMessageByScore(rating);
    }
    ratingBox.append(starUI, ratingMessage);
    const detailTitle = document.createElement("p");
    detailTitle.textContent = "줄거리";
    const detail = document.createElement("p");
    detail.className = "detail";
    detail.textContent = `${this.movie.overview || "설명 정보 없음"}`;
    description.append(movieBasicInfo, hr1, myRatingTitle, ratingBox, hr2, detailTitle, detail);
    container.append(imageWrapper, description);
    modal.append(closeButton, container);
    return modal;
  }
  addEventListeners() {
    const closeButton = document.querySelector("#closeModal");
    const overlay = this.modalRoot;
    closeButton == null ? void 0 : closeButton.addEventListener("click", this.close.bind(this));
    overlay == null ? void 0 : overlay.addEventListener("click", this.closeModalByOverlay.bind(this));
    document.addEventListener("keydown", this.handleEsc);
  }
  closeModalByOverlay(e) {
    if (e.target === this.modalRoot) {
      this.close();
    }
  }
  getMessageByScore(score) {
    const messages = {
      1: "최악이에요",
      2: "별로예요",
      3: "보통이에요",
      4: "재미있어요",
      5: "명작이에요"
    };
    const point = score * 2;
    const message = messages[score] ?? "";
    return `${message} (${point}/10)`;
  }
  async getMovieDetailText() {
    const { genres, releaseDate } = await this.movieService.getMovieDetail(this.movie.id);
    const releaseYear = releaseDate.split("-")[0];
    const genreText = genres.map((g) => g.name).join(", ") || "장르 정보 없음";
    return `${releaseYear} · ${genreText}`;
  }
}
class MovieCard {
  constructor(movie, movieService2) {
    this.movie = movie;
    this.movieService = movieService2;
  }
  render() {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item">
        <img
          class="thumbnail"
          src="${this.movie.getPosterUrl()}"
          alt="${this.movie.title}"
        />
        <div class="item-desc">
          <p class="rate">
            <img src="./images/star_empty.png" class="star" />
            <span>${this.movie.getVoteAverage()}</span>
          </p>
          <strong>${this.movie.title}</strong>
        </div>
      </div>
    `;
    li.addEventListener("click", () => {
      const modal = new MovieModal(this.movie, this.movieService);
      modal.render();
    });
    return li;
  }
  renderSkeleton() {
    const li = document.createElement("li");
    li.classList.add("skeleton-card");
    li.innerHTML = `
      <div class="item">
        <div class="skeleton skeleton-thumbnail"></div>
        <div class="item-desc">
          <p class="rate">
            <div class="skeleton skeleton-star"></div>
            <div class="skeleton skeleton-rate"></div>
          </p>
          <div class="skeleton skeleton-title"></div>
        </div>
      </div>
    `;
    return li;
  }
}
class CustomButton {
  constructor(buttonProps) {
    this.buttonProps = buttonProps;
  }
  render() {
    const button = document.createElement("button");
    button.textContent = this.buttonProps.content;
    button.className = this.buttonProps.className;
    return button;
  }
}
const ADD_MOVIE_BUTTON = {
  type: "button",
  className: "primary add-movie",
  content: "더보기"
};
class MovieList {
  constructor(containerSelector, moviesData, currentPage, totalPage, movieService2) {
    this.container = document.querySelector(containerSelector);
    this.moviesData = moviesData;
    this.movieService = movieService2;
    this.currentPage = currentPage;
    this.totalPage = totalPage;
  }
  init() {
    this.loadInitMovie();
  }
  loadInitMovie() {
    this.removeNoResultItem();
    if (!this.moviesData || this.moviesData.length === 0) {
      this.renderNoResult();
      return;
    }
    this.renderSkeleton();
    setTimeout(() => this.renderMovies(), 1e3);
  }
  removeNoResultItem() {
    const noResultsItem = document.querySelector(".no-results");
    if (noResultsItem) {
      noResultsItem.remove();
    }
  }
  renderNoResult() {
    const section = document.querySelector("section");
    const noResultsItem = document.createElement("div");
    noResultsItem.classList.add("no-results");
    noResultsItem.innerHTML = `
      <img src="./images/aaaahangsung.png" alt="no results" class="no-results-image">
      <p class="no-results-text">검색 결과가 없습니다</p>
    `;
    section.appendChild(noResultsItem);
  }
  renderSkeleton() {
    for (let i = 0; i < this.moviesData.length; i++) {
      const skeletonCard = new MovieCard(null).renderSkeleton();
      this.container.appendChild(skeletonCard);
    }
  }
  renderMovies() {
    this.container.innerHTML = "";
    this.moviesData.forEach((movieData) => {
      const movie = new Movie(movieData);
      const movieCard = new MovieCard(movie, this.movieService);
      this.container.appendChild(movieCard.render());
    });
  }
  addLoadMoreButton() {
    const existingButton = document.querySelector(".add-movie");
    existingButton == null ? void 0 : existingButton.remove();
    if (this.currentPage >= this.totalPage) {
      return;
    }
    const loadMoreButton = new CustomButton(ADD_MOVIE_BUTTON);
    const section = document.querySelector("section");
    section.appendChild(loadMoreButton.render());
  }
  static removeMovieList() {
    const movieList = document.querySelector(".thumbnail-list");
    movieList.textContent = "";
  }
  updateMovieListTitle(query) {
    this.resetPageNumber();
    const movieListTitle = document.querySelector(".movie-list-title");
    if (query) {
      movieListTitle.textContent = `"${query}" 검색 결과`;
      return;
    }
    movieListTitle.textContent = "지금 인기 있는 영화";
  }
  addPageNumber() {
    this.currentPage += 1;
  }
  resetPageNumber() {
    this.currentPage = 1;
  }
}
const MOVIES_PER_ROW = 4;
class MovieListHandler {
  constructor(movieService2) {
    __publicField(this, "movieList");
    __publicField(this, "movieService");
    __publicField(this, "isLoadingMore", false);
    this.movieService = movieService2;
  }
  async initMovieList(query) {
    var _a;
    if (!query) {
      this.showHeader();
    }
    const moviesData = query ? await this.movieService.searchMovies(query, 1) : await this.movieService.getPopularResults();
    this.updateMovieList(moviesData);
    (_a = this.movieList) == null ? void 0 : _a.updateMovieListTitle(query);
    this.setupInfiniteScroll();
  }
  updateMovieList(moviesData) {
    MovieList.removeMovieList();
    this.movieList = new MovieList(
      ".thumbnail-list",
      moviesData.movies,
      moviesData.page,
      moviesData.totalPages,
      this.movieService
    );
    this.movieList.init();
  }
  async handleMoreClickButton(query) {
    var _a;
    const loadMoreButton = document.querySelector(".add-movie");
    if (!loadMoreButton) return;
    const newButton = loadMoreButton.cloneNode(true);
    (_a = loadMoreButton.parentNode) == null ? void 0 : _a.replaceChild(newButton, loadMoreButton);
    newButton.addEventListener("click", async () => {
      await this.handleLoadMore();
    });
  }
  async handleLoadMore() {
    var _a, _b, _c;
    if (this.isLoadingMore) return;
    this.isLoadingMore = true;
    const pageNumber = ((_a = this.movieList) == null ? void 0 : _a.currentPage) + 1;
    (_b = this.movieList) == null ? void 0 : _b.addPageNumber();
    const skeletonCards = [];
    for (let i = 0; i < MOVIES_PER_ROW; i++) {
      const skeletonCard = new MovieCard(null).renderSkeleton();
      skeletonCards.push(skeletonCard);
      (_c = this.movieList) == null ? void 0 : _c.container.appendChild(skeletonCard);
    }
    const query = store.getQuery();
    let newMoviesData;
    setTimeout(async () => {
      if (store.getMode() === "popularAdd") {
        newMoviesData = await this.movieService.getPopularResults(pageNumber);
      } else {
        newMoviesData = await this.movieService.searchMovies(
          query ?? void 0,
          pageNumber
        );
      }
      skeletonCards.forEach((skeleton) => skeleton.remove());
      newMoviesData.movies.forEach((movieData) => {
        var _a2;
        const movie = new Movie(movieData);
        const movieCard = new MovieCard(movie, this.movieService);
        (_a2 = this.movieList) == null ? void 0 : _a2.container.appendChild(movieCard.render());
      });
      if (this.movieList && this.movieList.currentPage >= this.movieList.totalPage) {
        const loadMoreButton = document.querySelector(".add-movie");
        loadMoreButton == null ? void 0 : loadMoreButton.remove();
      }
      this.isLoadingMore = false;
    }, 1e3);
  }
  handleSearch(query) {
    if (!query.trim()) {
      this.initMovieList();
      return;
    }
    MovieList.removeMovieList();
    this.movieService.searchMovies(query).then((movies) => {
      this.movieList = new MovieList(
        ".thumbnail-list",
        movies,
        1,
        500,
        this.movieService
      );
      this.movieList.init();
      this.setupInfiniteScroll();
    });
  }
  handleLogoClick() {
    store.setMode("popularAdd");
    store.setQuery(null);
    this.initMovieList();
  }
  showHeader() {
    var _a, _b, _c;
    (_a = document.querySelector(".overlay")) == null ? void 0 : _a.classList.remove("hide");
    (_b = document.querySelector(".top-rated-movie")) == null ? void 0 : _b.classList.remove("hide");
    (_c = document.querySelector(".background-container")) == null ? void 0 : _c.classList.remove("hide-background");
  }
  setupInfiniteScroll() {
    window.addEventListener("scroll", async () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const bodyHeight = document.body.scrollHeight;
      const nearBottom = scrollTop + windowHeight >= bodyHeight - 200;
      if (nearBottom && this.movieList && this.movieList.currentPage < this.movieList.totalPage) {
        await this.handleLoadMore();
      }
    });
  }
}
const tmdbApiKey = "30efc476b168f7b5ee10b66769ccd4fc";
const tmdbBaseUrl = "https://api.themoviedb.org/3";
const movieService = new MovieService(tmdbApiKey, tmdbBaseUrl);
const movieListHandler = new MovieListHandler(movieService);
const searchHandler = new SearchHandler(movieListHandler);
window.addEventListener("load", async () => {
  const searchBar = new SearchBar(searchHandler);
  searchBar.createSearchBar();
  const logo = document.querySelector(".logo");
  logo == null ? void 0 : logo.addEventListener("click", () => {
    movieListHandler.handleLogoClick();
  });
  await movieListHandler.initMovieList();
});
