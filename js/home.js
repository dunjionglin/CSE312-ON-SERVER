

let socket
function main(){
  $("#blah").hide()
  $("#chat").hide()
  $("#clear_image").hide()
  $('#container').hide()
  getCurrentUsersData()
  setTimeout(function(){$('.loader').hide();$('#container').show()},1000);
  socket = io.connect('http://' + document.domain + ':' + location.port); //flask socket io
  socket.on( 'connect', function() { //send message from server
    socket.emit( 'joined', {
      data: currentUser
    })
  })
  socket.on( 'disconnect', function() { //send message from server
    socket.emit( 'disconnect', {
      data: currentUser
    })
  })
  $( "#search" ).click(function() { //serach user
    document.getElementById('searchModal').style.display='block'
    search_name = $( "#search_friend_text").val();
    socket.emit('find_friend', { sname: search_name, user: currentUser})  // send search name to socket "find_friend"
  });
  
  socket.on( 'find_friend_result', function (msg){
    if(msg=="Not Found" || msg=="Found yourself"){
      $("#search_result").append(
        '<div id="rcorners_posted" style="width: 30%; min-height: 15vh; margin-left: auto; margin-right: auto; margin-top: auto; margin-bottom: auto; ">'+
        '<p style="text-align: center;">'+msg+'</p>'+
        '</div>'
      )
    }
    else{
      msg=JSON.parse(msg)
      $("#search_result").append(
        '<div id="rcorners_posted" style="width: 30%; min-height: 15vh; margin-left: auto; margin-right: auto; margin-top: auto; margin-bottom: auto; ">'+
        '<p style="display: inline-block; float: left; margin-top: 6%;"><img class="userIcons " src="'+msg[2]+'" alt="" id="'+msg[3]+'" />  '+msg[0]+' '+msg[1]+' </p><br><br>'+
        '<button type="button" id="'+msg[3]+'" class="btn btn-dark add_friend_button" style="display: inline-block; float: right;">Add Friend</button>'+
        '</div>'
      )
    }
  })
  socket.on( 'updateNotificationCount', function (msg){
    // console.log(msg)
    $("#lblCartCount").text(msg)
    if(msg ==0){
      setTimeout(function(){
      document.getElementById("requestModal").style.display="none"
      $("#request_result").empty()
      },500)
    }
  })
  socket.on('updatedProfile', function (msg){
    msg=JSON.parse(msg);
    let avatar=""
    if(msg[3]==""){
      avatar=$(".friend_list #"+msg[0]+" .userIcons").attr("src");
    }
    else{
      avatar=msg[3]
    }
    console.log(msg, ".friend_list #"+msg[0]+" .userIcons")
    $(".friend_list #"+msg[0]).empty()
    $(".friend_list #"+msg[0]).append(
      '<img class="userIcons " src="'+avatar+'" alt="" />'+msg[1]+' '+ msg[2] +'<p class="online">●</p><p class="unread_message">●</p><br><br></br>'
    )
  })
  socket.on( 'updatedProfileMySelf', function (){
    location.reload();
  })
  socket.on( 'logAllTabOut', function (){
    window.location="./"
  })
  socket.on( 'friendDisconnect', function (msg){
    msg=JSON.parse(msg)
    //$("#oneline_firend #"+msg).empty()
    $("#oneline_firend #"+msg+" p").removeClass("online").addClass('offline');
    $("#offline_firend").append(
      $("#oneline_firend #"+msg)
    )
    $("#oneline_firend #"+msg).empty()
  })
  socket.on( 'friendConnect', function (msg){
    msg=(msg)
    //$("#oneline_firend #"+msg).empty()
    $("#offline_firend #"+msg+" p").removeClass("offline").addClass('online');
    $("#oneline_firend").append(
      $("#offline_firend #"+msg)
    )
    $("#offline_firend #"+msg).empty()
  })
  socket.on('send_to_js',function(data){  // received DM append to chat-content
    let currentdate = new Date();
    let datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
    // console.log("here")//
    // console.log(data);
    let sender = JSON.parse(data);
    let message = sender[Object.keys(sender)[0]];
    let avatar = sender["avatar"];
    // console.log(avatar)
    sender = "#" + Object.keys(sender)[0];
    // console.log(sender);
    // console.log(message);
    $(sender + " .unread_message").attr("style", "display: show");
    $("#chat-content").append('<div class="media media-chat">\n' +
        '<div class="media media-chat"><img class="avatar" src="'+ avatar +'" alt="...">' +
        '<div class="media-body">\n' +
        '<p>' + message +'</p>\n' +
        '<p class="meta"><time datetime="2018">' + datetime+ '</time></p>\n' +
        '</div>\n' +
        '</div>');
        var elem = document.getElementById('chat-content'); 
  elem.scrollTop = elem.scrollHeight; //scroll chat to bottom of the page
  })

}

