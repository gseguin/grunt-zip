/*
 * grunt-zip
 * https://github.com/twolfson/grunt-zip
 *
 * Copyright (c) 2013 Todd Wolfson
 * Licensed under the MIT license.
 */

var fs = require('fs'),
    path = require('path'),
    Zip = require('node-zip');
module.exports = function(grunt) {

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/gruntjs/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('zip', 'Zip files together', function() {
    // Collect the filepaths we need
    var file = this.file,
        src = file.src,
        srcFolders = grunt.file.expandDirs(src),
        srcFiles = grunt.file.expandFiles(src),
        dest = file.dest;

    // Generate our zipper
    var zip = new Zip();

    // For each of the srcFolders, add it to the zip
    srcFolders.forEach(function (folderpath) {
      zip.folder(folderpath);
    });

    // For each of the srcFiles
    srcFiles.forEach(function (filepath) {
      // Read in the content and add it to the zip
      var input = fs.readFileSync(filepath, 'binary');

      // Add it to the zip
      zip.file(filepath, input);
    });

    // Create the destination directory
    var destDir = path.dirname(dest);
    grunt.file.mkdir(destDir);

    // Write out the content
    // TODO: Allow for options of deflate/no deflate
    // TODO: Allow for cwd so no absolute paths
    var output = zip.generate({base64: false, compression: 'DEFLATE'});
    fs.writeFileSync(dest, output, 'binary');

    // Fail task if errors were logged.
    if (this.errorCount) { return false; }

    // Otherwise, print a success message.
    grunt.log.writeln('File "' + dest + '" created.');
  });


  grunt.registerMultiTask('unzip', 'Unzip files into a folder', function() {
    // Collect the filepaths we need
    var file = this.file,
        src = file.src,
        srcFiles = grunt.file.expand(src),
        dest = file.dest;

    // Iterate over the srcFiles
    srcFiles.forEach(function (filepath) {
      // Read in the contents
      var input = fs.readFileSync(filepath, 'binary');

      // Unzip it
      var zip = new Zip(input, {base64: false, checkCRC32: true});

      // Pluck out the files
      var files = zip.files,
          filenames = Object.getOwnPropertyNames(files);

      // Filter out all non-leaf files
      filenames = filenames.filter(function filterNonLeafs (filename) {
        // Iterate over the other filenames
        var isLeaf = true,
            i = filenames.length,
            otherFile,
            pathToFile,
            isParentDir;
        while (i--) {
          // If the other file is the current file, skip it
          otherFile = filenames[i];
          if (otherFile === filename) {
            continue;
          }

          // Determine if this file contains the other
          pathToFile = path.relative(filename, otherFile);
          isParentDir = pathToFile.indexOf('..') === -1;

          // If it does, falsify isLeaf
          if (isParentDir) {
            isLeaf = false;
            break;
          }
        }

        // Return that the file was a leaf
        return isLeaf;
      });

      // Iterate over the files
      filenames.forEach(function (filename) {
        // Find the content
        var fileObj = files[filename],
            content = fileObj.data;

        // Determine the filepath
        var filepath = path.join(dest, filename);

        // Create the destination directory
        var fileDir = path.dirname(filepath);
        grunt.file.mkdir(fileDir);

        // Write out the content
        fs.writeFileSync(filepath, content, 'binary');
      });
    });

    // Fail task if errors were logged.
    if (this.errorCount) { return false; }

    // Otherwise, print a success message.
    grunt.log.writeln('File "' + this.file.dest + '" created.');
  });

};
