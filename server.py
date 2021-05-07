from flask import Flask, render_template, request, redirect, url_for, flash, make_response  # pip install Flask
import os
import bcrypt
import random
import hashlib
import mysql.connector
import datetime as DT
import string
import random
import json
from flask_socketio import SocketIO

# pip install -r requirement.txt for all dependencies.
psword = "example"
host = 'mysqldb'

def gen_salt():
    new_salt = "".join(random.choices(string.ascii_letters + string.digits, k=26))
    return new_salt


def replaceHtmlTag(input):
    input = input.replace("&", "&amp;")
    input = input.replace("<", "&lt;")
    input = input.replace(">", "&gt;")
    return input


# set the project root directory as the static folder, you can set others.
app = Flask(__name__,
            static_url_path='',
            static_folder='.',  # . means current directory
            template_folder='.')
app.config['SECRET_KEY'] = 'dsiofjosjigregi0!@#@##'
socketio = SocketIO(app)


sql = mysql.connector.connect(user='root', password=psword,
                              host=host)
mycursor = sql.cursor(buffered=True)
mycursor.execute("create database if not exists chato")


sql = mysql.connector.connect(user='root', 
                              password=psword,
                              host=host,
                              database="chato",
                              )
mycursor = sql.cursor(buffered=True)
mycursor.execute("create table IF NOT EXISTS users (" + "ID int unique NOT NULL AUTO_INCREMENT," + "username varchar(500) unique Not NULL," + "first varchar(500) Not null," + "last varchar(500) Not null," + "password varchar(500) Not null," + "avatar varchar(500) Not null," + "salt varchar(500) Not null," + "status varchar(500) Not null" + ")")
mycursor.execute("create table IF NOT EXISTS posts (" + "ID int unique NOT NULL AUTO_INCREMENT," + "iconsrc varchar(500) unique Not NULL," + "iconid varchar(500) Not null," + "username varchar(500) Not null," + "posttime varchar(500) Not null," + "postmess varchar(500) Not null," + "postimgsrc varchar(500) Not null)")
mycursor.execute("create table IF NOT EXISTS friend_table (" + "ID int unique NOT NULL AUTO_INCREMENT," + "userId varchar(500) Not null," + "friendId varchar(500) Not null" + ")")
mycursor.execute("create table IF NOT EXISTS friend_request (" + "ID int unique NOT NULL AUTO_INCREMENT," + "userId varchar(500) Not null," + "requestId varchar(500) Not null," + "acceptStatus varchar(100) Not null" + ")")

@app.route('/')
def serve_index():
    resp = request.cookies.get('username')
    print(resp)
    if resp != None:
        return redirect("/home")
    else:
        return render_template("/index.html")


@app.route('/home')
def serve_home():
    return render_template("/home.html")


@app.route('/profile')
def profile_page():
    return render_template("/profile.html")


@app.route('/login', methods=["POST"])  # when user login
def login():
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    body = request.json  # front end will pass all the information.
    for i in body:  # replace all htmltag
        body[i] = replaceHtmlTag(body[i])
    # print(body)
    username = hashlib.sha256(body['username'].encode()).hexdigest()
    exists = "SELECT * FROM users WHERE username = %s"  # " AND password =%s"
    entry = (username,)  # ,password
    mycursor.execute(exists, entry)
    result = mycursor.fetchone()
    if result:  # if user exits, check password with salt
        password = hashlib.sha256((body['password'] + result[6]).encode()).hexdigest()
        if not password == result[4]:
            result = None
    if result != None:  # if has registered before tell frontend it has been register
        sql.close()
        resp = make_response("true")
        resp.set_cookie('username', username, max_age=60 * 60 * 24 * 10)  # add 10day cookie
        return resp
    else:
        return 'false'


@app.route('/register', methods=["POST"])  # when user register
def register():
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    body = request.json  # front end will pass all the information.
    for i in body:  # replace all htmltag
        body[i] = replaceHtmlTag(body[i])
    # print(body)
    exists = "SELECT * FROM users WHERE username = %s"  # check if username or phone number has been registered before
    entry = (hashlib.sha256(body['username'].encode()).hexdigest(),)
    mycursor.execute(exists, entry)
    result = mycursor.fetchone()
    if result != None:  # if has registered before tell frontend it has been register
        sql.close()
        return 'false'
    else:
        insert = "INSERT INTO users (username,password,first,last,avatar,salt,status) VALUES (%s, %s,%s,%s,%s,%s,%s)"
        # print(hashlib.sha256(body['username'].encode()).hexdigest())
        new_salt = gen_salt()
        entry = (hashlib.sha256(body['username'].encode()).hexdigest(),
                 hashlib.sha256((body['password'] + new_salt).encode()).hexdigest(), body['first'], body['last'],
                 "null", new_salt, "0")  # set  entry
        mycursor.execute(insert, entry)  # insert into DB
        sql.commit()
        sql.close()
        return 'true'


