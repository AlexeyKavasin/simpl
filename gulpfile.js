'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var server = require('browser-sync').create();
var mqpacker = require('css-mqpacker');
var minify = require('gulp-csso');
var rename = require('gulp-rename');
var imagemin = require('gulp-imagemin');
var run = require('run-sequence');
var del = require('del');

gulp.task('clean', function() {
  return del('build');
});

gulp.task('copy', function() {
  return gulp.src([
    'fonts/**/*.{woff,woff2}',
    'img/**',
    'css/**',
    'js/**',
    '*.html'
  ], {
    base: '.'
  })
    .pipe(gulp.dest('build'));
});

gulp.task('style', function() {
  gulp.src('sass/style.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer(),
      mqpacker({
        sort: true
      })
    ]))
    .pipe(rename('main.css'))
    .pipe(gulp.dest('css'))
    .pipe(minify())
    .pipe(rename('main.min.css'))
    .pipe(gulp.dest('css'))
    .pipe(server.stream());
});

gulp.task('images', function() {
  return gulp.src('img/**/*.{png,jpg,gif}')
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ]))
    .pipe(gulp.dest('img'));
});

gulp.task('serve', function() {
  server.init({
    server: '.',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch('sass/**/*.{scss,sass}', ['style']);
  gulp.watch('*.html').on('change', server.reload);
  gulp.watch('js/main.js').on('change', server.reload);
});

gulp.task('build', function(fn) {
  run('clean', 'copy', 'style', 'images', fn);
});
