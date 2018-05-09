(function() {
    'use strict';

    const currentRun = nodecg.Replicant('currentRun');
    const stopwatch = nodecg.Replicant('stopwatch');

    Polymer({
    /* jshint +W064 */

        is: 'rpglb-gameplate',

        properties: {
            small: Boolean,
        },

        setStyle: function(x, y, w, h, alt, small) {
            this.style.left = x + 'px';
            this.style.top = y + 'px';
            this.style.width = w + 'px';
            this.style.height = h + 'px';
            this.style.display = 'block';

            if (alt) {
                this.$.time.style.top = '80px';
                this.$.time.style.width = '214px';
                this.$.time.style.background = 'rgba(0, 0, 0, 0)';
                this.$["contents-bg"].style.right = '0';
                this.$["contents-bg"].style.background = '';
            } else {
                this.$.time.style.top = '0px';
                this.$.time.style.width = '175px';
                this.$.time.style.background = '#66aaa3';
                this.$["contents-bg"].style.right = '175px';
                this.$["contents-bg"].style.background = '#ffffff';
            }

            if (small) {
                this.small = true;
                this.$.time.style.top = '56px';
                this.$.time.style.height = '64px';
                this.$.console.style.height = '56px';
                this.$.console.style.width = '56px';
                this.$['console-bg'].style.height = '48px';
                this.$['console-bg'].style.width = '48px';
                this.$['console-bg'].style.margin = '4px';
                this.$['contents-bg'].style.left = '56px';
                this.$['contents-bg'].style.height = '56px';
                this.$.category.style.display = 'none';
                this.$.estimate.style.display = 'none';
                this.$.timer.style.fontSize = '48px';
            }

            this.scaleContent(this.$["contents-bg"], this.$.category);
            this.scaleContent(this.$["contents-bg"], this.$.game);
        },

        hide: function() {
            this.style.display = 'none';
        },

        scaleContent: function(parent, node) {
            var scaleMod = 0.00;
            node.style.transformOrigin = 'left 50% 0px';
            node.style.transform = '';

            if (node.getBoundingClientRect().right == 0) {
                return;
            }

            while ((node.getBoundingClientRect().right + 10) > parent.getBoundingClientRect().right) {
                scaleMod += 0.005;
                node.style.transform = 'scale(' + (1-2*scaleMod) + ',' + (1-scaleMod) + ')';
            }
        },

        setContent: function(parent, node, content) {
            node.innerHTML = content;
            this.scaleContent(parent, node);
        },

        setGame: function(game, category) {
            this.setContent(this.$["contents-bg"], this.$.category, 'Category: ' + category);
            this.setContent(this.$["contents-bg"], this.$.game, game);
        },

        setEstimate: function(estimate) {
            this.setContent(this.$.time, this.$.estimate, 'Estimate: ' + estimate);
        },

        setConsole: function(console) {
            console = console.toLowerCase();
            var path = "/graphics/rpglb17-layouts/img/consoles/" + console + ".png";

            if (this.small) {
                this.$['console-bg'].innerHTML = '<img src="' + path + '" style="height:40px;position:absolute;top:4px;left:4px" />';
            } else {
                this.$["console-bg"].innerHTML = '<img src="' + path + '" style="height:44px;position:absolute;top:10px;left:10px" />';
            }
        },

        handleCurrentRunChange: function(newVal) {
            var tl = new TimelineLite();

            tl.to(this.$.contents, 0.33, {
                alpha: 0.0,
                y: 40,
                ease: Power3.easeInOut,
                onComplete: function() {
                    this.setGame(newVal.name, newVal.category);
                }.bind(this)
            });

            tl.to(this.$.contents, 0.01, {
                y: -40,
                ease: Linear.none
            });

            tl.to(this.$.contents, 0.33, {
                alpha: 1.0,
                y: 0,
                ease: Power3.easeInOut
            });

            tl = new TimelineLite();

            tl.to(this.$.estimate, 0.33, {
                alpha: 0.0,
                y: 20,
                ease: Power3.easeInOut,
                onComplete: function() {
                    this.setEstimate(newVal.estimate);
                }.bind(this)
            });

            tl.to(this.$.estimate, 0.01, {
                y: -20,
                ease: Linear.none
            });

            tl.to(this.$.estimate, 0.33, {
                alpha: 1.0,
                y: 0,
                ease: Power3.easeInOut
            });

            tl = new TimelineLite();

            tl.to(this.$["console-bg"], 0.33, {
                alpha: 0.0,
                ease: Power3.easeInOut,
                onComplete: function() {
                    this.setConsole(newVal.console);
                }.bind(this)
            });

            tl.to(this.$["console-bg"], 0.34, {
                alpha: 1.0,
                ease: Power3.easeInOut
            });
        },

        ready: function() {
            stopwatch.on('change', function(newVal, oldVal) {
                // Just show the first one
                var stopwatch = newVal;

                this.$.timer.style.color = '#232020';
                this.$.timer.innerText = stopwatch.formatted;

                switch (stopwatch.state) {
                    case 'paused':
                        this.$.timer.style.color = '#808080';
                        break;
                    case 'finished':
                        this.$.timer.style.color = '#4b669b';
                        break;
                }
            }.bind(this));

            currentRun.on('change', this.handleCurrentRunChange.bind(this));
        }
    });
})();