$( ".notification" ).click(function() { //when user click bell notification
  $.ajax({
    type:'POST',
    contentType:'application/json',
    url:'./getFriendRequest',
    data:JSON.stringify(
      {
        currentUser:currentUser
      }
    ),
    success: function(res) {
      res=JSON.parse(res)
      if(res.length>0){
        for(let i=res.length-1;i>=0;i--){
          $("#request_result").append(
            '<div id="'+res[i][0]+'" style="width: 30%; min-height: 20vh; margin-left: auto; margin-right: auto; margin-top: auto; margin-bottom: auto; " class="rcorners_posted animate__animated animate__lightSpeedInLeft">'+
            '<p style="display: inline-block; float: left; margin-top: 6%;"><img class="userIcons " src="'+res[i][2]+'" alt="" id="'+res[i][0]+'" />  '+res[i][1]+' </p><br><br>'+
            '<button type="button" id="'+res[i][0]+'" class="btn btn-dark accept_friend_button" style="display: inline-block; float: right;">Add Friend</button><br><br>'+
            '<button type="button" id="'+res[i][0]+'" class="btn btn-danger rej_friend_button" style="display: inline-block; float: right;">Reject</button>'+
            '</div><br><br>'
          )
        }
        document.getElementById('requestModal').style.display='block'
      }
      else{
        $("#request_result").append(
          '<div id="rcorners_posted" style="width: 30%; min-height: 15vh; margin-left: auto; margin-right: auto; margin-top: auto; margin-bottom: auto; ">'+
          '<p style="text-align: center;">'+"Seems like you have no notification check back later!"+'</p>'+
          '</div>'
      )
      document.getElementById('requestModal').style.display='block'

      }
    }
  });
  
});

$(document).on('click', '.friend_click', function(e) {//when click friend list one of the friend
  let currentdate = new Date();
    let datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
  const name=$(this).attr("id").split("-")[0] //get his first name
  const id=$(this).attr("id").split("-")[1] //get his id
  // console.log(name)
  $("#chat").hide()//hide previous chat
  $(".card-title").text("Chat with "+name) //chat text update for example chat with Tianyu Chen
  const htmlId=$(this).attr("id") //get click id
  $('#'+htmlId+' .unread_message').hide() //hide click id
  $("#chat").show()//show the chat
  $('.loader_chat').show() //show the loader of chat 
  setTimeout(function(){$('.loader_chat').hide();},555); //hide loader
      var elem = document.getElementById('chat-content'); 
      elem.scrollTop = elem.scrollHeight; //scroll chat to bottom of the page
  const friend = $(this).attr("id");
  $("#post_chat").click(function (){  // send DM to friend
  // console.log("here");
  let friendMeg = $(".publisher-input").val();
  $("#chat-content").append('<div class="media media-chat media-chat-reverse">\n' +
        '<div class="media-body">\n' +
        '<p>' + friendMeg +'</p>\n' +
        '<p class="meta"><time datetime="2018">' + datetime+ '</time></p>\n' +
        '</div>\n' +
        '</div>');
  socket.emit('send_to_friend', {friendName: friend, sentMeg: friendMeg})
  // console.log(friendMeg);
  $(".publisher-input").val("");
  var elem = document.getElementById('chat-content'); 
  elem.scrollTop = elem.scrollHeight; //scroll chat to bottom of the page
})
})
$(document).ready(function(){
  $('.publisher-input').keypress(function(e){
    if(e.keyCode==13)
    $('#post_chat').click();
  });
});
$(document).ready(function(){
  $('#search_friend_text').keypress(function(e){
    if(e.keyCode==13)
    $('#search').click();
  });
});
$( "#close_chat" ).click(function() {//when user click X on the top right chat
  document.getElementById("chat").className = "card card-bordered animate__animated animate__fadeOutDown"; //add animation 
  setTimeout(function() {
      $("#chat").hide() //hide the chat
      document.getElementById("chat").className = "card card-bordered animate__animated animate__fadeInUp"; //update back the chat class
  }, 1000);
});
$( "#post_upload" ).click(function() { //when user click post upload in post modal
  document.getElementById('post_upload_file').click(); //click the post upload file will let user to input their file
});
$( "#chat_upload" ).click(function() {//when user click post upload in chat
  document.getElementById('chat_upload_file').click(); //click the post upload file will let user to input their file
});


