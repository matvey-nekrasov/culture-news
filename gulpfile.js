import gulp from 'gulp';

// html
import gulpPug from 'gulp-pug';
import htmlmin from 'gulp-htmlmin';

// css
import sass from 'gulp-sass';
import autoprefixer from 'autoprefixer';
import csscomb from 'gulp-csscomb';         // сортировка свойств css
import postcss from 'gulp-postcss';
import minmax from 'postcss-media-minmax';  // writing simple and graceful media queries!
import csso from 'postcss-csso';            // postCSS plugin to minify CSS

// js
import babel from 'gulp-babel';
import terser from 'gulp-terser';           // minify es6+ code

// other
import sync from 'browser-sync';
import ghpages from 'gh-pages';
import del from 'del';                      // удаление папок/файлов
import plumber from 'gulp-plumber';         // вывод ошибок препроцессорного кода в консоль
import replace from 'gulp-replace';
import rename from 'gulp-rename';

const clean = () => del("build");

/*
const html = () => {
  return gulp.src('src/*.html', { allowEmpty: true })
    .pipe(replace(
      /(<link rel="stylesheet" href="css\/)([\S]+)(.css">)/,
      '$1$2.min$3'
    ))
    // .pipe(htmlmin({ removeComments: true, collapseWhitespace: true }))
    .pipe(gulp.dest('build'))
    .pipe(sync.stream());
};
*/

export const pug = () => {
  return gulp.src('src/pug/pages/**/*.pug', { allowEmpty: true })
    .pipe(replace(
      /(link\(rel='stylesheet', href='css\/)([\S]+)(\.css'\))/,
      '$1$2.min$3'
    ))
    .pipe(plumber())                 // вывод ошибок препроцессорного кода в консоль
    .pipe(gulpPug({ pretty: true }))
    .pipe(gulp.dest("build"))
    .pipe(sync.stream());
}

const style = () => {
  return gulp
    .src("src/sass/index.scss", { sourcemaps: true })
    .pipe(plumber())                 // вывод ошибок препроцессорного кода в консоль
    .pipe(sass())
    // .pipe(csscomb())                 // сортировка свойств css
    // .pipe(postcss([minmax, autoprefixer]))
    // .pipe(postcss([csso]))
    .pipe(rename("index.min.css"))
    // .pipe(gulp.dest("build/css"), { sourcemaps: '.' })
    .pipe(gulp.dest("build/css"), { sourcemaps: true })
    .pipe(sync.stream());
}

export const scripts = () => {
  return gulp.src('src/js/index.js', { allowEmpty: true })
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(terser())
    .pipe(gulp.dest('build/js'))
    .pipe(sync.stream());
};

export const copy = () => {
  return gulp.src
    ([
      'src/fonts/**/*',
      'src/img/**/*',
    ], { base: 'src' })
    .pipe(gulp.dest('build'))
    .pipe(sync.stream({
      once: true
    }));
};

const server = () => {
  sync.init({
    ui: false,
    notify: false,
    server: 'build'
  });
};

const watch = () => {
  gulp.watch('src/pug/**/*.pug', gulp.series(pug));
  gulp.watch('src/sass/**/*.scss', gulp.series(style));
  gulp.watch([
    'src/fonts/**/*',
    'src/img/**/*',
  ], gulp.series(copy));
};

const publish = (cb) => {
  ghpages.publish('build', {
    branch: 'gh-pages'
  }, cb);
};

// Public Exports

export const deploy = gulp.series(
  gulp.parallel(
    pug
  ),
  publish
);


// function defaultTask(cb) {
//   // place code for your default task here
//   cb();
// }

// exports.default = defaultTask


export default gulp.series(
  clean,
  gulp.parallel(
    pug,
    style,
    scripts,
    copy
  ),
  gulp.parallel(
    watch,
    server,
  )
);
