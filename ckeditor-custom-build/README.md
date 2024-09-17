## Source


https://ckeditor.com/docs/ckeditor5/latest/framework/quick-start.html


I may be able to use npx ckeditor5-package-generator, but for now I will take the longer route to see what I can learn…

## Instructions


    npm init

This creates a package.json… I ended up editing to look more like the version of the online builder:

    {
      "name": "ckeditor5-placeholder-build",
      "version": "0.0.1",
      "description": "A placeholder version of CKEditor",
      "main": "./build/ckeditor.js",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1",
        "build": "webpack --mode production"
      },
      "author": "DWI",
      "license": "SEE LICENSE IN LICENSE.md"
    }

## now install the dependencies

    npm install --save \
        css-loader@5 \
        postcss-loader@4 \
        raw-loader@4 \
        style-loader@2 \
        webpack@5 \
        webpack-cli@4

##Now we need to create a webpack.config.js file.. This is the suggestion:

    // webpack.config.js
    
    'use strict';
    
    const path = require( 'path' );
    const { styles } = require( '@ckeditor/ckeditor5-dev-utils' );
    
    module.exports = {
        // https://webpack.js.org/configuration/entry-context/
        entry: './app.js',
    
        // https://webpack.js.org/configuration/output/
        output: {
            path: path.resolve( __dirname, 'dist' ),
            filename: 'bundle.js'
        },
    
        module: {
            rules: [
                {
                    test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
    
                    use: [ 'raw-loader' ]
                },
                {
                    test: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,
    
                    use: [
                        {
                            loader: 'style-loader',
                            options: {
                                injectType: 'singletonStyleTag',
                                attributes: {
                                    'data-cke': true
                                }
                            }
                        },
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: styles.getPostCssConfig( {
                                    themeImporter: {
                                        themePath: require.resolve( '@ckeditor/ckeditor5-theme-lark' )
                                    },
                                    minify: true
                                } )
                            }
                        }
                    ]
                }
            ]
        },
    
        // Useful for debugging.
        devtool: 'source-map',
    
        // By default webpack logs warnings if the bundle is bigger than 200kb.
        performance: { hints: false }
    };

## I ended up using the one that was used from the online builder:

    /**
     * @license Copyright (c) 2014-2023, CKSource Holding sp. z o.o. All rights reserved.
     * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
     */
    
    'use strict';
    
    /* eslint-env node */
    
    const path = require( 'path' );
    const webpack = require( 'webpack' );
    const { bundler, styles } = require( '@ckeditor/ckeditor5-dev-utils' );
    const { CKEditorTranslationsPlugin } = require( '@ckeditor/ckeditor5-dev-translations' );
    const TerserWebpackPlugin = require( 'terser-webpack-plugin' );
    
    module.exports = {
            devtool: 'source-map',
            performance: { hints: false },
    
            entry: path.resolve( __dirname, 'src', 'ckeditor.js' ),
    
            output: {
                    // The name under which the editor will be exported.
                    library: 'ClassicEditor',
    
                    path: path.resolve( __dirname, 'build' ),
                    filename: 'ckeditor.js',
                    libraryTarget: 'umd',
                    libraryExport: 'default'
            },
    
            optimization: {
                    minimizer: [
                            new TerserWebpackPlugin( {
                                    sourceMap: true,
                                    terserOptions: {
                                            output: {
                                                    // Preserve CKEditor 5 license comments.
                                                    comments: /^!/
                                            }
                                    },
                                    extractComments: false
                            } )
                    ]
            },
    
            plugins: [
                    new CKEditorTranslationsPlugin( {
                            // UI language. Language codes follow the https://en.wikipedia.org/wiki/ISO_639-1 format.
                            // When changing the built-in language, remember to also change it in the editor's configuration (src/ckeditor.js).
                            language: 'en-au',
                            additionalLanguages: 'all'
                    } ),
                    new webpack.BannerPlugin( {
                            banner: bundler.getLicenseBanner(),
                            raw: true
                    } )
            ],
    
            module: {
                    rules: [
                            {
                                    test: /\.svg$/,
                                    use: [ 'raw-loader' ]
                            },
                            {
                                    test: /\.css$/,
                                    use: [
                                            {
                                                    loader: 'style-loader',
                                                    options: {
                                                            injectType: 'singletonStyleTag',
                                                            attributes: {
                                                                    'data-cke': true
                                                            }
                                                    }
                                            },
                                            {
                                                    loader: 'css-loader'
                                            },
                                            {
                                                    loader: 'postcss-loader',
                                                    options: {
                                                            postcssOptions: styles.getPostCssConfig( {
                                                                    themeImporter: {
                                                                            themePath: require.resolve( '@ckeditor/ckeditor5-theme-lark' )
                                                                    },
                                                                    minify: true
                                                            } )
                                                    }
                                            },
                                    ]
                            }
                    ]
            }
    };

