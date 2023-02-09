#!/usr/bin/env bash
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_directory="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." &> /dev/null && pwd )"

tmpdir=$(mktemp -d);

unzip "$1" -d "$tmpdir"

libdir="$project_directory"/libraries

function somejq() {
  if command -v jq &> /dev/null; then
    jq "$@"
  elif command -v docker &> /dev/null; then
    docker run -i stedolan/jq "$@"
  else
    echo "Either native jq or docker is required to run this script".
    exit 1
  fi
}
function libversion() {
  somejq -r .patchVersion < "$1"/library.json
}

echo "Processing libraries"
for lib in "$tmpdir"/*; do
  libname=$(basename "$lib")

  if [ "$libname" == "content" ] || [ ! -d "$lib" ]; then
    continue;
  fi

  if [ ! -d "$libdir"/"$libname" ]; then
    echo "$libname not found, adding"
    mv "$lib" "$libdir"/
  elif [ -d "$libdir"/"$libname" ] && [ "$(libversion "$lib")" -gt "$(libversion "$libdir"/"$libname")" ]; then
    # usually the major and minor versions are in the directory name, so this'll only update based on patch version
    echo "$libname has a newer version ($(libversion "$lib")) than existing ($(libversion "$libdir"/"$libname")). upgrading."
    rm -r "$libdir"/"${libname:?}"
    mv "$lib" "$libdir"/
  elif [ -d "$libdir"/"$libname" ] && [ "$(libversion "$lib")" -lt "$(libversion "$libdir"/"$libname")" ]; then
    echo "$libname has an older version ($(libversion "$lib")) than existing ($(libversion "$libdir"/"$libname")). skipping."
  elif [ -d "$libdir"/"$libname" ] && [ "$(libversion "$lib")" -eq "$(libversion "$libdir"/"$libname")" ]; then
    echo "$libname has same version ($(libversion "$lib")) as existing ($(libversion "$libdir"/"$libname")). skipping."
  fi
done
