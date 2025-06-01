const TimeCacheStorage = require("./TimeCacheStorage")
const WebSocket = require('ws')

class TwitchPubSub {
    constructor(data, auth, callback){
        data.test = 2;
        this.ws
        this.message_cache = new TimeCacheStorage(1000*60*3)
        this.reconnect_ws
        this.gotPong = false
        this.heartbeat_handler
        this.backoff_handler
        this.keepalive_handler
        this.heartbeat_interval = 2500*60
        this.reconnect_interval = 3000
        this.reconnect_backoff = 1
        this.is_reconnecting = false
        this.session_id = null
        this.disconnect_timeout = null
        this.heartbeat_isalive = false
        this.keepalive_timeout_seconds = 30
        this.last_close_code = 0
        this.auth = auth
        this.broadcaster_user_id = ""
        this.data = data
        this.callback = callback
    }

    getNonce(length) {
        var text = ""
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length))
        }
        return text
    }
    addListen(){
        this.auth.subscribeToBitsEvents(this.broadcaster_user_id, this.session_id)
    }

    _createCreateSubscription(type, version, condition){
        return{
            "type": type,
            "version": version,
            "condition": condition,
            "transport": {
                "method": "websocket",
                "session_id": this.session_id
            }
        }
    }

    getTarget(words){
        if(words.length >= 1){
            let user = words[0].trim()
            if (user[0] === "@"){
                return user.slice(1)
            }else{
                return user
            }
        }else{
            return null
        }  
    }

    disconnectWS(error = 4500){
        if (this.keepalive_handler) {
            clearTimeout(this.keepalive_handler)
            this.keepalive_handler = null
        }
        if(this.ws !== null && this.ws !== undefined){
            this.last_close_code = error
            this.ws.close(error)
        }
    }

    excludeCheers(msg){
        return msg.replace(/(?:(?:rip|doodle)?cheer|cheerwhal|streamlabs|mux|bitboss|biblethump|corgo|uni|showlove|party|seemsgood|pride|kappa|frankerz|heyguys|dansgame|elegiggle|trihard|kreygasm|4head|swiftrage|notlikethis|failfish|vohiyo|pjsalt|mrdestructoid|bdayshamrock|anon)0*[1-9]\d*/i, "")
    }

    _gotRecconct(url){
        this.reconnect_ws = new WebSocket(url)
        this.reconnect_ws.onmessage = async (event) => {
            let message = JSON.parse(event.data)
            if (message.metadata.message_type === 'session_welcome') {
                this.session_id = message.payload.session.id
                this.keepalive_timeout_seconds = message.payload.session.keepalive_timeout_seconds
                this.keepalive_handler = setTimeout(() => {
                    console.log("@TwitchPubSub._gotRecconct.session_keepalive")   
                    this.connectWS()
                }, (this.keepalive_timeout_seconds * 1000) + 20000)
                this.last_close_code = 4610
                this.ws.close(4610)
                this.is_reconnecting = false
            }
        }
        this.reconnect_ws.onerror = (error) => {
            console.log("@TwitchPubsub._gotRecconct.onerror!", JSON.stringify(error))
        }
        this.reconnect_ws.onclose = (event) => {
            console.log("@TwitchPubsub._gotRecconct.onclose!", JSON.stringify(event))
            this._setbackoffHandler(this.connectWS, 1000*5)
            this.reconnect_ws.onopen = null
            this.reconnect_ws.onerror = null
            this.reconnect_ws.onclose = null
            this.reconnect_ws.onmessage = null
            this.reconnect_ws = null
        }
    }

    _setbackoffHandler(method, time) {
        if(this.backoff_handler){
            clearTimeout(this.backoff_handler)
            this.backoff_handler = null
        }
        this.backoff_handler = setTimeout(method.bind(this), time)
    }

    async connectWS(code = 4600) {
        if(this.backoff_handler){
            clearTimeout(this.backoff_handler)
            this.backoff_handler = null
        }

        if(this.ws !== null && this.ws !== undefined){
            this.disconnectWS(code)
            return
        }

        this.broadcaster_user_id = await this.auth.getUserID(this.data.channel)
        this.ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30')
        this.ws.onopen = () => {
            this.last_close_code = 0
            this.reconnect_backoff = 1
        }
        
        this._setupOnHandling()
    }

    _setupOnHandling() {
        this.ws.onmessage = async (event) => {
            let message = JSON.parse(event.data)
            const messageId = message.metadata.message_id
            if (this.message_cache.has(messageId)) {
                return
            }
            this.message_cache.set(messageId, true)
            
            if(this.keepalive_handler){
                this._resetKeepaliveHandler()
            }

            switch (message.metadata.message_type) {
                case 'session_welcome':
                    this.session_id = message.payload.session.id
                    this.keepalive_timeout_seconds = message.payload.session.keepalive_timeout_seconds
                    this.addListen()
                    this.keepalive_handler = setTimeout(() => {
                        console.log("@TwitchPubSub._gotRecconct.session_keepalive")
                        this.connectWS()
                    }, (this.keepalive_timeout_seconds * 1000) + 20000)
                    break

                case 'notification': {
                    const eventType = message.metadata.subscription_type
                    const eventData = message.payload.event
                    const metadata = message.metadata

                    switch (eventType) {
                        case 'channel.bits.use': {
                            this.callback(eventData)
                            break
                        }
                    }
                    break
                }
                case 'session_keepalive':
                    this.gotPong = true
                    break

                case 'session_reconnect':
                    if(this.keepalive_handler){
                        clearTimeout(this.keepalive_handler)
                        this.keepalive_handler = null
                    }
                    this.is_reconnecting = true
                    this._gotRecconct(message.payload.session.reconnect_url)
                    break
            }
        }

        this.ws.onerror = (error) => {
            console.log("@TwitchPubsub.onerror!", error)
        }

        this.ws.onclose = (event) => {
            if(this.keepalive_handler){
                clearTimeout(this.keepalive_handler)
                this.keepalive_handler = null
            }

            this.ws.onclose = null
            this.ws.onerror = null
            this.ws.onmessage = null
            this.ws.onopen = null
            this.ws = null

            console.log("@TwitchPubSub.onclose", event.code, "Event:" + JSON.stringify(event) + " - " + this.last_close_code)

            if (this.last_close_code === 4600) {
                this.last_close_code = 0
                return
            }
            
            if (this.last_close_code === 4610) {
                console.log("@twitchpubsub.onclose", "Twitch asked for reconnect. Reconnected")
                this.ws = this.reconnect_ws
                this.reconnect_ws = null
                this.last_close_code = 0
                this._setupOnHandling()
            } else if (this.last_close_code === 4500) {
            } else if (event.code === 4007 || event.code === 4004) {
                this._setbackoffHandler(this.connectWS, 1000*5)
            } else {
                this._setbackoffHandler(this.connectWS, 1000*10)
            }

            this.last_close_code = 0
        }
    }

    _resetKeepaliveHandler() {
        clearTimeout(this.keepalive_handler)
        this.keepalive_handler = setTimeout(() => {
            console.log("@TwitchPubSub.keepalive_handler.session_keepalive")
            this.connectWS()
        }, (this.keepalive_timeout_seconds * 1000) + 20000)
    }
}

module.exports = TwitchPubSub
