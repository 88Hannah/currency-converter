"use strict";

var _test = require("./test");

var btn = document.getElementById('button');
var content = document.getElementById('content');
var name = "Walter";
content.innerHTML = "\n        <h2>Welcome</h2>\n        <p>Hi, ".concat(name, "</p>\n        <p>Look: ").concat((0, _test.doThis)(7), "</p>\n    ");

var changeContent = function changeContent() {
  var year = new Date().getFullYear();
  content.innerHTML = "\n        <h2>Hello</h2>\n        <p>It is the year ".concat(year, "</p>\n    ");
};

btn.addEventListener('click', changeContent);
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.doThis = void 0;

var doThis = function doThis(number) {
  return 100 * number;
};

exports.doThis = doThis;
