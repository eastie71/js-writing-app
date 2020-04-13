export default class Class {
    constructor() {
        this.firstOpen = false
        this.chatWrapper = document.querySelector("#chat-wrapper")
        this.openChatIcon = document.querySelector('#chat-icon')
        this.injectChatHTML()
        this.closeChatIcon = document.querySelector('#close-chat')
        this.events()
    }

    // Setup related events
    events() {
        this.openChatIcon.addEventListener("click", () => this.showChat())
        this.closeChatIcon.addEventListener("click", () => this.hideChat())

    }

    // Methods
    showChat() {
        if (!this.firstOpen) {
            this.openConnection()
            this.firstOpen = true
        }
        this.chatWrapper.classList.add("chat--visible")
    }

    hideChat() {
        this.chatWrapper.classList.remove("chat--visible")
    }

    openConnection() {
        alert("Open connection")
    }

    injectChatHTML() {
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span id="close-chat" class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
            <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>

        `
    }
}