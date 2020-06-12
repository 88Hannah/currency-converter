"use strict";

var btn = document.getElementById('button');
var content = document.getElementById('content');
var name = "Walter";
content.innerHTML = "\n        <h2>Welcome</h2>\n        <p>Hi, ".concat(name, "</p>\n    ");

var changeContent = function changeContent() {
  var year = new Date().getFullYear();
  content.innerHTML = "\n        <h2>Hello</h2>\n        <p>It is the year ".concat(year, "</p>\n    ");
};

btn.addEventListener('click', changeContent);