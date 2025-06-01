const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
class TwitchAuth {
    constructor(data, token_data) {
        this.clientId = "c0atrdmlqmhl2yv338z75zxnbrttp3";
        //this.clientId = "gp762nuuoqcoxypju8c569th9wz7q5";
        this.deviceCodeEndpoint = 'https://id.twitch.tv/oauth2/device';
        this.tokenEndpoint = 'https://id.twitch.tv/oauth2/token';
        this.token_data = token_data;
        this.data = data;
    }

    isAuthenticated() {
        return this.token_data && 
               this.token_data.eventsub_token && 
               this.token_data.eventsub_token !== "TOKEN" &&
               this.token_data.eventsub_refresh_token && 
               this.token_data.eventsub_refresh_token !== "TOKEN";
    }

    async getDeviceCode() {
        try {
            const response = await axios.post(`${this.deviceCodeEndpoint}?client_id=${this.clientId}&scope=bits:read user:bot chat:edit chat:read`);

            return response.data;
        } catch (error) {
            console.error('Error getting device code:', error.response.data);
            throw error;
        }
    }

    async pollForToken(deviceCode, interval) {
        try {
            const response = await axios.post(`${this.tokenEndpoint}?client_id=${this.clientId}&scope=bits:read user:bot chat:edit chat:read&device_code=${deviceCode}&grant_type=urn:ietf:params:oauth:grant-type:device_code`);

            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 400) {
                if(error.response.data.message === "authorization_pending"){
                    console.log("authorization pending, polling again in 5 seconds")
                    await new Promise(resolve => setTimeout(resolve, 5 * 1000));
                    return this.pollForToken(deviceCode, interval);
                }
                else{
                    console.log("error polling for token", error.response.data)
                }
            }
            throw error;
        }
    }

    async refreshToken() {
        try {
            const response = await axios.post(
                `${this.tokenEndpoint}?client_id=${this.clientId}&grant_type=refresh_token&refresh_token=${this.token_data.eventsub_refresh_token}`
            );


            this.token_data.eventsub_token = response.data.access_token;
            this.token_data.eventsub_refresh_token = response.data.refresh_token;
            this.token_data.eventsub_expires_in = response.data.expires_in;

            // Save to settings.json
            this.data.eventsub.eventsub_token = response.data.access_token;
            this.data.eventsub.eventsub_refresh_token = response.data.refresh_token;
            this.data.eventsub.eventsub_expires_in = response.data.expires_in;
            fs.writeFileSync('../settings.json', JSON.stringify(this.data, null, 4));

            return {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                expires_in: response.data.expires_in
            };
        } catch (error) {
            // Reset token data to force new authentication
            this.token_data.eventsub_token = "TOKEN";
            this.token_data.eventsub_refresh_token = "TOKEN";
            this.token_data.eventsub_expires_in = "TOKEN";
            
            // Also reset the data.eventsub values
            this.data.eventsub.eventsub_token = "TOKEN";
            this.data.eventsub.eventsub_refresh_token = "TOKEN";
            this.data.eventsub.eventsub_expires_in = "TOKEN";
            
            // Update settings file
            fs.writeFileSync('../settings.json', JSON.stringify(this.data, null, 4));
            
            // Start new authentication process
            return this.authenticate();
        }
    }

    async authenticate() {
        try {
            // If we have a refresh token, try to refresh first
            if (this.token_data && this.token_data.eventsub_refresh_token !== "TOKEN") {
                try {
                    return await this.refreshToken();
                } catch (error) {
                    console.log('Token refresh failed, starting new authentication');
                    // Reset token data to force new authentication
                    this.token_data.eventsub_token = "TOKEN";
                    this.token_data.eventsub_refresh_token = "TOKEN";
                    this.token_data.eventsub_expires_in = "TOKEN";
                    
                    // Also reset the data.eventsub values
                    this.data.eventsub.eventsub_token = "TOKEN";
                    this.data.eventsub.eventsub_refresh_token = "TOKEN";
                    this.data.eventsub.eventsub_expires_in = "TOKEN";
                    
                    // Update settings file
                    fs.writeFileSync('../settings.json', JSON.stringify(this.data, null, 4));
                    
                    return this.authenticate();
                }
            }

            // Get device code
            const deviceCodeData = await this.getDeviceCode();
            const { device_code, user_code, verification_uri, expires_in, interval } = deviceCodeData;

            // Display instructions to user
            const open = (await import('open')).default;
            await open(verification_uri);
            console.log('\nTo authorize this application:');
            console.log(`1. Visit: ${verification_uri}`);
            console.log(`2. Enter the code: ${user_code}`);
            console.log(`3. You most log in with you streamer account`);
            console.log('\nWaiting for authorization...');

            // Poll for token
            const tokenData = await this.pollForToken(device_code, interval);
            
            console.log('\nAuthentication successful!');

            this.token_data.eventsub_token = tokenData.access_token
            this.token_data.eventsub_refresh_token = tokenData.refresh_token
            this.token_data.eventsub_expires_in = tokenData.expires_in

            this.data.eventsub.eventsub_token = tokenData.access_token
            this.data.eventsub.eventsub_refresh_token = tokenData.refresh_token
            this.data.eventsub.eventsub_expires_in = tokenData.expires_in
            fs.writeFileSync('../settings.json', JSON.stringify(this.data, null, 4));
            return {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_in: tokenData.expires_in
            };
        } catch (error) {
            console.error('Authentication failed:', error.message.data);
            throw error;
        }
    }

    async getUserID(username) {
        try {
            const response = await axios.get(
                `https://api.twitch.tv/helix/users?login=${username}`,
                {
                    headers: {
                        'Client-Id': this.clientId,
                        'Authorization': `Bearer ${this.token_data.eventsub_token}`
                    }
                }
            );

            if (response.data.data.length === 0) {
                throw new Error(`User ${username} not found`);
            }

            return response.data.data[0].id;
        } catch (error) {
            if (error.response?.status === 401) {
                // Token is invalid, try to refresh
                await this.refreshToken();
                // Retry the request with new token
                const response = await axios.get(
                    `https://api.twitch.tv/helix/users?login=${username}`,
                    {
                        headers: {
                            'Client-Id': this.clientId,
                            'Authorization': `Bearer ${this.token_data.eventsub_token}`
                        }
                    }
                );

                if (response.data.data.length === 0) {
                    throw new Error(`User ${username} not found`);
                }

                return response.data.data[0].id;
            }
            console.error('Error getting user ID:', error.response?.data || error.message);
            throw error;
        }
    }

    async subscribeToBitsEvents(broadcaster_user_id, session_id) {
        try {
            const response = await axios.post(
                'https://api.twitch.tv/helix/eventsub/subscriptions',
                {
                    type: 'channel.bits.use',
                    version: '1',
                    condition: {
                        broadcaster_user_id: broadcaster_user_id
                    },
                    transport: {
                        method: 'websocket',
                        session_id: session_id
                    }
                },
                {
                    headers: {
                        'Client-Id': this.clientId,
                        'Authorization': `Bearer ${this.data.eventsub.eventsub_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error subscribing to bits events:', error.response?.data || error.message);
        }
    }
}

module.exports = TwitchAuth;
