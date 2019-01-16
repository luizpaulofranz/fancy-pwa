module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{html,ico,json,css}", // here is recursivelly, **/* - means all directories (**) all files (*)
    "src/images/*.{png,jpg}", // only files on root, it is not recursivelly
    "src/js/*.min.js", // cache only our minified js, wich are those that we use
    "src/js/idb.js",
    "src/js/dbUtility.js",
  ],
  "swSrc": "public/sw-base.js", // our base SW
  "swDest": "public/service-worker.js", // our finally SW
  "globIgnores": [ // here we set what we will ignore on caching
    "../workbox-config.js",
    "help/**",
    "404.html"
  ]
};