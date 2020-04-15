import Search from './modules/search'
import Chat from './modules/chat'
import RegistrationForm from './modules/registrationForm'

// No point instantiating a Search object if the search icon does exist on the page
if (document.querySelector('#search-icon')) { new Search() }

// Don't instantiate Chat object if user not logged in
if (document.querySelector('#chat-wrapper')) { new Chat() }

// Only instantiate registration form if registration html exists on current page
if (document.querySelector('#registration-form')) { new RegistrationForm() }