@app.route('/upload', methods=["POST"])  # handle post with caption/image need to create posted to display on home
def uploadPost():
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    upload = request.files.to_dict()['post_filename']
    # print(upload)
    caption = request.form.to_dict()["caption"]  # get data from form
    caption = replaceHtmlTag(caption)
    user_name = request.cookies.get('username')
    mycursor.execute("SELECT * FROM users WHERE username = %s", (user_name,))
    user_info = mycursor.fetchone()
    # print(user_info)
    # icon_src = user_info[5]  # avatar for profile icon
    icon_id = user_info[2] + "-" + str(user_info[0])
    post_username = user_info[2] + " " + user_info[3]
    post_time = str(DT.datetime.now().strftime("%D @ %H:%M"))
    # print("file upload: " + str(upload))
    # print("form upliad: " + str(caption))
    if upload != None:  # if condiction need to update to include only form upload
        save_path = "./img"
        file_name = upload.filename + str(random.randint(0, 1000000 * 100))
        hashed_file_name = hashlib.sha256(file_name.encode()).hexdigest()
        # print(hashed_file_name)
        fileType = upload.filename.split(".")[-1]
        file_path = "{path}/{file}".format(path=save_path, file=hashed_file_name + '.' + fileType)
        # print(file_path)
        upload.save(file_path)
        insert = "INSERT INTO posts (iconid, username, posttime, postmess, postimgsrc) VALUES (%s,%s,%s,%s,%s)"
        entry = (icon_id, post_username, post_time, caption, file_path)  # put all post data into posts table
        mycursor.execute(insert,
                         entry)  # entry = ('try-1', 'try it', '04/14/21 @ 23:08', 'fasdfasdfasdf', './img/38c7c3cddfb654b34ef3ba455e015818c7b09defa3b56d28349b1a9d5d4a466d.png')
        # print(entry)
        sql.commit()
        sql.close()
        return redirect("/home")
        # print(upload.file)


@app.route('/changeProfile',
           methods=["POST"])  # handle post with caption/image need to create posted to display on home
def changeProfile():
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    upload = request.files.to_dict()['profile_avatar']
    # print(upload.filename=="")
    first = request.form.to_dict()["first"]  # get data from form
    first = replaceHtmlTag(first)
    last = request.form.to_dict()["last"]  # get data from form
    last = replaceHtmlTag(last)
    # print(first,last)
    # user_name = request.cookies.get('username')
    # mycursor.execute("SELECT * FROM users WHERE username = %s", (user_name,))
    # user_info = mycursor.fetchone()
    # print(user_info)
    # icon_src = user_info[5]  # avatar for profile icon
    # icon_id = user_info[2] + "-" + str(user_info[0])
    # post_username = user_info[2] + " " + user_info[3]
    # post_time = str(DT.datetime.now().strftime("%D @ %H:%M"))
    # print("file upload: " + str(upload))
    # print("form upliad: " + str(caption))
    if upload != None:  # if condiction need to update to include only form upload
        res = request.cookies.get('username')
        exists = "SELECT * FROM users WHERE username=%s"
        entry = (res,)
        mycursor.execute(exists, entry)
        current = mycursor.fetchone()
        id = current[0]
        firstIn = current[2]
        currentUserId = firstIn + '-' + str(id)
        modifyAvatar = ""
        if (upload.filename == ""):  # if user didnt update their avatar
            update = "UPDATE users SET first = %s, last=%s where username=%s;"
            entry = (first, last, res)  # put all post data into posts table
            # print(entry,"didnt upload img")
            mycursor.execute(update, entry)
        else:
            save_path = "./img"
            file_name = upload.filename + str(random.randint(0, 1000000 * 100))
            hashed_file_name = hashlib.sha256(file_name.encode()).hexdigest()
            # print(hashed_file_name)
            fileType = upload.filename.split(".")[-1]
            file_path = "{path}/{file}".format(path=save_path, file=hashed_file_name + '.' + fileType)
            # print(file_path)
            upload.save(file_path)
            update = "UPDATE users SET first = %s, last=%s, avatar =%s  where username=%s;"
            entry = (
            first, last, "./img/" + hashed_file_name + '.' + fileType, res)  # put all post data into posts table
            modifyAvatar = "./img/" + hashed_file_name + '.' + fileType
            # print(entry,"upload img")
            mycursor.execute(update, entry)
        # print(currentUserId)
        mycursor.execute("SELECT * FROM friend_table where friendId=%s", (currentUserId,))
        friends = mycursor.fetchall()
        friendList = []
        for i in friends:
            friendList.append(i[1])
        for i in friendList:
            if i in clients:
                for j in clients[i]:
                    socketio.emit('updatedProfile', json.dumps([currentUserId, first, last, modifyAvatar]), room=j)
        for i in clients[currentUserId]:
            # print(i)
            socketio.emit('updatedProfileMySelf', room=i)
        sql.commit()
        sql.close()
        return redirect("/profile")
        # print(upload.file)


