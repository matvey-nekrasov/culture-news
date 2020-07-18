// Подключение пакетов
const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const gulpSass = require("gulp-sass");
const gulpPlumber = require("gulp-plumber");
const gulpNotify = require("gulp-notify");
const gulpAutoprefixer = require("gulp-autoprefixer");
const gulpPug = require("gulp-pug");
const del = require("del");

// Задачи для Gulp
function hello(cb) {
	return console.log("Hello world");
	cb();
}

function pug() {
	return gulp.src('src/pug/pages/**/*.pug')
		.pipe(gulpPlumber({
			errorHandler: gulpNotify.onError(function (err) {
				return {
					title: "pug",
					message: err.message
				}
			})
		}))
		.pipe(gulpPug({
			pretty: true
		}))
		.pipe(gulp.dest("build/"))
		.pipe(browserSync.stream());
}

function sass() {
	return gulp.src('src/sass/main.scss', { sourcemaps: true })
		.pipe(gulpPlumber({
			errorHandler: gulpNotify.onError(function (err) {
				return {
					title: "sass",
					message: err.message
				}
			})
		}))
		.pipe(gulpSass())
		.pipe(gulpAutoprefixer({
			overrideBrowserslist: ["last 3 versions"],
			cascade: false
		}))
		.pipe(gulp.dest("build/css", { sourcemaps: true }))
		.pipe(browserSync.stream());
}

function copyJs() {
	return gulp.src("src/js/**/**.*")
		.pipe(gulp.dest("build/js"))
		.pipe(browserSync.stream());
}

function copyLibs() {
	return gulp.src("src/libs/**/**.*", { allowEmpty: true })
		.pipe(gulp.dest("build/libs"))
		.pipe(browserSync.stream());
}

function copyImg() {
	return gulp.src("src/img/**/**.*")
		.pipe(gulp.dest("build/img"))
		.pipe(browserSync.stream());
}

function cleanBuild() {
	return del("build");
}

function server() {
	browserSync.init({
		server: "build/",
		notify: false, // Don"t show any notifications in the browser,
		ui: false // Disable UI completely. Browsersync includes a user-interface that is accessed via a separate port. The UI allows to controls all devices, push sync updates and much more.
	});
	gulp.watch("src/pug/**/*.*", pug);
	gulp.watch("src/sass/**/*.scss", sass);
	gulp.watch("src/js/**/*.js", copyJs);
	gulp.watch("src/libs/**/*.*", copyLibs);
	gulp.watch("src/img/**/*.*", copyImg);
}

exports.build = gulp.series(cleanBuild, gulp.parallel(pug, sass, copyJs, copyLibs, copyImg));
exports.default = gulp.series(exports.build, server);
