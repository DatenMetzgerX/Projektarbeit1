const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const babel = require("gulp-babel");
const eslint = require("gulp-eslint");

const paths = {
	scripts: "src/**/*.js"
};

gulp.task("default", ["babel", "lint"]);

gulp.task("babel", function () {
	return gulp
		.src(paths.scripts)
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest("dist"));
});

gulp.task("lint", function () {
	return gulp
		.src(paths.scripts)
		.pipe(eslint())
		.pipe(eslint.format());
});

gulp.task("watch", ["default"], function () {
	gulp.watch(paths.scripts, ["babel", "lint"]);
});