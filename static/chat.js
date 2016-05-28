(function(action, e) {
    var socket = io.connect('http://' + document.domain + ':' + location.port);
    var object = $(".window");
    var room = object.attr("data-key");
    var session = object.attr("data-sid");
    var username = '';

    // hide it all. its super secret.
    document.getElementById('input').style.display = 'none';
    document.getElementById('theMessages').style.display = 'none';
    document.getElementById('theList').style.display = 'none';

    // create user names
    $(".nameInput").on("submit", function(action) {

        action.preventDefault();
        var name = $("#userName").val();
        username = name;
        if (name) {
            socket.emit("join", {
                username: name,
                room: room,
                sid: session
            });
            // after nickname input, hide the form
            document.getElementById('nameInput').style.display = 'none';
            //hide and seek is over :(
            document.getElementById('input').style.display = 'initial';
            document.getElementById('theMessages').style.display = 'initial';
            document.getElementById('theList').style.display = 'initial';
        }
    });

    // create and append messages
    $(".input").on("submit", function(action) {
        action.preventDefault();
        // get the message as well as set the field to null
        var message = $("#message").val();
        var name = $("#userName").val();
        if (!message)//if no message, we bail.
            return;
        if (!name)// if no name, we bail.
            return;

        socket.emit("chat", {
            sid: session,
            room: room,
            _message: message,
            name: name
        });
         //reset the text field
        $("#message").val("");
    });
    socket.on("connect", function() {
        console.log("connected");
        var name = $("#userName").val();
        if (name) {
            socket.emit("join", {
                username: name,
                room: room,
                sid: session
            });
        }
    });

    socket.on("new-message", function(action) {
        $("<ul>").addClass("text").text(action).appendTo($(".messages"))
    });

    socket.on("new-user", function(action) {
        $("<ul>").text('Server: ' + action).append(" has joined the chat").appendTo($(".messages"));
        $("<ul>").addClass(action).text(action).appendTo($(".userList"))
    });

    socket.on("remove-user", function(action) {
        $("."+action).remove();

    });

    $(".leavebutton").on("submit", function(action) {
        action.preventDefault();

        var user = $("#userName").val();

        socket.emit("leave", {
                username: user,
                room: room,
                sid: session
        });
        $("."+user).remove();
        document.getElementById('input').style.display = 'none';
        document.getElementById('theMessages').style.display = 'none';
        document.getElementById('theList').style.display = 'none';
        document.getElementById('nameInput').style.display = 'none';
        document.getElementById('leavebutton').style.display = 'none';

    });
    $(window).bind('beforeunload', function (action) {
        action.preventDefault();
        var user = $("#userName").val();
        socket.emit("leave", {
            username: user,
            room: room,
            sid: session
        });
        $("."+user).remove();
        console.log('refresh emminent.')
        document.getElementById('input').style.display = 'none';
        document.getElementById('theMessages').style.display = 'none';
        document.getElementById('theList').style.display = 'none';
        document.getElementById('nameInput').style.display = 'none';
        document.getElementById('leavebutton').style.display = 'none'
        return 'The user \'' + user + '\' has been removed from the chat.\n';
    });


    e[''] = action
})({}, function () {
    return this
});/* End main function */
