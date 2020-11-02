const express = require('express'),
    app = express(),
    // fs = require('fs'),
    http = require('http'),
    server = http.Server(app),
    io = require('socket.io')(server),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    helmet = require('helmet'),
    bodyParser = require('body-parser'),
     compression = require('compression');
// Catch errors

app.use(compression());
console.log('Server restarting at',new Date().toLocaleString())
app.use(helmet());

app.use(cookieParser('blugblarg'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.set('io', io)
const routes = require('./routes')(io);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));
app.use('/', routes);
io.on('connection', function (socket) {
    socket.on('testFn', function (d) {
        socket.emit('testOut', d);
    })
    socket.on('requestRefresh',function(o){
        console.log('REQUESTED REFRESH',o,io.to)
        io.to(o.id).emit('refreshById')
    })
});
server.listen(process.env.PORT || 8080,function(){
    console.log('Server is listening!')
    app.emit('app_running')

});
server.on('error', function (err) {
    console.log('Oh no! Err:', err)
}); 

server.on('request', function (req) {
    // console.log(req.url);
})

app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    console.log('Client (probly) err:', err)
    res.send('Error!' + err)
});