@app.route('/updatePassword', methods=["POST"])
def updatePassword():
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    body = request.json
    res = request.cookies.get('username')
    exists = "SELECT * FROM users WHERE username=%s"
    entry = (res,)
    mycursor.execute(exists, entry)
    user = mycursor.fetchone()
    userCurrentPassword = user[4]
    # check if password match
    # if yes return true update password
    # if false return false.
    return json.dumps("false")


@app.route('/getProfileInformation')  # send all posts data back to front-end
def getProfileInformation():  # one issue, since not icon profile scr, will have duplicate entry in db with null
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    res = request.cookies.get('username')
    if res == None:
        return json.dumps("false")
    exists = "SELECT * FROM users WHERE username=%s"
    entry = (res,)
    mycursor.execute(exists, entry)
    user = mycursor.fetchone()
    # print(user)
    avatar = user[5]
    if avatar == 'null':
        avatar = "./img/users.jpg"
    return json.dumps([user[2], user[3], avatar])


@app.route('/hello')  # use for testing if cookie if correct or not
def hello():
    res = request.cookies.get('username')
    return res


@app.route('/posthis')  # send all posts data back to front-end
def send_post_his():  # one issue, since not icon profile scr, will have duplicate entry in db with null
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    mycursor.execute("SELECT * FROM posts")
    icons = []
    post_raw = mycursor.fetchall()
    for i in post_raw:
        first = i[1].split("-")[0]
        id = i[1].split("-")[1]
        exists = "SELECT * FROM users WHERE first=%s and id=%s"
        entry = (first, id)
        mycursor.execute(exists, entry)
        user = mycursor.fetchone()
        if user[5] == 'null':
            icons.append("./img/users.jpg")
        else:
            icons.append(user[5])
    # print(post_raw)
    return json.dumps([post_raw, icons])


@app.route('/getCurrentUsers')  # send all posts data back to front-end
def getCurrent():  # one issue, since not icon profile scr, will have duplicate entry in db with null
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    res = request.cookies.get('username')
    if res == None:
        return json.dumps("false")
    mycursor.execute("SELECT * FROM users where username=%s", (res,))
    user = mycursor.fetchone()
    avatar = user[5]
    if user[5] == 'null':
        avatar = "./img/users.jpg"
    id = user[2] + '-' + str(user[0])
    # get friend request
    exists = "SELECT * FROM friend_request WHERE requestId =%s"
    entry = (id,)
    mycursor.execute(exists, entry)
    users = mycursor.fetchall()
    # print(users, res)
    notification = 0
    for i in users:
        if i[3] == "pending":
            notification += 1
    sql.close()
    return json.dumps([user[2], user[3], avatar, id, notification])


@app.route('/getFriend', methods=["POST"])  # send all posts data back to front-end
def getFriend():  # one issue, since not icon profile scr, will have duplicate entry in db with null
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    res = request.cookies.get('username')
    if res == None:
        return json.dumps("false")
    body = request.json
    # print(body)
    current = body["currentUser"]
    mycursor.execute("SELECT * FROM friend_table where userId=%s", (current,))
    users = mycursor.fetchall()
    friendList = []
    for i in users:
        friendList.append(i[2])
    # print(friendList)
    dict = {}
    for i in friendList:
        id = i.split("-")[1]
        first = i.split("-")[0]
        mycursor.execute("SELECT * FROM users where first=%s and id=%s", (first, id))
        user = mycursor.fetchone()
        avatar = user[5]
        if avatar == "null":
            avatar = "./img/users.jpg"
        dict[i] = {
            "name": first + " " + user[3],
            "logged": user[7],
            "avatar": avatar
        }
    sql.close()
    return json.dumps(dict)


