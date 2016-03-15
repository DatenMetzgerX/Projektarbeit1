const path = require("path");
const gulp = require("gulp");
const del = require("del");
const sourcemaps = require("gulp-sourcemaps");
const babel = require("gulp-babel");
const eslint = require("gulp-eslint");

const paths = {
	scripts: "src/**/*.js"
};

gulp.task("default", ["build"]);

function transpile () {
	return gulp
		.src(paths.scripts)
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(sourcemaps.write(".", {
			sourceRoot: function (file) {
				const destination = path.join(file.cwd, "dist", file.relative);
				const destDir = path.dirname(destination);
				return path.relative(destDir, path.join(file.cwd, "src"));
			},
			includeContent: false
		}))
		.pipe(gulp.dest("dist"));
}

gulp.task("build", [ "build:babel", "lint"]);
gulp.task("babel", transpile);
gulp.task("build:babel", ["clean"], transpile);


gulp.task("lint", function () {
	return gulp
		.src(paths.scripts)
		.pipe(eslint())
		.pipe(eslint.format());
});

gulp.task("watch", ["default"], function () {
	gulp.watch(paths.scripts, ["babel", "lint"]);
});

gulp.task("clean", function () {
	return del(["dist"]);
});