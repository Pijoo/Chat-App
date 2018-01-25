const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const UsersService = require('./UserService');

const userService = new UsersService();

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.sendFile(__dirname +'/index.html');
});

//below, 'socket' represents user who's just joined to the chat
io.on('connection', function(socket) {
	// client is listening for enter message to the chat
	socket.on('join', function(name){
		//user who joined gets to the user list on chat
		userService.addUser({
			id: socket.id,
			name
		});
		//app emitsupdate event, which updates info about users to everyone who is listening on 'update' event
		io.emit('update', {
			users: userService.getAllUsers()
		});
	});

	//support for breaking the connection with the server
	socket.on('disconnect', () => {
		userService.removeUser(socket.id);
		socket.broadcast.emit('update', {
			users: userService.getAllUsers()
		});
	});

	//support for sending messages to chat users
	socket.on('message', function(message) {
		const {name} = userService.getUserById(socket.id);
		socket.broadcast.emit('message', {
			text: message.text,
			from: name
		});
	});
});

server.listen(3000, function(){
	console.log('listening on *:3000');
});