function readURL(input) { //when upload a file in post modal it will allow user to preview the image that they want to upload
  if (input.files && input.files[0]) { 
    var reader = new FileReader();
    
    reader.onload = function(e) {
      $('#blah').attr('src', e.target.result);
      $("#blah").show()
      $("#post_upload").hide()
      $("#clear_image").show()//if user dont want to upload that image this will allow user to clear image that they upload
    }
    
    reader.readAsDataURL(input.files[0]); // convert to base64 string
  }
}

$("#post_upload_file").change(function() {
  readURL(this);
});
$( "#clear_image" ).click(function() { //when user click clear image
  $("#post_upload_file").val("");
  $("#blah").hide()
  $("#clear_image").hide()
  $("#post_upload").show()
});
$( "#post" ).click(function() { //will user click post on post modal
  document.getElementById('post_submit').click(); //it will click the post button
});

$(document).on('click', '.pop_post_image', function(e) {//will user firend's post on post
console.log($(this).find('img').attr('src')) //open image modal and let user to view bigger images
$('#img01').attr('src', $(this).find('img').attr('src'));
document.getElementById("postModal").style.display = "block";

});


$.ajax({  // ajax for request new post data from server at path /posthis
  url: "/posthis",
  type: "GET",
  dataType: "json",
  success: function (res){
    let avatar=res[1]
    res=res[0];
    // console.log(avatar)
    for(let i=res.length-1;i>=0;i--){
      // console.log(res[i]);
      $("#post_center").append(
        '<div id="rcorners_posted">'+
        '<a ><img class="userIcons " src="'+avatar[i]+ '" alt="" id="'+res[i][1]+'"/> '+ res[i][2]+'<br><br> '+res[i][3] +'</a><br><hr><br>'+
        '<p>'+res[i][4]+'</p>'+
        '<a class="pop_post_image">'+
            '<img src="'+res[i][5]+'" id="post_image">'+
        '</a>      '+      
    '</div><br><br>'
        )
    }

  }
})

let currentUser=""
function getCurrentUsersData(){
$.ajax({  // ajax get current login users
url: "/getCurrentUsers",
type: "GET",
dataType: "json",
success: function (res){
  if(res=='false'){
    window.location="./"
  }
  // console.log(res)
  $('#rcorners_toPost').append(
    '<img class="userIcons " src="'+res[2]+'" alt="" id="'+res[3]+'" style="display: inline-block; float: left;"/>'+
     '<button type="button" onclick="document.getElementById(\'id01\').style.display=\'block\'" class="btn btn-dark" id="post_social" style="width:93%;height: 60px; display: inline-block; float: right;border-radius: 15px;">What\'s in your mind?</button>'
  )
  $('#owner_post').append(
    '<img class="userIcons " src="'+res[2]+'" alt="" id="'+res[3]+'"/>  '+res[0]+' '+res[1]+''
  )
  currentUser=(res[3])
  $("#lblCartCount").text(res[4])
  getCurrentUsersFriend()
}
})
}

