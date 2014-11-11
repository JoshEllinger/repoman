$(document).ready(function () {
  console.log(document.getElementById("addUser"));

  //$('#createRepo, #addUser, #listRepos').hide();
  //oauth.io authentication
  OAuth.initialize('vMLd_AIdnpZtRPRH61n9z4j8RS8', {cache: true});

  /**
   * Initialization.
   */
  if (OAuth.create('github')) {
    console.log(OAuth.create('github'));
    $('.signIn').hide();
    $('#createRepo, #addUser, #listRepos').fadeIn();
    doEverything();
  } else {
    console.log(OAuth.create('github'));
    $('.signIn').fadeIn();
    $('#createRepo, #addUser, #listRepos').hide();
    $('.signIn').on('click', doEverything);
  }

  /**
   * After login.
   */
  function doEverything() {
    var access_token = '';
    OAuth.popup('github', {cache: true}, function (error, result) {
      console.log(error);
      console.log(result);
      access_token = result.access_token;
      //handle error with error
      //use result.access_token in your API request
      $('.signIn').hide();
      $('#createRepo, #addUser, #listRepos').fadeIn();

      //urls used in API calls
      var apiUrl = "https://api.github.com";
      var tokenUrl = '?access_token=' + result.access_token;
      var userUrl = apiUrl + '/user' + tokenUrl;
      var authRepoUrl = apiUrl + '/user/repos' + tokenUrl;
      var authAddUserUrl = apiUrl + '/user/match/collaborators' + tokenUrl;

      //display a string on the page
      function render(htmlString) {
        $('.repos').hide().append(htmlString).fadeIn();
      };

      //get authenticated repos
      function getRepo() {
        var promise = $.ajax({
          url: authRepoUrl,
          type: 'GET',
          data: {'sort': 'updated'}
        });
        return promise;
      }

      function parseRepo(repo){
        getRepoLanguage(repo.owner.login, repo.name).done(function (language_results) {
            //format the repos into buttons/links and checkboxes
            var output = '<div class="list-group-item"> ';
            output += '<a href=' + repo.html_url + ' class="btn btn-primary">';
            output += repo.name + '</a> ';
            output += '<ul>';
            for (var j in language_results) {
              output += '<li>' + j + ':' + language_results[j] + '</li>';
            }
            output += '</ul>';
            output += '<label class="btn btn-primary"> <input type="checkbox" id=' + repo.name + '> Add collaborator </label></div>';

            render(output);
          }
        );
      }

      getRepo().done(function (result) {
        var repos = "";
        for (var i = 0; i < result.length; i++) {
          parseRepo(result[i]);
        }
      });


      function getRepoLanguage(owner, repo) {
        var promise = $.ajax({
          url: apiUrl + '/repos/' + owner + '/' + repo + '/languages',
          type: 'GET',
          parameters: {
            access_token: access_token
          }
        });
        return promise;
      }

      //when create button is clicked, create a new repo and display it
      $(".create").on('click', function () {
        event.preventDefault();
        $.ajax(authRepoUrl, {
          type: 'POST',
          data: JSON.stringify({
            "name": $('.repoName').val()
          }),
          success: function (result) {
            //format the new repo into buttons/links and checkboxes
            var content = '<div class="list-group-item"> <a href=' + result.html_url + ' class="btn btn-primary">' + result.name + '</a> <label class="btn btn-primary"> <input type="checkbox" id=' + result.name + '> add collaborator </label></div>';

            $('.repos').prepend('<div class="list-group-item"> <a href=' + result.html_url + ' class="btn btn-primary">' + result.name + '</a> <label class="btn btn-primary"> <input type="checkbox" id=' + result.name + '> add collaborator </label></div>');

          }
        });
      });


      //add collaborator to repo(s) function
      function addCollaborator(userAdded, repo) {
        $.get(userUrl, function (user) {
          var addUserUrl = apiUrl + '/repos/' + user.login + '/' + repo + '/collaborators/' + userAdded + tokenUrl;
          $.ajax({
            url: addUserUrl,
            type: 'PUT',
            success: function (response) {
              //get new collaborator's gravatar from github
              $.get(apiUrl + '/users/' + userAdded, function (response) {
                $('#' + repo).closest('.list-group-item').children('img').hide();
                $('#' + repo).closest('.list-group-item').append('<img src=' + response.avatar_url + ' class="img-responsive img-circle" alt="user added">');
              });
            }
          });
        });
      };

      //when add button is clicked, add new user to repos
      $('.add').on('click', function () {
        event.preventDefault();
        var repos = $("input[type=checkbox]:checked");
        if (repos.length == 0) {
          $('.error').hide();
          $('#userName').append('<div class="error">check the repos to which you want to add a collaborator</div>').fadeIn();
        } else {
          for (var i = 0; i < repos.length; i++) {
            $('.error').hide();
            addCollaborator($('.userName').val(), repos[i].id);
          }
        }

      });
    });
  };
}); 