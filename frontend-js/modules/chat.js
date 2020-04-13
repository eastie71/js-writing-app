import DOMPurify from 'dompurify'

export default class Class {
    constructor() {
        this.firstOpen = false
        this.chatWrapper = document.querySelector("#chat-wrapper")
        this.openChatIcon = document.querySelector('#chat-icon')
        this.injectChatHTML()
        this.chatLog = document.querySelector('#chat')
        this.chatField = document.querySelector('#chatField')
        this.chatForm = document.querySelector('#chatForm')
        this.closeChatIcon = document.querySelector('#close-chat')
        this.events()
    }

    // Setup related events
    events() {
        this.openChatIcon.addEventListener("click", () => this.showChat())
        this.closeChatIcon.addEventListener("click", () => this.hideChat())
        this.chatForm.addEventListener("submit", (e) => {
            e.preventDefault()
            this.sendMessageToServer()
        })
    }

    // Methods
    sendMessageToServer() {
        this.socket.emit('chatMessageFromClient', {message: this.chatField.value})
        this.chatLog.insertAdjacentHTML("beforeend", DOMPurify.sanitize(`
            <div class="chat-self">
                <div class="chat-message">
                    <div class="chat-message-inner">
                        ${this.chatField.value}
                    </div>
                </div>
                <img class="chat-avatar avatar-tiny" src="${this.avatar}">
            </div>
        `))
        // Force scroll position to the very bottom of the chatLog div
        this.chatLog.scrollTop = this.chatLog.scrollHeight
        this.chatField.value = ""
        this.chatField.focus()
    }

    showChat() {
        if (!this.firstOpen) {
            this.openConnection()
            this.firstOpen = true
        }
        this.chatWrapper.classList.add("chat--visible")
        this.chatField.focus()
    }

    hideChat() {
        this.chatWrapper.classList.remove("chat--visible")
    }

    openConnection() {
        // establish connection through socket io - must set to "io()"
        this.socket = io()

        // Setup data required by current user to display the messages they send
        this.socket.on('welcome', data => {
            this.username = data.username
            this.avatar = data.avatar
        })

        this.socket.on('chatMessageFromClient', (data) => {
            this.displayMessageFromServer(data)
        })
    }

    displayMessageFromServer(data) {
        this.chatLog.insertAdjacentHTML("beforeend", DOMPurify.sanitize(`
            <div class="chat-other">
                <a href="/profile/${data.username}"><img class="avatar-tiny" src="${data.avatar}"></a>
                <div class="chat-message"><div class="chat-message-inner">
                <a href="/profile/${data.username}"><strong>${data.username}:</strong></a>
                    ${data.message}
                </div></div>
            </div>
        `))
        // Force scroll position to the very bottom of the chatLog div
        this.chatLog.scrollTop = this.chatLog.scrollHeight
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