"use strict";

const gulp = require("gulp");
const plumber = require("gulp-plumber"); // вывод ошибок препроцессорного кода в консоль
const sass = require("gulp-sass"); // препроцессор sass
const sourcemap = require("gulp-sourcemaps"); // отображение исходных файлов стилей в devtools
const rename = require("gulp-rename"); // переименовывание файлов
const server = require("browser-sync").create(); // локальный сервер
const postcss = require("gulp-postcss"); // gulp plugin to pipe CSS through several plugins, but parse CSS only once
const autoprefixer = require("autoprefixer"); // плагин для postcss - расстановка префиксов для старых браузеров
const csso = require("gulp-csso"); // минификатор css
const imagemin = require("gulp-imagemin"); // минификация изображений (очистка метаданных)
const svgstore = require("gulp-svgstore"); // создание svg-спрайтов
const posthtml = require("gulp-posthtml"); // шаблонизатор html
const include = require("posthtml-include"); // плагин для posthtml, заменяет тэг include на содержимое src
const htmlmin = require("gulp-htmlmin"); // минификатор html
const uglify = require("gulp-uglify"); // минификатор js, для работы с es6 нужен babel
const babel = require("gulp-babel"); // babel is a tool that helps you write code in the latest version of JavaScript
const del = require("del"); // удаление папок/файлов
const ghpages = require("gh-pages"); // deploy
const csscomb = require("gulp-csscomb"); // сортировка свойств css

// удаление папки build
gulp.task("clean", function () {
  return del("build");
});

// обработка html файлов: posthtml.include + htmlmin -> build
gulp.task("html", function () {
  return gulp
    .src("source/*.html")
    .pipe(posthtml([include()])) // шаблонизация тег-директивы <include src="file.*"></include>
    // .pipe(htmlmin({              // минификация html-файлов
    //   collapseWhitespace: true,
    //   removeComments: true
    // }))
    .pipe(gulp.dest("build"));
});

// обработка style.scss: plumber + sourcemap + sass + postcss.autoprefixer + csso -> build + stream
gulp.task("scss", function () {
  return gulp
    .src("source/sass/style.scss")
    .pipe(plumber())                 // вывод ошибок препроцессорного кода в консоль
    .pipe(sourcemap.init())          // инициализация карты кода
    .pipe(sass())                    // компиляция sass-файлов
    .pipe(postcss([autoprefixer()])) // расстановка префиксов для старых браузеров
    .pipe(csscomb())                 // сортировка свойств css
    .pipe(rename("style.css"))
    .pipe(gulp.dest("build/css"))
    .pipe(csso())                  // минификация
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))    // запись карты кода
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

// обработка *.css - postcss.autoprefixer + csso -> build
gulp.task("css", function () {
  return gulp
    .src("source/css/*.css")
    .pipe(postcss([autoprefixer()]))
    .pipe(csscomb())
    .pipe(csso())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest("build/css"))
});

// обработка *.js файлов
gulp.task("js", function () {
  return gulp
    .src(["source/js/**/*.js"])
    .pipe(plumber())
    .pipe(gulp.dest("build/js"))
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest("build/js"))
    .pipe(server.stream());
});

// оптимизация изображений
gulp.task("optImages", function () {
  return gulp
    .src(["source/img/**/*.{jpg,png,svg}", "!source/img/**/sprite.svg"])   // sprite.svg исключён т.к. собран вручную
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),              // оптимизация gif
      imagemin.mozjpeg({ quality: 75, progressive: true }), // оптимизация jpeg
      imagemin.optipng({ optimizationLevel: 3 }),           // оптимизация png      
      imagemin.svgo()                                       // оптимизация svg
    ]))
    .pipe(gulp.dest("build/img"));
});

// сборка svg-спрайта
gulp.task("sprite", function () {
  return gulp
    .src("source/img/icon-*.svg")
    .pipe(svgstore({ inlineSvg: true })) // удалить лишние теги из svg, оставить только то, что нужно для инлайна
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("source/img"));
});

// копирование изображений без оптимизации
gulp.task("copyImages", function () {
  return gulp
    .src(["source/img/**/*.{jpg,png,svg}", "!source/img/**/sprite.svg"])
    .pipe(gulp.dest("build/img"));
});

// копирование всех остальных файлов и папок в папку build
gulp.task("copyOthers", function () {
  return gulp
    .src([
      "source/fonts/**/*.{woff,woff2}",
      "source/img/**/sprite.svg",
    ],
      { base: "source" }) // создавать папки начиная от source
    .pipe(gulp.dest("build"));
});

// задача, описывающая работу сервера
gulp.task("serve", function () {
  server.init({
    server: "build", // Serve files from the build directory
    notify: false, // Don"t show any notifications in the browser
    ui: false // Disable UI completely. Browsersync includes a user-interface that is accessed via a separate port. The UI allows to controls all devices, push sync updates and much more.
  });

  // отслеживание изменений *.js
  gulp.watch("source/js/**/*.js").on("change", gulp.series("js"));

  // отслеживание изменений *.scss
  gulp.watch("source/sass/**/*.scss").on("change", gulp.series("scss"));

  // отслеживание изменений *.html
  gulp.watch("source/*.html").on("change", gulp.series(("html"), server.reload));
});

gulp.task("deploy", function () {
  return ghpages.publish("build", function (err) { });
});

// глобальные задачи
gulp.task("build", gulp.series("clean", gulp.parallel("html", "scss", "css", "js", "optImages", "copyOthers")));
gulp.task("start", gulp.series("build", "serve"));

// задача по умолчанию при запуске gulp без параметров
gulp.task("default", gulp.series("start"));
