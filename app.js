require('dotenv').load();
const express = require('express')
const app = express()


var bodyParser = require('body-parser')

app.use(bodyParser.json());

const vsts = require("vso-node-api");

const collectionURL = process.env.COLLECTIONURL;    
const token = process.env.TOKEN;
console.log(collectionURL);

var authHandler = vsts.getPersonalAccessTokenHandler(token);
var connection = new vsts.WebApi(collectionURL, authHandler);

var vstsGit = connection.getGitApi();

app.get('/', function (req, res) {
   res.send('Hello World!')
})

app.listen(3000, function () {
   console.log('Example app listening on port 3000!')
})

app.post('/', function (req, res) {
     // Get the details about the PR from the service hook payload
     var repoId = req.body.resource.repository.id;
     var pullRequestId = req.body.resource.pullRequestId;
     var title = req.body.resource.title;
     var projectId = req.body.resource.projectId;
 
     // Build the status object that we want to post.
     // Assume that the PR is ready for review...
     var prStatus = {
         "state": "succeeded",
         "description": "Ready for review",
         "targetUrl": "http://www.visualstudio.com",
         "context": {
             "name": "wip-checker",
             "genre": "continuous-integration"
         }
     }
 
     // Check the title to see if there is "WIP" in the title.
     if (title.includes("WIP")) {
         // If so, change the status to pending and change the description.
         prStatus.state = "pending";
         prStatus.description = "Work in progress"
     }
 
     // Check the title to see if there is "error" in the title.
     if (title.includes("error")) {
        prStatus.state = "error";
        prStatus.description = "This does not look okay..."
     }

    // Post the status to the PR
    vstsGit.createPullRequestStatus(prStatus, repoId, pullRequestId).then( result => {
        console.log(result);
    });

    var comments = {
        "comments": [
        {
            "content": "I like your *code* style!",
            "commentType" : 1,
            "parentCommentId" : 0
        }], 
        "properties": {
            "Microsoft.TeamFoundation.Discussion.SupportsMarkdown": {
                "type": "System.Int32",
                "value": 1
            }
        },
        "status": 1
    }

    vstsGit.createComment(comments, repoId, pullRequestId, 0, projectId).then( result => {
        console.log(result);
    }).catch(result => {
        console.log(result);
    })
    
    res.send("Received the POST");

})

