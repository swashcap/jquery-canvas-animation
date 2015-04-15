# jQuery Canvas Animation

_Easy canvas image sequence animation wrapped in a jQuery plugin._

## Plugin Use

Use the plugin like so:

```js
$('#my-canvas').canvasAnimation({
    frameInterval: 1000 / 60,
    images: [
        '/path/to/image-001.jpg',
        '/path/to/image-002.jpg',
        '/path/to/image-003.jpg',
        // ...
        '/path/to/image-100.jpg'
    ],
    imageRatio: 640 / 320,
});
```
