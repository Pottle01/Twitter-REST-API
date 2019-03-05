/* 
 * Filename: /Users/jpottle776/www/0_MEAN_STACK/Exercise_02_01_01/authenticator.js
 * Path: /Users/jpottle776/www/0_MEAN_STACK/Exercise_02_01_01
 * Created Date: Friday, January 25th 2019, 1:43:28 pm
 * Author: Jamin C. Pottle
 * 
 */

var OAuth = require('oauth').OAuth; //*requires in the OAuth object
var config = require('./config.json');

//*Creating OAuth object
var oauth = new OAuth(
    config.request_token_url,
    config.access_token_url,
    config.consumer_key,
    config.consumer_secret,
    config.oauth_version,
    config.oauth_callback,
    config.oauth_signature
);

//*temp storage for tokens
var twitterCredentials = {
    oauth_token: "",
    oauth_token_secret: "",
    access_token: "",
    access_token_secret: "",
    twitter_id: ""
}

module.exports = {
    getCredentials: function () {
        return twitterCredentials;
    },
    // clears credentials when logged out
    clearCredentials: function () {
        twitterCredentials.oauth_token = "";
        twitterCredentials.oauth_token_secret = "";
        twitterCredentials.access_token = "";
        twitterCredentials.access_token_secret = "";
        twitterCredentials.twitter_id = "";
    },
    //*url is for target API
    get: function (url, access_token, access_token_secret, callback) {
        oauth.get.call(oauth, url, access_token, access_token_secret, callback);
    },
    post: function (url, access_token, access_token_secret, body, callback) {
        oauth.post.call(oauth, url, access_token, access_token_secret, body, callback);
    },
    redirectToTwitterLoginPage: function (req, res) {
        oauth.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
            if (error) {
                console.log(error);
                res.send("Authentication failed!");
            } else {//*stores credentials to temp storage
                twitterCredentials.oauth_token = oauth_token;
                twitterCredentials.oauth_token_secret = oauth_token_secret;
                res.redirect(config.authorize_url + '?oauth_token=' + oauth_token);
            }
        });
    },

    authenticate: function(req, res, callback){
        if(!(twitterCredentials.oauth_token && twitterCredentials.oauth_token_secret && req.query.oauth_verifier)){
            return callback("Request does not have all required keys");
        }
        oauth.getOAuthAccessToken(twitterCredentials.oauth_token, twitterCredentials.oauth_token_secret, req.query.oauth_verifier, function(error, oauth_access_token, oauth_access_token_secret, results){
            if (error) {
                return callback(error);
            } 
            oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json', oauth_access_token, oauth_access_token_secret, function(error, data) {
                if (error) {
                    console.log(error);
                    return callback(error);
                } 
                data = JSON.parse(data);
                twitterCredentials.access_token = oauth_access_token;
                twitterCredentials.access_token_secret = oauth_access_token_secret;
                twitterCredentials.twitter_id = data.id_str;
                // console.log(data);
                return callback();
            });
        });
    }
}