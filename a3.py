import flask
from flask import Flask
import base64
import uuid
import os
from flask_socketio import SocketIO, emit, send, join_room, leave_room

app = Flask(__name__)
app.config.from_pyfile('settings.py')

# make the sockets.
socketio = SocketIO(app)
recip_sockets = {}

chats = {}
userList = {}

@app.before_request
def setup_csrf():
    if 'csrf_token' not in flask.session:
        flask.session['csrf_token'] = base64.b64encode(os.urandom(32)).decode('ascii')
    if 'auth_user' not in flask.session:
        flask.session['auth_user'] = '0'
    if 'topic' not in flask.session:
        flask.session['topic'] = '0'
    if 'key' not in flask.session:
        flask.session['key'] = '0'
    if 'room' not in flask.session:
        flask.session['room'] = '0'


@app.route('/')
def index():
    return flask.render_template('index.html')


@app.route('/new-chat', methods=['POST'])
def chat():
    topic = flask.request.form['chat_topic']
    flask.session['topic'] = topic
    # store the topic
    if topic not in chats:
        key = base64.urlsafe_b64encode(uuid.uuid4().bytes)[:12].decode('ascii')
        chats[topic] = key
        flask.session['key'] = key

        if key not in userList:
            userList[key] = list()

        return flask.redirect('/' + key)
    else:
        key = chats[topic]
        flask.session['key'] = key

        if key not in userList:
            userList[key] = list()

        return flask.redirect('/'+key, code=303)


@app.route('/<string:key>')
def room(key):
    # see if key exists
    for chat in chats:
        if chats[chat] == key:
            flask.session['topic'] = chat
            flask.session['key'] = key
    if key in userList:
        if userList[key] is not None:
            users = userList[key]
        if userList[key] is None:
            return flask.redirect(flask.url_for('index'))
    else:
        users = list()

    return flask.render_template('chat.html', key=key, sid=flask.session['csrf_token'],
                                 state='!joined', topic=flask.session['topic'],
                                 name=flask.session['auth_user'], users=users)

@socketio.on('chat')
def chat(data):
    user_message = data['name'] + ': ' + data['_message']
    flask.session['room'] = data['room']
    emit('new-message', user_message, broadcast=True, room=flask.session['room'])


@socketio.on('join')
def on_join(data):
    username = data['username']

    flask.g.user = username
    flask.session['auth_user'] = username

    room = data['room']
    flask.session['room'] = room
    join_room(room)

    if room not in userList:
        userList[room] = list()

    userList[room].append(username)
    flask.session['session'] = data['sid']

    emit("new-user", username, broadcast=True, room=room)


@socketio.on('leave')
def on_leave(data):
    print('mamma i made it')
    username = data['username']
    room = data['room']
    userList[room].remove(username)
    leave_room(room)
    user_message = 'Sever: ' + username + ' has left the chat.'
    emit('new-message', user_message, broadcast=True, room=flask.session['room'])
    emit('remove-user', username, broadcast=True, room=flask.session['room'])


if __name__ == '__main__':
    socketio.run(app)
