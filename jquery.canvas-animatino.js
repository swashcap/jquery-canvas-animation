(function (window, $) {
    'use strict';

    /**
     * Stored reference to the jQuery-wrapped `window`.
     * @type {Object}
     */
    var $window = $(window);

    var setupCanvas = function ($canvas, options) {
        var defaults = {
            /**
             * Width-to-height ratio of images. All images must adhere to this
             * ratio.
             * @type {Number}
             */
            imageRatio: 1050 / 263,

            /**
             * Desired animation frames per second.
             * @type {Number}
             */
            frameInterval: 1000 / 30,

            /**
             * [images description]
             * @type {Array}
             */
            images: [],

            /**
             * Mobile breakpoint.
             * @type {Number}
             */
            mobileBreakpoint: 768,

            tabletBreakpoint: 1024
        };

        /**
         * Sequential images.
         *
         * This is used to store the actual `<img>` objects.
         *
         * @type {Array}
         */
        var images = [];

        /**
         * Current image displayed.
         *
         * Track animation state with this by indicating which `<img>` in
         * `images` is behing shown. This variable is that image's index.
         *
         * @todo  Figure out a better way track state.
         *
         * @type {Number}
         */
        var currentImage = 0;

        /**
         * Keep track of the loaded images.
         * @type {Number}
         */
        var loadedImageCount = 0;

        /**
         * Has the animation fired?
         * @type {Boolean}
         */
        var hasAnimated = false;

        /**
         * Is the screen high resolution?
         * @return {Boolean}
         */
        var isRetina = (function () {
            if ('devicePixelRatio' in window && window.devicePixelRatio > 1) {
                return true;
            } else {
                return false;
            }
        })();

        /**
         * Canvas's 2D drawing context.
         * @type {Object}
         */
        var context = $canvas.get(0).getContext('2d');

        var $scroller, canvasWidth, canvasHeight, animationTriggerPoint,
            requestAnimationId, now, then, elapsed;

        options = $.extend(defaults, options);

        /**
         * Get an image from a URL.
         *
         * This function is used primarily to attach `onload` methods to loaded
         * images. This `onload` is able to react and set script state.
         *
         * @todo  Figure out a better way to determine when images have loaded.
         *        State shouldn't be inside this function.
         *
         * @param  {String} url   Image's full URL
         * @param  {Number} index Image's index in a sequential array
         * @return {Object}       DOM `Image` element
         */
        var getImage = function (url, index) {
            var image = new Image();
            image.onload = function () {
                // Paint the first image
                if (index === 0) {
                    paintImage(image);
                }

                loadedImageCount++;
            };
            image.src = url;

            return image;
        };

        /**
         * Paint an image to the canvas's context.
         * @param  {Object}    image DOM `Image` object
         * @return {undefined}
         */
        var paintImage = function (image) {
            if (image instanceof Image) {
                try {
                    context.drawImage(image, 0, 0, canvasWidth, canvasWidth / options.imageRatio);
                } catch (err) {
                    /** @todo  Add better error handing. */
                    console.log(err);
                }
            }
        };

        /**
         * Set the canvas's dimensions.
         * @return {undefined}
         */
        var setCanvasDimensions = function ($canvas) {
            var $parent = $canvas.parent();

            if (isRetina) {
                canvasWidth = $parent.width() * 2;
                canvasHeight = Math.ceil($parent.width() * 2 / options.imageRatio);
            } else {
                canvasWidth = $parent.width();
                canvasHeight = Math.ceil($parent.width() / options.imageRatio);
            }

            $canvas.attr('width', canvasWidth);
            $canvas.attr('height', canvasHeight);
        };

        /**
         * Get the animation's vertical offset trigger point.
         * @return {Number}
         */
        var getAnimationTriggerPoint = function () {
            var point;

            if ($window.width() < options.mobileBreakpoint) {
                point = $canvas.offset().top + $canvas.height() - 0.5 * $window.height();
            } else if ($window.width() <= options.tabletBreakpoint) {
                point = $canvas.offset().top + $canvas.height() - 0.75 * $window.height();
            } else {
                point = $canvas.offset().top + $canvas.height() - $window.height();
            }

            return point;
        };

        /**
         * Fire the animation.
         *
         * @{@link  http://codepen.io/matt-west/pen/bGdEC}
         * @{@link  http://stackoverflow.com/a/19772220}
         *
         * @return {undefined}
         */
        var animate = function () {
            requestAnimationId = requestAnimationFrame(animate);
            now = Date.now();
            elapsed = now - then;

            if (currentImage >= images.length) {
                cancelAnimationFrame(requestAnimationId);
            } else if (elapsed > options.frameInterval) {
                then = now - (elapsed % options.frameInterval);
                currentImage++;
                paintImage(images[currentImage]);
            }
        };

        /**
         * Maybe fire the animation based on the user's scroll position.
         * @return {undefined}
         */
        var maybeAnimate = function () {
            var scrollTop = $scroller.scrollTop();
            var t;

            if (
                ! hasAnimated &&
                loadedImageCount === images.length &&
                scrollTop > animationTriggerPoint
            ) {
                then = Date.now();
                hasAnimated = true;
                $scroller.unbind('scroll.automagically');

                /**
                 * Delay animation by 500ms on non-mobile viewports.
                 *
                 * @todo  Figure out a more obvious way to do this.
                 */
                if ($window.width() >= options.mobileBreakpoint) {
                    t = setTimeout(function () {
                        requestAnimationId = requestAnimationFrame(animate);
                        clearInterval(t);
                    }, 500);
                } else {
                    requestAnimationId = requestAnimationFrame(animate);
                }
            }
        };

        /**
         * Initialize the canvas.
         * @return {undefined}
         */
        return function init() {
            var t;

            // Set the `$scroller` depending on the design
            if ($window.width() <= 1024) {
                $scroller = $('body > .wrapper');
            } else {
                $scroller = $window;
            }

            /**
             * Set up the dimensions.
             *
             * These must be on a timer because the page's content is initially
             * hidden. A jQuery `fadeIn()` with no time value is used to fade in
             * the content.
             *
             * @{@link  /skin/frontend/pro/ccipair/js/ccair.js}
             */
            t = setTimeout(function () {
                setCanvasDimensions($canvas);
                animationTriggerPoint = getAnimationTriggerPoint();

                // Retry the initial paint
                paintImage(images[0]);

                clearTimeout(t);
            }, 1000);

            // Load the actual images
            for (var i = 0; i < options.images.length; i++) {
                images.push(getImage(options.images[i], i));
            }

            maybeAnimate();

            $window.resize($.throttle(function () {
                setCanvasDimensions($canvas);
                animationTriggerPoint = getAnimationTriggerPoint();

                if (hasAnimated) {
                    paintImage(images[images.length - 1]);
                } else {
                    paintImage(images[0]);
                }
            }, 60));
            $scroller.bind('scroll.automagically', $.throttle(maybeAnimate, 60));
        };
    };

    $.fn.canvasAnimation = function (options) {
        var $canvas = $(this);

        if (
            $canvas.prop('tagName') === 'CANVAS' &&
            (((options).images || []).length || 0) !== 0
        ) {
            setupCanvas($canvas, options)();
        }

        return this;
    };
})(window, window.jQuery);