@app.route('/logout', methods=['POST'])  # if the user wants to log out
def logout():
    res = make_response("true")
    res.set_cookie('username', '', max_age=0)
    return res


@app.route('/addFriendRequest', methods=['POST'])  # if the user wants to log out
def addFriendRequest():
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    body = request.json
    exists = "SELECT * FROM friend_request WHERE userId=%s and requestId =%s or userId=%s and requestId =%s "
    entry = (body["currentUser"], body["user"], body["user"], body["currentUser"])
    mycursor.execute(exists, entry)
    user = mycursor.fetchone()
    # print(user)
    if user == None:
        insert = "INSERT INTO friend_request (userId,requestId,acceptStatus) VALUES (%s,%s,%s)"
        entry = (body["currentUser"], body["user"], "pending")
        mycursor.execute(insert, entry)
        user = mycursor.fetchone()
        sql.commit()
        sql.close()
        # if user online user socket to emit else return true
        return 'true'
    elif user[3] == "reject":
        # print(user,body)
        exists = "UPDATE friend_request SET acceptStatus=%s WHERE userId=%s AND requestId =%s "
        entry = ("pending", body["currentUser"], body["user"])
        mycursor.execute(exists, entry)
        sql.commit()
        sql.close()
        # if user online user socket to emit else return true
        return 'true'
    else:
        return 'false'


@app.route('/getFriendRequest', methods=['POST'])  # if the user wants to log out
def getFriendRequest():
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    body = request.json
    # print(body)
    exists = "SELECT * FROM friend_request WHERE requestId =%s"
    entry = (body["currentUser"],)
    mycursor.execute(exists, entry)
    users = mycursor.fetchall()
    returnList = []
    for i in users:
        if i[3] == "pending":
            id = i[1].split('-')[1]
            first = i[1].split('-')[0]
            exists = "SELECT * FROM users WHERE id =%s AND first=%s"
            entry = (id, first)
            mycursor.execute(exists, entry)
            user = mycursor.fetchone()
            # print(user)
            avatar = user[5]
            if avatar == 'null':
                avatar = "./img/users.jpg"
            tempList = [i[1], user[2] + ' ' + user[3], avatar]
            returnList.append(tempList)
    sql.close()
    return json.dumps(returnList)


@app.route('/friendRequestUpdate', methods=['POST'])  # if the user wants to log out
def friendRequestUpdate():
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    body = request.json
    # print(body)
    exists = "UPDATE friend_request SET acceptStatus=%s WHERE  requestId =%s AND userId=%s "
    entry = (body["status"], body["currentUser"], body["user"])
    mycursor.execute(exists, entry)
    sql.commit()
    if body["status"] == "accept":
        insert = "INSERT INTO friend_table (userId,friendId) VALUES (%s,%s)"
        entry = (body["currentUser"], body["user"])
        mycursor.execute(insert, entry)
        sql.commit()
        insert = "INSERT INTO friend_table (userId,friendId) VALUES (%s,%s)"
        entry = (body["user"], body["currentUser"])
        mycursor.execute(insert, entry)
        sql.commit()
    sql.close()
    return 'true'


clients = {}


@socketio.on('joined')  # when user enter
def handle_my_custom_event(json, methods=['GET', 'POST']):
    # print("User :"+json["data"]+" Connect! SID= " + request.sid)
    if json["data"] not in clients:
        clients[json["data"]] = []
        sql = mysql.connector.connect(user='root', password=psword,
                                      host=host,
                                      database='chato')
        mycursor = sql.cursor(buffered=True)
        id = json['data'].split('-')[1]
        first = json['data'].split('-')[0]
        updateStatus = "UPDATE users SET status=%s WHERE first=%s and id=%s"
        entry = ("1", first, id)
        mycursor.execute(updateStatus, entry)
        sql.commit()

        mycursor.execute("SELECT * FROM friend_table where friendId=%s", (json['data'],))
        friends = mycursor.fetchall()
        friendList = []
        for i in friends:
            friendList.append(i[1])
        for i in friendList:
            if i in clients:
                for j in clients[i]:
                    socketio.emit('friendConnect', json['data'], room=j)
        sql.close
    clients[json["data"]].append(request.sid)
    # print(clients)


