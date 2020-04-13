import axios from 'axios'
import DOMPurify from 'dompurify'

export default class Search {
    // 1. Select DOM elements and keep track of useful data
    constructor() {
        this.injectHTML()
        this.headerSearchIcon = document.querySelector('#search-icon')
        this.overlay = document.querySelector('.search-overlay')
        this.closeSearchIcon = document.querySelector('.close-live-search')
        this.searchField = document.querySelector('#live-search-field')
        this.searchResults = document.querySelector('.live-search-results')
        this.loadingIcon = document.querySelector('.loading')
        this.typingWaitTimer
        this.previousValue = ""
        this.events()
    }

    // 2. Events
    events() {
        this.searchField.addEventListener("keyup", () => this.keyPressHandler())
        this.closeSearchIcon.addEventListener("click", () => this.closeSearchOverlay())
        this.headerSearchIcon.addEventListener("click", (e) => {
            e.preventDefault()
            this.openSearchOverlay()
        })        
    }

    // 3. Methods
    keyPressHandler() {
        let value = this.searchField.value
        if (value == "") {
            clearTimeout(this.typingWaitTimer)
            this.hideLoadingIcon()
            this.hideSearchResults()
        }
        if (value != "" && value != this.previousValue) {
            clearTimeout(this.typingWaitTimer)
            this.showLoadingIcon()
            this.hideSearchResults()
            this.typingWaitTimer = setTimeout(() => this.searchRequest(), 750)
        }
        this.previousValue = value
    }

    searchRequest() {
        axios.post('/search', {searchTerm: this.searchField.value}).then(response => {
            // results here
            console.log(response.data)
            this.renderResultsHTML(response.data)
        }).catch(() => {
            alert("Oh dear, the search failed!")
        })
    }

    renderResultsHTML(posts) {
        if (posts.length) {
            // Using DOMpurify here to sanitize the display HTML instead of sanatizeHTML because it is much more lightweight to 
            // send to the browser
            this.searchResults.innerHTML = DOMPurify.sanitize(`<div class="list-group shadow-sm">
            <div class="list-group-item active"><strong>Search Results</strong> (${posts.length} ${posts.length > 1 ? `items` : `item`} found)</div>
            ${posts.map(post => {
                let postDate = new Date(post.createdDate)
                return `
                <a href="/post/${post._id}" class="list-group-item list-group-item-action">
                    <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
                    <span class="text-muted small">by ${post.author.username} on ${postDate.getDate()}/${postDate.getMonth()+1}/${postDate.getFullYear()}</span>
                </a>`
            }).join('')} 
        </div>`)
        } else {
            this.searchResults.innerHTML = `<p class="alert alert-danger text-center shadow-sm">No results found.</p>`
        }
        this.hideLoadingIcon()
        this.showSearchResults()
    }

    hideLoadingIcon() {
        this.loadingIcon.classList.remove("loading--visible")
    }

    showLoadingIcon() {
        this.loadingIcon.classList.add("loading--visible")
    }

    showSearchResults() {
        this.searchResults.classList.add("live-search-results--visible")
    }

    hideSearchResults() {
        this.searchResults.classList.remove("live-search-results--visible")
    }

    openSearchOverlay() {
        this.overlay.classList.add("search-overlay--visible")
        // Focus set to the search input field. Apparently you need a timeout here because initially the
        // div this field lives in is not visable and some browsers need time to set the focus
        setTimeout(() => this.searchField.focus(), 50)
    }

    closeSearchOverlay() {
        this.overlay.classList.remove("search-overlay--visible")
    }
    
    injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `
        <div class="search-overlay">
            <div class="search-overlay-top shadow-sm">
                <div class="container container--narrow">
                    <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
                    <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
                    <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
                </div>
            </div>
        
            <div class="search-overlay-bottom">
                <div class="container container--narrow py-3">
                    <div class="loading"></div>
                    <div class="live-search-results"></div>
                </div>
            </div>
        </div>
        `)
    }
    
}