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
}
class Movie {
  constructor(movieData) {
    __publicField(this, "id");
    __publicField(this, "title");
    __publicField(this, "posterPath");
    __publicField(this, "voteAverage");
    this.id = movieData.id;
    this.title = movieData.title;
    this.posterPath = movieData.posterPath;
    this.voteAverage = movieData.voteAverage;
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
  constructor() {
    __publicField(this, "api");
    this.api = new TmdbApi(
      "ceb24f0a50c6198d711612e594503f23",
      "https://api.themoviedb.org/3"
    );
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
            voteAverage: movie.vote_average
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
      const response = await this.api.searchMovies(query, page);
      return {
        movies: response.results.map(
          (movie) => new Movie({
            id: movie.id,
            title: movie.title,
            posterPath: movie.poster_path || "",
            voteAverage: movie.vote_average
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
}
class Store {
  constructor() {
    __publicField(this, "state");
    this.state = { currentMode: "popularAdd" };
  }
  setMode(newMode) {
    this.state.currentMode = newMode;
  }
  getMode() {
    return this.state.currentMode;
  }
}
const store = new Store();
class SearchHandler {
  constructor(movieListHandler2) {
    this.movieListHandler = movieListHandler2;
  }
  async handleSearch(query) {
    await this.movieListHandler.initMovieList(query);
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
    input.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        await this.searchHandler.handleSearch(e.target.value);
        store.setMode("searchAdd");
      }
    });
    const searchButton = document.createElement("button");
    searchButton.classList.add("search-bar-button");
    searchButton.addEventListener("click", async () => {
      await this.searchHandler.handleSearch(input.value);
      store.setMode("searchAdd");
    });
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
}
class MovieCard {
  constructor(movie) {
    this.movie = movie;
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
  constructor(fieldName) {
    this.fieldName = fieldName;
  }
  render() {
    const button = document.createElement("button");
    button.textContent = this.fieldName.content;
    button.className = this.fieldName.className;
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
    this.addLoadMoreButton();
  }
  loadInitMovie() {
    const noResultsItem = document.querySelector(".no-results");
    if (noResultsItem) {
      noResultsItem.remove();
    }
    if (!this.moviesData || this.moviesData.length === 0) {
      const section = document.querySelector("section");
      const noResultsItem2 = document.createElement("div");
      noResultsItem2.classList.add("no-results");
      noResultsItem2.innerHTML = `
        <img src="./images/aaaahangsung.png" alt="no results" class="no-results-image">
        <p class="no-results-text">검색 결과가 없습니다</p>
      `;
      section.appendChild(noResultsItem2);
      return;
    }
    for (let i = 0; i < this.moviesData.length; i++) {
      const skeletonCard = new MovieCard(null).renderSkeleton();
      this.container.appendChild(skeletonCard);
    }
    setTimeout(() => {
      this.container.innerHTML = "";
      this.moviesData.forEach((movieData) => {
        const movie = new Movie(movieData);
        const movieCard = new MovieCard(movie);
        this.container.appendChild(movieCard.render());
      });
    }, 1e3);
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
class MovieListHandler {
  constructor(movieService2) {
    __publicField(this, "movieList");
    __publicField(this, "movieService");
    this.movieService = movieService2;
  }
  async initMovieList(query) {
    var _a, _b, _c;
    const moviesData = query ? await this.movieService.searchMovies(query, 1) : await this.movieService.getPopularResults();
    this.updateMovieList(moviesData);
    this.handleMoreClickButton(query);
    (_a = this.movieList) == null ? void 0 : _a.updateMovieListTitle(query);
    console.log((_b = this.movieList) == null ? void 0 : _b.currentPage);
    console.log((_c = this.movieList) == null ? void 0 : _c.totalPage);
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
      await this.handleLoadMore(query);
    });
  }
  async handleLoadMore(query) {
    var _a, _b, _c;
    const pageNumber = ((_a = this.movieList) == null ? void 0 : _a.currentPage) + 1;
    (_b = this.movieList) == null ? void 0 : _b.addPageNumber();
    console.log(`pageNumber: ${pageNumber}`);
    const skeletonCards = [];
    for (let i = 0; i < 5; i++) {
      const skeletonCard = new MovieCard(null).renderSkeleton();
      skeletonCards.push(skeletonCard);
      (_c = this.movieList) == null ? void 0 : _c.container.appendChild(skeletonCard);
    }
    let newMoviesData;
    setTimeout(async () => {
      if (store.getMode() === "popularAdd") {
        newMoviesData = await this.movieService.getPopularResults(pageNumber);
      } else {
        newMoviesData = await this.movieService.searchMovies(query, pageNumber);
      }
      skeletonCards.forEach((skeleton) => skeleton.remove());
      newMoviesData.movies.forEach((movieData) => {
        var _a2;
        const movie = new Movie(movieData);
        const movieCard = new MovieCard(movie);
        (_a2 = this.movieList) == null ? void 0 : _a2.container.appendChild(movieCard.render());
      });
      if (this.movieList && this.movieList.currentPage >= this.movieList.totalPage) {
        console.log("remove load more button");
        const loadMoreButton = document.querySelector(".add-movie");
        loadMoreButton == null ? void 0 : loadMoreButton.remove();
      }
    }, 1e3);
  }
  handleSearch(query) {
    if (!query.trim()) {
      this.initMovieList();
      return;
    }
    MovieList.removeMovieList();
    this.movieService.searchMovies(query).then((movies) => {
      this.movieList = new MovieList(".thumbnail-list", movies, 1, 500, this.movieService);
      this.movieList.init();
    });
  }
  handleLogoClick() {
    this.initMovieList();
  }
}
const tmdbApi = new TmdbApi("ceb24f0a50c6198d711612e594503f23");
const movieService = new MovieService(tmdbApi);
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