@socketio.on('disconnect')
def disconnect():
    client_dc = ""
    for i in clients:
        if request.sid in clients[i]:
            client_dc = i
            clients[i].remove(request.sid)
            break
    if len(clients[client_dc]) == 0:  # will delete client from clients list
        clients.pop(client_dc, None)
        sql = mysql.connector.connect(user='root', password=psword,
                                      host=host,
                                      database='chato')
        mycursor = sql.cursor(buffered=True)
        id = client_dc.split('-')[1]
        first = client_dc.split('-')[0]
        updateStatus = "UPDATE users SET status=%s WHERE first=%s and id=%s"
        entry = ("0", first, id)
        mycursor.execute(updateStatus, entry)
        sql.commit()
        mycursor.execute("SELECT * FROM friend_table where friendId=%s", (client_dc,))
        friends = mycursor.fetchall()
        friendList = []
        for i in friends:
            friendList.append(i[1])
        print(friendList, "disconnectd")
        for i in friendList:
            if i in clients:
                for j in clients[i]:
                    socketio.emit('friendDisconnect', json.dumps(client_dc), room=j)
        sql.close()
        print("client disconnected : ", client_dc)

        # socketio.emit("friendDisconnect",json.dumps(client_dc))


@socketio.on('find_friend')
def search_find(data, methods=['GET', 'POST']):
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    # print(data)
    uname = data["user"]
    search_name = hashlib.sha256(data["sname"].encode()).hexdigest()
    mycursor.execute("SELECT * FROM users WHERE username=%s", (search_name,))
    friends = mycursor.fetchone()
    if friends:
        if friends[2] + "-" + str(friends[0]) == uname:
            socketio.emit('find_friend_result', "Found yourself", room=request.sid)
        else:
            avatar = friends[5]
            if avatar == 'null':
                avatar = "./img/users.jpg"
            id = friends[2] + '-' + str(friends[0])
            arr = [friends[2], friends[3], avatar, id]
            socketio.emit('find_friend_result', json.dumps(arr), room=request.sid)
    else:
        socketio.emit('find_friend_result', "Not Found", room=request.sid)
    sql.close()


@socketio.on('Sending_count')
def Sending_count(data, methods=['GET', 'POST']):
    # print(data,request.sid,"SID DATA")
    uname = data["currentUser"]
    count = data["data"]
    for i in clients[uname]:
        # print(i,"III")
        socketio.emit('updateNotificationCount', json.dumps(count), room=i)


@socketio.on('update_notification_add_friend')
def update_notification_add_friend(data, methods=['GET', 'POST']):
    sql = mysql.connector.connect(user='root', password=psword,
                                  host=host,
                                  database='chato')
    mycursor = sql.cursor(buffered=True)
    # print(data, request.sid, "SID DATA")
    requestUserId = data["requestUserId"]
    # get friend request
    exists = "SELECT * FROM friend_request WHERE requestId =%s"
    entry = (requestUserId,)
    mycursor.execute(exists, entry)
    users = mycursor.fetchall()
    notification = 0
    for i in users:
        if i[3] == "pending":
            notification += 1
    sql.close()
    for i in clients[requestUserId]:
        socketio.emit('updateNotificationCount', json.dumps(notification), room=i)


@socketio.on('signoutAll')
def signoutAll(data, methods=['GET', 'POST']):
    # print(data,request.sid,"SID DATA")
    uname = data["currentUser"]
    for i in clients[uname]:
        socketio.emit('logAllTabOut', room=i)


@socketio.on("send_to_friend")
def send_to_fir(data):
    res = request.cookies.get('username')
    exists = "SELECT * FROM users WHERE username=%s"
    entry = (res,)
    mycursor.execute(exists, entry)
    current = mycursor.fetchone()
    id = current[0]
    firstIn = current[2]
    avatar = current[5]
    if avatar == 'null':
        avatar = "./img/users.jpg"
    senderId = firstIn + '-' + str(id)
    # print(senderId)
    friname = data['friendName']
    frimess = data['sentMeg']
    for i in clients[friname]:
        socketio.emit("send_to_js", json.dumps({senderId: frimess, "avatar": avatar}), room=i)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080, debug=False)
