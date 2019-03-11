var app = require("express")();
var http = require('http').Server(app);
var io = require('socket.io')(http, {
    cookie: false,
});
var cookieParser = require('cookie-parser');

app.use(cookieParser());

var users = [];
var history = [];

newNick = function(newName, socket) {
    console.log (socket.username + " changed to " + newName);
    
    socket.emit('user disconnected', socket.username);
    socket.emit('user connected', newName);
    users.splice(users.indexOf(socket.username, 1));
    socket.username = newName;
    users.push(newName);
    socket.emit('change cookie', newName);
    
};

app.get('/', function(req,res,next){
    //console.log('Cookies: ', req.cookies);
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    socket.username = Math.random().toString(10).substr(2, 9);
    console.log (socket.username + ' connected.');
    users.push(socket.username);   
    socket.emit('cookie check', socket.username);
    socket.emit('history', history);
    io.emit('user connected', socket.username);
    

    socket.on('chat message', function(msg){
        if (msg.charAt(0)==='/'){
          if (msg.indexOf("nickcolor ") === 1){
              let command = msg.split(' ');
              if (command.length == 2){
                  let rgb = command[1];
                  if (rgb.length == 6){
                    let validRGB = true;
                    for (let i = 0; i < 6; i++){
                          if (isNaN(parseInt(rgb.charAt(i), 16))) validRGB = false;
                    }
                    if (validRGB){
                        io.emit('color change', socket.username, rgb);
                    }         
                    else {
                        socket.emit('chat message', "USAGE: /nickcolor RRGGBB", new Date(), "server");
                      }  
                  }
                  else {
                    socket.emit('chat message', "USAGE: /nickcolor RRGGBB", new Date(), "server");
                  }
                  
              }
              else {
                  socket.emit('chat message', "USAGE: /nickcolor RRGGBB", new Date(), "server");
              }

          }else if (msg.indexOf("nick ") === 1){
              command = msg.split(' ');
              if (command.length == 2){ 
                let newName = command[1];
                newNick(newName, socket);
                
              } else {
                  socket.emit('chat message', "USAGE: /nick NEWNAME", new Date(), "server");
              }

          }
        }
        else {
            time = new Date();
            io.emit('chat message', msg, time, socket.username);
            history.push([msg,time,socket.username]);
        }
        
        
    });

    socket.on('namechange', function(newName){
        newNick(newName, socket);
    });
    

    socket.on('disconnect', function(){
        console.log(socket.username +' disconnected');
        users.splice(users.indexOf(socket.username, 1));
        io.emit('user disconnected', socket.username);
    });
});

http.listen(3000, function(){
    console.log('lisening on *:3000');
});