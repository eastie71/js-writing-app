import Search from './modules/search'
import Chat from './modules/chat'

// No point instantiating a Search object if the search icon does exist on the page
if (document.querySelector('#search-icon')) { new Search() }

// Don't instantiate Chat object if user not logged in
if (document.querySelector('#chat-wrapper')) { new Chat() }