
# H5P Runner

this project hosts h5p libraries in a static site, and provides a runner that can render any supported
h5p activity given a url to its `contents`. the contents of the activity must be hosted elsewhere. the
url to the activity is provided via `?content` query param, and a `h5p.json` is expected to be at
`givenUrl/h5p.json`. the activity can provide images or other supporting assets referenced from the `h5p.json`
beside it as normal. (the structure is the same as if you took an `.h5p` archive, unzipped it, and deleted the
libraries)


## updating libraries

get a `.h5p` file for an activity that we want to run but don't support yet, and run

```
./scripts/import.bash /path/to/activity.h5p
```

new libraries will be added, and any new patches for existing libraries will be updated.

## run locally

install serve

```
yarn global add serve
```

serve the libraries directory

```
 serve -C -p 8081 libraries/
```

build the runner

```
(cd runner && LIBRARIES_HOST=http://local.com:8081 yarn build)
```

serve the dist folder

```
serve -p 8080 runner/dist/
```

load an activity

http://localhost:8080/?content=https://tomwoodward.github.io/h5p-test/h5p-test/activities/whatColorAreBerries

## to deploy libraries

libraries are hosted in [RAM](https://github.com/openstax/ram), deploy them with the upload script.
you will need to use [aws-access](https://github.com/openstax/aws-access#assuming-a-role-through-the-aws-cli)
to assume a role allowed to do the upload first.

```
/path/to/ram/upload.bash [environment] h5p/libraries libraries/
```

## to deploy the runner to RAM

the runner is hosted in [RAM](https://github.com/openstax/ram), deploy it with the upload script.
you will need to use [aws-access](https://github.com/openstax/aws-access#assuming-a-role-through-the-aws-cli)
to assume a role allowed to do the upload first.

```
(cd runner && LIBRARIES_HOST=https://ram.openstax.org/h5p/libraries yarn build)
/path/to/ram/upload.bash [environment] h5p/runner runner/dist
```

## to deploy the runner to ancillaries

after building the runner, you will need to open dist/index.html and manually update the head tag to include the content path and baseURI:

```
<head><script>__CONTENT_PATH="<%= fieldUrl('content') %>"</script><meta charset="utf-8"/><meta charset="utf-8"/><title>Webpack App</title><link rel="icon" href="<%= baseURI %>/favicon.ico"><script defer="defer" src="<%= baseURI %>/bundle.js"></script></head>
```

you can then upload the dist folder using the Edit Ancillary Types form.

## h5p vendor code
the vendor code distributed with h5p-standalone is incomplete and old, we copy it out of the h5p-php-library
and add it to this repo.

copied out of https://github.com/h5p/h5p-php-library

```
cp -r /path/to/h5p-php-library/{fonts,images,js,styles} src/vendor/
```

## h5p-standalone

this project uses [h5p-standalone](https://github.com/tunapanda/h5p-standalone) to wire up the static assets of h5p. we monkeypatch
a few things to add support for `div` style rendering instead of iframe (because mostly
we're using this inside iframes already). there are a few other things like the vendor
code that aren't working totally great from h5p-standalone. we should consider
updating/forking/rewriting the dependency to make the whole situation cleaner.
