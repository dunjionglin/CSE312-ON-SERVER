function main(){
  getCurrentUsersData()
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
}
let currentUser;
function getCurrentUsersData(){
    $.ajax({  // ajax get current login users
    url: "/getCurrentUsers",
    type: "GET",
    dataType: "json",
    success: function (res){
      if(res=='false'){
        window.location="./"
      }
      console.log(res)
      currentUser=(res[3])
    }
    })
}



$.ajax({  // ajax for request new post data from server at path /posthis
    url: "/getProfileInformation",
    type: "GET",
    dataType: "json",
    success: function (res){
        console.log(res)
        if(res=='false'){
            window.location="./"
        }
        else{
            //res=JSON.parse(res)
            $("#first").val(res[0])
            $("#last").val(res[1])
            $('#useravatar').attr('src', res[2]);
            $('#user_fullname').text(res[0]+' '+res[1])
            $(".loader").hide()
        }
    }
  })
$("#first").on("change keyup paste", function(){
    if($("#first").val()!==""){
        $('#Save').prop('disabled', false);
    }
    else{
        $('#Save').prop('disabled', true);
    }
})
$("#last").on("change keyup paste", function(){
    if($("#last").val()!==""){
        $('#Save').prop('disabled', false);
    }
    else{
        $('#Save').prop('disabled', true);
    }
})

$( ".useravatar" ).click(function() {
    document.getElementById('profile_avatar').click();
});
$("#profile_avatar").change(function() {
    $('#Save').prop('disabled', false);
    readURL(this);
});
function readURL(input) { //when upload a file in post modal it will allow user to preview the image that they want to upload
    if (input.files && input.files[0]) { 
      var reader = new FileReader();
      
      reader.onload = function(e) {
        $('#useravatar').attr('src', e.target.result);
      }
      
      reader.readAsDataURL(input.files[0]); // convert to base64 string
    }
}
$( "#password_change" ).click(function() {
    const old_pw=$("#old_password").val()
    const pw1=$("#new_password1").val()
    const pw2=$("#new_password2").val()
    if(pw1 !== pw2){
        $("#success-box").hide();
        document.getElementById("pemote-fail").innerHTML="Password Didn't Match"
        document.getElementById('id02').style.display='block'
    }
    else{
    $.ajax({  // ajax for request new post data from server at path /posthis
        type:'POST',
        contentType:'application/json',
        url:'./updatePassword',
        data:JSON.stringify(
          {
            old_pw:old_pw,
            pw:pw1
          }
        ),
        success: function (res){
            console.log(res)
            if(res=='false'){
                $("#success-box").hide();
                document.getElementById("pemote-fail").innerHTML="Old PW Incorrect!"
                document.getElementById('id02').style.display='block'
            }
            else{
                window.location="./profile"
            }
        }
      })
    }
});