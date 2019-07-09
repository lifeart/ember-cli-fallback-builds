ember-cli-fallback-builds
==============================================================================

This addon allow to have 2 builds (for modern and legacy browsers) in one time.

(module, nomodule)

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

done!


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
