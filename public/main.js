/*
 * Filename: /Users/jpottle776/www/0_MEAN_STACK/Exercise_02_04_01/public/main.js
 * Path: /Users/jpottle776/www/0_MEAN_STACK/Exercise_02_04_01
 * Created Date: Thursday, February 21st 2019, 1:47:57 pm
 * Author: Jamin C Pottle
 * 
 * main purpose of file is for making front end and handling DOM miniplulation
 */

//  nothing can get in this iife - protected scope
(function(){
    var selectedUserId;//for storing which friend is selected
    var cache = {};

    function startup() {
        var friends = document.getElementsByClassName("friend");
        for (var i = 0; i < friends.length; i++) {
            friends[i].addEventListener('click', function() {
                for (var j = 0; j < friends.length; j++) {
                    friends[j].className = 'friend';
                }
                this.className += ' active';
                selectedUserId = this.getAttribute('uid');
                console.log(this.getAttribute('uid'));
                // gets notes from database
                var notes = getNotes(selectedUserId, function(notes) {
                    var docFragment = document.createDocumentFragment();
                    var notesElements = createNoteElements(notes);
                    // adds note to screen
                    notesElements.forEach(function(element) {
                        docFragment.appendChild(element);
                    });
                    var newNoteButton = createAddNoteButton();
                    docFragment.appendChild(newNoteButton);//adds all li's to the docFragment
                    document.getElementById('notes').innerHTML = "";//clears past notes 
                    document.getElementById('notes').appendChild(docFragment);//adds li notes to the page
                });
                
            });
        }
    }

    // gets notes from database 
    function getNotes(userId, callback) {
        if (cache[userId]) {
            return callback(cache[userId]);
        }
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var notes = JSON.parse(xhttp.responseText || []);
                cache[userId] = notes;
                callback(notes);
            }
        };
        xhttp.open('GET', '/friends/' + encodeURIComponent(userId) + "/notes");
        xhttp.send();
    }

    //posts new note to database
    function postNewNote(userid, note, callback) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var serverNote = JSON.parse(xhttp.responseText || {});
                cache[userid].push(serverNote);
                callback(serverNote);
            }
        }
        // adds new note to mongodb
        xhttp.open('POST', '/friends/' + encodeURIComponent(userid) + "/notes");
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send(JSON.stringify(note));
    }

    // updates the notes that were previous
    function putNote(userid, note, callback) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var serverNote = JSON.parse(xhttp.responseText || {});
                callback(serverNote);
            }
        }
        // updates note in mongodb
        xhttp.open('PUT', '/friends/' + encodeURIComponent(userid) + "/notes/" + encodeURIComponent(note._id), true);
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send(JSON.stringify(note));
    }

    // deletes notes from database
    function deleteNote(userid, note, callback) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                cache[userid] = cache[userid].filter(function(localNote) {//filters out note from cache
                    return localNote._id != note._id;
                });
                callback();
            }
        }
        // for deleting note form mongodb
        xhttp.open('DELETE', '/friends/' + encodeURIComponent(userid) + "/notes/" + encodeURIComponent(note._id), true);
        xhttp.send(JSON.stringify(note));
    }

    // creates the note elements do display
    function createNoteElements(notes) {
        return notes.map(function(note) {
            var element = document.createElement('li');
            element.className = 'note';
            element.setAttribute('contenteditable', true);
            element.textContent = note.content;
            // when leave note box event is triggered
            element.addEventListener('blur', function() {
                note.content = this.textContent;
                if (note.content.trim() == "") {//checks for empty note for deleting
                    if (note._id) {//removes note from database
                        deleteNote(selectedUserId, note, function() {
                            document.getElementById('notes').removeChild(element);
                        });
                    } else {//removes note from screen
                        document.getElementById('notes').removeChild(element);
                    }
                } else if(!note._id) {//checks if note existed before
                    postNewNote(selectedUserId, {content: this.textContent}, function(newNote) {
                        note._id = newNote._id;
                    });
                } else { //if note existed before it updates it
                    putNote(selectedUserId, note, function() {
                        
                    });
                }
            });
            // listens for key down and tests for enter key pressed
            element.addEventListener('keydown', function(e) {
                if (e.keyCode == 13) {//13 is enter key
                    e.preventDefault();
                    if (element.nextSibling.className == 'add-note') {
                        element.nextSibling.click();
                    } else {
                        element.nextSibling.focus();
                    }
                }
            });
            return element;
        });
        return notes;
    }

    //allows you to add a new not to friend
    function createAddNoteButton() {
        var element = document.createElement('li');
        element.className = 'add-note';
        element.textContent = "Add a new note...";
        element.addEventListener('click', function() {
            // sends array of and empty JSON object
            var noteElement = createNoteElements([{}])[0];
            document.getElementById('notes').insertBefore(noteElement, this);
            noteElement.focus();
        });
        return element;
    }

    document.addEventListener('DOMContentLoaded', startup, false);
})();
