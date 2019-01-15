module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{html,ico,json,css,js}", // here is recursivelly, **/* - means all directories (**) all files (*)
    "src/images/*.{png,jpg}" // only files on root, it is not recursivelly
  ],
  "swDest": "public/service-worker.js",
  "globIgnores": [ // here we set what we will ignore on caching
    "../workbox-config.js",
    "help/**"
  ]
};