function getCurrentUsersFriend(){
  // console.log(currentUser)
  $.ajax({
    type:'POST',
    contentType:'application/json',
    url:'./getFriend',
    data:JSON.stringify(
      {
        currentUser:currentUser
      }
    ),
    success: function(res) {
      if(res=='false'){
        window.location="./"
      }
      res=JSON.parse(res)
      for(let i in res){
        // console.log(res[i],i)
        if(res[i].logged==1){
          $("#oneline_firend").append(
            '<a class="friend_click" id="'+i+'"><img class="userIcons " src="'+res[i].avatar+'" alt="" />  '+res[i].name+' <p class="online">●</p><p class="unread_message">●</p><br><br></a>'
          )
        }
        else if(res[i].logged==0){
          $("#offline_firend").append(
            '<a class="friend_click" id="'+i+'"><img class="userIcons " src="'+res[i].avatar+'" alt="" />  '+res[i].name+' <p class="offline">●</p><p class="unread_message">●</p><br><br></a>'
          )        }
      }
    }
  });
}

function signOut(){
$.ajax({
  type:'POST',
  contentType:'application/json',
  url:'./logout',
  data:JSON.stringify(
  ),
  success: function(res) {
      if(res=="true")
      {          
        socket.emit('signoutAll', { currentUser:currentUser})  // send message count to update if multi tab open
      }
  }
});
}

$(document).on('click', '.add_friend_button', function(e) {//When user click add friend
  // console.log($(this).attr("id"))
  const id=$(this).attr("id")
  $.ajax({
    type:'POST',
    contentType:'application/json',
    url:'./addFriendRequest',
    data:JSON.stringify(
      {
        currentUser:currentUser,
        user:$(this).attr("id")
      }
    ),
    success: function(res) {
      // console.log(res)
      if(res=='true'){
        document.getElementById('searchModal').style.display='none';
        $('#search_result').empty()
        socket.emit('update_notification_add_friend', { requestUserId:id})  // send message count to update if multi tab open
        
      }
      else{
        $("#search_result").append(
          '<div id="rcorners_posted" style="width: 30%; min-height: 15vh; margin-left: auto; margin-right: auto; margin-top: auto; margin-bottom: auto; ">'+
          '<p style="text-align: center;">'+"You already have a friend request sended"+'</p>'+
          '</div>'
        )
      }
    }
  });
});


$(document).on('click', '.accept_friend_button', function(e) {//When user click add friend
  const id=$(this).attr("id")
  $.ajax({
    type:'POST',
    contentType:'application/json',
    url:'./friendRequestUpdate',
    data:JSON.stringify(
      {
        currentUser:currentUser,
        user:$(this).attr("id"),
        status:"accept"
      }
    ),
    success: function(res) {
      // console.log(res)
      if(res=='true'){
        $("#request_result #"+ id).removeClass('rcorners_posted animate__animated animate__lightSpeedInLeft').addClass('animate__animated animate__lightSpeedOutRight');
        const lblCount=$("#lblCartCount").text()-1
        socket.emit('Sending_count', { currentUser:currentUser, data:lblCount})  // send search name to socket "find_friend"
      }
    }
  });
});
$(document).on('click', '.rej_friend_button', function(e) {//When user click add friend
  const id=$(this).attr("id")
  $.ajax({
    type:'POST',
    contentType:'application/json',
    url:'./friendRequestUpdate',
    data:JSON.stringify(
      {
        currentUser:currentUser,
        user:$(this).attr("id"),
        status:"reject"
      }
    ),
    success: function(res) {
      // console.log(res)
      if(res=='true'){
        $("#request_result #"+ id).removeClass('rcorners_posted animate__animated animate__lightSpeedInLeft').addClass('animate__animated animate__lightSpeedOutRight');
        const lblCount=$("#lblCartCount").text()-1
        socket.emit('Sending_count', { currentUser:currentUser, data:lblCount})  // send message count to update if multi tab open

      }
    }
  });
});