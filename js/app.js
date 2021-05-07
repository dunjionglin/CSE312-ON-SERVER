const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");
$("#register").hide()
$("#login").show()
sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
  $("#register").show()
  $("#login").hide()
});
sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
  $("#register").hide()
  $("#login").show()
});
$(".sign-up-form").submit(function(e) {
  e.preventDefault();
});
$(".sign-in-form").submit(function(e) {
  e.preventDefault();
});

var code = document.getElementById("reg_password");

var strengthbar = document.getElementById("meter");
var display = document.getElementsByClassName("textbox")[0];

let dict={
  lowercase:false,
  uppercase:false,
  number:false,
  spicalCharacter:false
}
code.addEventListener("keyup", function() {
  dict.lowercase=false;
  dict.uppercase=false;
  dict.number=false;
  dict.spicalCharacter=false;
  checkpassword(code.value,dict);
  console.log(dict.lowercase);
});




$( "#login" ).click(function() {
  const username=$("#username").val()
  const password=$("#password").val()
  allInputed=true;
  let message="";
  if(username==""){
    message="Please input Username"
    allInputed=false;
  }
  else if(password==""){
    message="Please input Password"
    allInputed=false;
  }
  if(allInputed){
    $.when(
      $.ajax({
          type:'POST',
          contentType:'application/json',
          url:'./login',
          data:JSON.stringify(
              {
                  username:username,
                  password:password,
              }
          ),
          success: function(data){
              console.log(data)
              if(data=='true'){
                window.location="./home"
              }
              else{
                  document.getElementById("pemote-fail").innerHTML = "Username or Password Incorrect";
                  $('#error-box').show();
                  $('#success-box').hide();
                  document.getElementById('id01').style.display='block';
              }
          }
      })
  )
  }
  else{
    $("#success-box").hide();
    document.getElementById("pemote-fail").innerHTML=message
    document.getElementById('id01').style.display='block'
  }
});

$( "#register" ).click(function() {
  allInputed=true;
  let message="";
  const username=$("#reg_username").val()
  const first=$("#first").val()
  const last=$("#last").val()
  const password=$("#reg_password").val()
  console.log(username)
  if(username==""){
    message="Please input Username"
    allInputed=false;
  }
  else if(first==""){
    message="Please input First Name"
    allInputed=false;
  }
  else if(last==""){
    message="Please input Last Name"
    allInputed=false;
  }
  else if(password==""){
    message="Please input Password"
    allInputed=false;
  }
  else if(!dict.lowercase){
    message="Password Must Contain a Lower Case Character"
    allInputed=false;
  }
  else if(!dict.uppercase){
    message="Password Must Contain a Upper Case Character"
    allInputed=false;
  }
  else if(!dict.number){
    message="Password Must Contain a number"
    allInputed=false;
  }
  else if(!dict.spicalCharacter){
    message="Password Must Contain a Special Character"
    allInputed=false;
  }
  else if(!dict.spicalCharacter){
    message="Password Must Contain a Special Character"
    allInputed=false;
  }
  else if(password.length<8){
    message="Password Must With Min 8 Character"
    allInputed=false;
  }
  if(allInputed){ //if all requirment met
    $.when(
      $.ajax({
          type:'POST',
          contentType:'application/json',
          url:'./register',
          data:JSON.stringify(
              {
                  username:username,
                  password:password,
                  first:first,
                  last:last,
              }
          ),
          success: function(data){
              console.log(data)
              if(data=='true'){
                  $('#error-box').hide();
                  $('#success-box').show();
                  document.getElementById('id01').style.display='block';
              }
              else{
                  document.getElementById("pemote-fail").innerHTML = "Username has been already registered";
                  $('#error-box').show();
                  $('#success-box').hide();
                  document.getElementById('id01').style.display='block';
              }
          }
      })
  )
  }
  else{
    $("#success-box").hide();
    document.getElementById("pemote-fail").innerHTML=message
    document.getElementById('id01').style.display='block'
  }
});

$('.success-button-box').on('click', function() {
  window.location="./"
})

// document.addEventListener("keyup", function(event) {
//   // Number 13 is the "Enter" key on the keyboard
//   if (event.keyCode === 13) {
//     // Cancel the default action, if needed
//     event.preventDefault();
//     // Trigger the button element with a click
//     if($( "#register" ).is(":visible")){
//       document.getElementById("register").click();
//     }
//     else{
//       document.getElementById("login").click();
//     }
//   }
// });

function checkpassword(password,dict) {
  if (password.match(/[a-z]+/)) {
    dict.lowercase=true;
  }
  if (password.match(/[A-Z]+/)) {
    dict.uppercase=true;
  }
  if (password.match(/[0-9]+/)) {
    dict.number=true;
  }
  if (password.match(/[$@#&!]+/)) {
    dict.spicalCharacter=true;
  }
}