import Search from './modules/search'

// No point instantiating a Search object if the search icon does exist on the page
if (document.querySelector('#search-icon')) {new Search()}