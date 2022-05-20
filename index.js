const app = require('express')();
const axios = require('axios');
require('dotenv').config();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const server_url = process.env.MORALIS_SERVER_ID;
const app_id = process.env.MORALIS_APPLICATION_ID;
const redirect_url = 'http://localhost:3000/probot';

let accessToken, data;
let repo_array = [];

app.get('/probot', function(req, res){

  const code = req.query.code;
  const installation_id = req.query.installation_id;
  const setup_action = req.query.setup_action;
  const space_id = req.query.state;

  console.log(code, installation_id, setup_action, space_id);

  if (setup_action === 'install'){

    getAccessToken();
    
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
            getRepo();
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
            console.log(repo_array);
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    // async function postToMoralis(){
    //     var config = {
    //         method: "get",
    //         url: `${server_url}/functions/githubUpdateCard?_ApplicationId=${app_id}&repo=${repo_array}
    //     };
    //     await axios(config)
    //     .then(function (response) {
    //         console.log(response.data);
    //     })
    //     .catch(function (error) {
    //         console.log(error);
    //     });
    // }
  }
   res.redirect('https://tribes.spect.network/');
})

app.listen(3000, function(){
   console.log("yay, server is running.......");
})