## Installing CKEditor 5 Framework packages needed…

    npm install --save \
        @ckeditor/ckeditor5-dev-utils \
        @ckeditor/ckeditor5-editor-classic \
        @ckeditor/ckeditor5-essentials \
        @ckeditor/ckeditor5-paragraph \
        @ckeditor/ckeditor5-basic-styles \
        @ckeditor/ckeditor5-theme-lark


Ok, the instructions say to create an app.js file… I ended up copying the one i downloaded from the online builder…
I also copied the sample file and its index.html and styles.css files across.

when running the build process, i get the following error:

    npm rum build
    
    > ckeditor5-placeholder-build@0.0.1 build
    > webpack --mode production
    
    [webpack-cli] Failed to load '/Users/douginman/git/wwp_consulting/ckeditor_build/framework/webpack.config.js' config
    [webpack-cli] Invalid options object. Terser Plugin has been initialized using an options object that does not match the API schema.
     - options has an unknown property 'sourceMap'. These properties are valid:
       object { test?, include?, exclude?, terserOptions?, extractComments?, parallel?, minify? }
    

For a start, I notice I do not have the following dependencies installed

    "@ckeditor/ckeditor5-alignment": "^38.1.0",
    "@ckeditor/ckeditor5-autoformat": "^38.1.0",
    "@ckeditor/ckeditor5-block-quote": "^38.1.0",
    "@ckeditor/ckeditor5-cloud-services": "^38.1.0",
    "@ckeditor/ckeditor5-dev-translations": "^32.1.2",
    "@ckeditor/ckeditor5-heading": "^38.1.0",
    "@ckeditor/ckeditor5-image": "^38.1.0",
    "@ckeditor/ckeditor5-indent": "^38.1.0",
    "@ckeditor/ckeditor5-link": "^38.1.0",
    "@ckeditor/ckeditor5-list": "^38.1.0",
    "@ckeditor/ckeditor5-media-embed": "^38.1.0",
    "@ckeditor/ckeditor5-paste-from-office": "^38.1.0",
    "@ckeditor/ckeditor5-table": "^38.1.0",
    "@ckeditor/ckeditor5-typing": "^38.1.0",
    "@ckeditor/ckeditor5-typing": "^38.1.0",
    "postcss": "^8.4.24",
    "terser-webpack-plugin": "^4.2.3",

so, let’s install them:

    npm install --save \
    @ckeditor/ckeditor5-alignment \
    @ckeditor/ckeditor5-autoformat \
    @ckeditor/ckeditor5-block-quote \
    @ckeditor/ckeditor5-cloud-services \
    @ckeditor/ckeditor5-dev-translations \
    @ckeditor/ckeditor5-heading \
    @ckeditor/ckeditor5-image \
    @ckeditor/ckeditor5-indent \
    @ckeditor/ckeditor5-link \
    @ckeditor/ckeditor5-list \
    @ckeditor/ckeditor5-media-embed \
    @ckeditor/ckeditor5-paste-from-office \
    @ckeditor/ckeditor5-table \
    @ckeditor/ckeditor5-typing \
    @ckeditor/ckeditor5-typing \
    postcss \
    terser-webpack-plugin 

and now build again - same error as above

now also added the following to the package.json


    "private": true,

I then uninstalled and reinstalled the terser-webpack-plugin

    npm uninstall terser-webpack-plugin
    npm install terser-webpack-plugin@4.2.3

Yay! it worked!!!!

## oh, I added some additional dependencies

    npm install \
    @ckeditor/ckeditor5-font \
    @ckeditor/ckeditor5-highlight \
    @ckeditor/ckeditor5-horizontal-line \
    @ckeditor/ckeditor5-select-all

## and then again the build process

    npm run build

Great… we are essentially done here with creating the custom build…

if i need to update the modules, i used this to retrieve the latest versions

cat package.json | grep '@ckeditor' | cut -d":" -f1 | tr -d ' "' | xargs -I {} sh -c 'version=$(npm show {} version); echo "\"{}\": \"^$version\"",'

I had to do this when i installed a new plugin -- if i don't then i get a duplicate module error!!!

