const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');


const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app =  express();

function setResponse(username,repos){
    return `<h2>${username} has ${repos} github repose</h2>`
}

const getRepos =  async(req,res,next)=>{
    try{
        console.log("Fetching Data .....");

        const {username} = req.params;

        const response = await fetch(`https://api.github.com/users/${username}`);

        const data = await response.json()

        // console.log(data);
        
        const repos = data.public_repos;

        // Set data to redis
        client.setex(username,30,repos);
        res.send(setResponse(username,repos));
    }
    catch(err){
        console.error(err);
        res.status(500);
    }
}

// Cache Middlewire
function cache(req,res,next){
    const {username} = req.params;

    client.get(username ,(err,data)=>{
        if (err) throw err;

        if(data != null){
            res.send(setResponse(username,data));
        }
        else{
            next();
        }

    })
}

app.get("/repos/:username",cache,getRepos);

app.listen(5000,()=>{
  console.log(`App listening on port ${PORT}`);  
})