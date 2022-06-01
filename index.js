const app = require('express')();
const axios = require('axios');
require('dotenv').config();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const server_url = process.env.MORALIS_SERVER_ID;
const app_id = process.env.MORALIS_APPLICATION_ID;
const PORT = 8080;
let page_url = 'https://tribes.spect.network';
const redirect_url = 'http://localhost:4000/probot'; // URL which is given as Callback URL - Github App settings

app.get('/probot', function(req, res){

    let accessToken, data, tribe_id, user_url;
    let repo_array = [];

    const code = req.query.code;
    const installation_id = req.query.installation_id;
    const setup_action = req.query.setup_action;
    const space_id = req.query.state;

    console.log(code, installation_id, setup_action, space_id);

    run_processess();

    async function run_processess(){
        await getAccessToken();
        await getRepo();
        if (repo_array.length) await postToMoralis();
        if (setup_action === 'install'){
            page_url = `http://localhost:3000/tribe/${tribe_id}/space/${space_id}`;
            res.redirect(page_url);
        }
        if (setup_action === 'update'){
            res.redirect(user_url);
        }
        
    }

    async function getAccessToken(){
        var config = {
            method: "post",
            url: `https://github.com/login/oauth/access_token?client_id=${client_id}&client_secret=${client_secret}&code=${code}&redirect_uri=${redirect_url}`,
            headers: {'Authorization': 'Bearer '+ `${client_secret}`}
        };
        await axios(config)
        .then(function (response) {
            data = response.data;
            accessToken = ((data.split('&',5))[0].split('=',2))[1];
            console.log("Access Token is "+ accessToken);
            
        })
        .catch(function (error) {
            console.log(error);
        }); 
    }


    async function getRepo(){
        var config = {
            method: "get",
            url: `https://api.github.com/user/installations/${installation_id}/repositories`,
            headers: {'Accept': 'application/vnd.github.v3+json', 'Authorization': 'Bearer '+ `${accessToken}`}
        };
        await axios(config)
        .then(function (response) {
            console.log("Total no. of repo : "+response.data.total_count);
            response.data.repositories.forEach( repo => {
                repo_array.push(repo.html_url)
            });
            if (response.data.total_count){ 
                user_url = response.data.repositories[0].owner.html_url; 
            }
            console.log(repo_array);                
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    async function postToMoralis(){
        var config = {
            method: "get",
            url: `${server_url}/functions/connectGithubRepo?_ApplicationId=${app_id}&spaceId=${space_id}&repo=${repo_array}`
        };
        await axios(config)
        .then(function (response) {
            console.log(response.data);
            repo_array.length = 0;
            tribe_id = response.data.result;
            tribe_id.slice(0,tribe_id.length);
        })
        .catch(function (error) {
            console.log(error);
        });
    }
})

app.get('/callback', function(req,res){

    const client_id = process.env.AUTH_CLIENT_ID;
    const client_secret = process.env.AUTH_CLIENT_SECRET;
    const code = req.query.code;

    let data, accessToken, githubId;

    console.log(code, state);

    linkGitHubUser();

    async function getUserAccessToken(){
        var config = {
            method: 'post',
            url: `https://github.com/login/oauth/access_token?client_id=${client_id}&client_secret=${client_secret}&code=${code}&redirect_uri=http://localhost:3000/`
        };
        await axios(config)
        .then(function (response) {
            data = response.data;
            accessToken = ((data.split('&',3))[0].split('=',2))[1];
            console.log(accessToken);
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    async function getUserId(){
        var config = {
            method: 'get',
            url: `https://api.github.com/user`,
            headers: { 'Authorization': `Bearer ` + `${accessToken}` }
        };
        await axios(config)
        .then(function (response) {
            console.log(response.data.login);
            githubId = response.data.login;
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    async function linkGitHubUser(){
        await getUserAccessToken();
        await getUserId();
        res.status(200).json({ github : githubId });
    }
})

app.listen(process.env.PORT || 8080, 
	() => console.log("Server is running..."));