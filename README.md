ember-cli-fallback-builds
==============================================================================

[![Greenkeeper badge](https://badges.greenkeeper.io/lifeart/ember-cli-fallback-builds.svg)](https://greenkeeper.io/)

This addon allow to have 2 builds (bundles) (for modern and legacy browsers) in one time.

(module, nomodule)

[Modern Script Loading](https://jasonformat.com/modern-script-loading/)

[Pre-RFC: Generate and serve ES2015 assets](https://github.com/emberjs/rfcs/issues/383)

Alternatives: 
* [ember-cli-babel-polyfills](https://github.com/pzuraq/ember-cli-babel-polyfills)

Compatibility
------------------------------------------------------------------------------

* Ember.js v2.18 or above
* Ember CLI v2.13 or above
* Node.js v8 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-cli-fallback-builds
```

Usage
------------------------------------------------------------------------------


Configure your `config/targets.js`:
```
process.env.BUILD_TARGET = LEGACY | MODERN
```

Example:

`config/targets.js`
```js
const browsers = [
  'last 1 Chrome versions'
];

const isFallback = process.env.BUILD_TARGET === 'LEGACY';

if (isFallback) {
  browsers.push('ie 11');
}

module.exports = {
  browsers
};
```

run:
```
ember build:fallback --prod
```

check `index.html`

`dist/index.html` before:

```html
<body>
    <script src="/assets/vendor.js"></script>
    <script src="/assets/dummy.js"></script>
</body>
```

after:

```html
<body>
    <script src="/assets/vendor.js" type="module"></script>
    <script src="/assets/dummy.js" type="module"></script>

    <script src="/assets/vendor.fb.js" nomodule></script>
    <script src="/assets/dummy.fb.js" nomodule></script>
</body>
```

new files: `vendor.fb.js`, `dummy.fb.js` - legacy js bundles (for older browsers)

modern browser will load `script[type="module"]`, older - `script[nomodule]`

done!


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
