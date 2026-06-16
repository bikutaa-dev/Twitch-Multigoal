const axios = require("axios")

class TwitchAPI {
    constructor(data, auth){
        this.data = data
        this.auth = auth
    }
    getHelixHeaders(){
        return {
            'Client-Id': this.auth.clientId,
            'Authorization': `Bearer ${this.auth.token_data.eventsub_token}`
        }
    }

    async helixGet(url){
        try {
            const response = await axios.get(url, {headers: this.getHelixHeaders()})
            let return_data = {
                data: response.data.data,
                status: response.status,
                statusText: response.statusText,
            }
            return return_data
        } catch (error) {
            let return_data = {
                data: null,
                status: error.response.status,
                statusText: error.response.statusText,
            }
            return return_data
        }
    }

    async getBroadcasterID(retry = true){
        const user_response = await this.helixGet(`https://api.twitch.tv/helix/users?login=${this.data.channel}`)
        if (!user_response) {
            return {wasSuccessful: false, channelPointsRedeems: {}}
        }
        let user_result = await this.checkResponse(user_response, this.getBroadcasterID.bind(this), retry)
        return user_result
    }

    async getChannelPointsRedeemsList(broadcaster_id, retry = true){
        const response = await this.helixGet(`https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcaster_id}`)
        if (!response) {
            return {wasSuccessful: false, channelPointsRedeems: {}}
        }
        let result = await this.checkResponse(response, this.getChannelPointsRedeems.bind(this), retry)
        let return_data = {wasSuccessful: result.wasSuccessful, channelPointsRedeems: {}}
        if(return_data.wasSuccessful){
            return return_data = this.listRedeems(result, return_data)
        }else{
            return return_data
        }
    }
    async getChannelPointsRedeems(retry = true){
        const broadcaster_id = await this.getBroadcasterID(this.data.channel)
        if(!broadcaster_id.wasSuccessful){
            return broadcaster_id
        }

        const channelPointsRedeemsList = await this.getChannelPointsRedeemsList(broadcaster_id.data[0].id)
        if(!channelPointsRedeemsList.wasSuccessful){
            return channelPointsRedeemsList
        }

        return {wasSuccessful: true, channelPointsRedeems: channelPointsRedeemsList.channelPointsRedeems}
    }

    listRedeems(response, return_data){
        for(let i=0; i<response.data.length; i++){       
            return_data.channelPointsRedeems[response.data[i].id] = response.data[i].title
        }
        return return_data
    }

    async checkResponse(response, callback, retry = false){

        if(response.status === 401 && retry){
            console.error(`Error requesting twitch API: ${response.statusText}, refreshing token and retrying...`)
            await this.auth.refreshToken()
            return await callback(false)
        }

        if(response.status === 503 && retry){
            console.error(`Error requesting twitch API: ${response.statusText}, retrying...`)
            return await callback(false)
        }


        if(response.status !== 200 && response.status !== 202 && response.status !== 204){
            console.error(`Error requesting twitch API: ${response.statusText}`)
            response.wasSuccessful = false
            return response
        }else{
            response.wasSuccessful = true
            return response
        }

        return {wasSuccessful: false, data: null, status: response.status, statusText: response.statusText}
    }
} 
module.exports = TwitchAPI