(function() {
    'use strict';

    const currentRun = nodecg.Replicant('currentRun');
    const stopwatch = nodecg.Replicant('stopwatch');
    const scheduleRep = nodecg.Replicant('schedule');

    Polymer({
    /* jshint +W064 */

        is: 'rpglb-nameplate',

        properties: {
            index: Number,
            compact: Boolean,
            supercompact: Boolean,
            name: String,
            stream: String,
            twitter: String
        },

        show: function(x, y, w, h, style, cactuar) {
            if (!style) {
                style = "full";
            }

            if (cactuar === undefined) {
                cactuar = true;
            }

            if (style == "full") {
                this.set_full();
            } else if (style == "compact") {
                this.set_compact();
            } else if (style == "supercompact") {
                this.set_supercompact();
            } else if (style == "microcompact") {
                // doesn't actually matter if we do anything here
                // this will only ever be used on the SD4 layout,
                // where the nameplates will retain one form
                this.set_supercompact();
            }

            if (style == "microcompact") {
                this.$.cactuar.style.height = '27px';
                this.$.cactuar.style.width = '27px';
                this.$['cactuar-bg'].style.height = '23px';
                this.$['cactuar-bg'].style.width = '23px';
                this.$['cactuar-bg'].style.margin = '2px';
                this.$['cactuar-img'].style.height = '21px';
                this.$['cactuar-img'].style.top = '1px';
                this.$['cactuar-img'].style.left = '2px';
                this.$.info.style.left = '27px';
                this.$.contents.style.top = '5%';
                this.$.contents.style.left = '4px';
                this.$.runner.style.fontSize = '18px';
            } else if (style == "supercompact") {
                this.$.runner.style.fontSize = '48px';
                this.$.contents.style.top = '12%';
                this.style.transformOrigin = 'top left';
                this.style.transform = "scale(0.5, 0.5)";
                this.$.social.style.display = 'none';
                this.$.info.style.left = '80px';
            } else {
                this.$.runner.style.fontSize = '36px';
                this.$.contents.style.top = '8%';
                this.style.transform = '';
                this.$.social.style.display = 'block';
                this.$.info.style.left = '80px';
            }

            if (!cactuar) {
                this.$.cactuar.style.display = 'none';
                this.$.info.style.left = '0px';
            } else {
                this.$.cactuar.style.display = 'inline-block';
            }

            this.style.display = 'block';
            this.style.left = x + 'px';
            this.style.top = y + 'px';
            this.style.width = w + 'px';
            this.style.height = h + 'px';
            this.restartTimeline();
        },

        hide: function() {
            this.style.display = 'none';
        },

        set_full: function() {
            this.compact = false;
            this.supercompact = false;
        },

        set_compact: function() {
            this.compact = true;
            this.supercompact = false;
        },

        set_supercompact: function() {
            this.compact = true;
            this.supercompact = true;
        },

        timeline: null,

        scaleContent: function(node) {
            var scaleMod = 0.00;

            if (node.getBoundingClientRect().right == 0) {
                return;
            }

            // there is a bug here where this will not properly scale the results of a swapping entry (e.g. in compact/supercompact frames)
            // we just have to address this by strategically fixing runners with swapping names
            while ((node.getBoundingClientRect().right + 10) > this.$.info.getBoundingClientRect().right) {
                scaleMod += 0.005;
                node.style.transform = 'scale(' + (1-2*scaleMod) + ',' + (1-scaleMod) + ')';
            }
        },

        setContent: function(node, content) {
            node.style.transformOrigin = 'left 50% 0px';
            node.style.transform = '';
            node.innerHTML = content;
            textFit(node, {maxFontSize: 48});
        },

        buildTimeline: function(node, to) {
            var current = node.innerHTML;

            this.timeline.to(node, 0.33, {
                alpha: 0.0,
                y: 10,
                ease: Power3.easeInOut,
                onComplete: function() {
                    this.setContent(node, to);
                }.bind(this)
            }, '+=2');

            this.timeline.to(node, 0.01, {
                y: -10,
                ease: Linear.none
            });

            this.timeline.to(node, 0.33, {
                alpha: 1.0,
                y: 0,
                ease: Power3.easeInOut,
                onComplete: function() {
                    this.buildTimeline(node, current);
                }.bind(this)
            });
        },

        restartTimeline: function() {
            if (this.timeline) {
                this.timeline.clear();
            }
            this.timeline = new TimelineLite({'autoRemoveChildren': true});

            var twitchIcon = '<img class="social twitch" />';
            var twitterIcon = '<img class="social twitter" />';
            var buffer = '<div style="display:inline-block;width:16px"></div>';

            // do stuff
            if (this.supercompact) {
                if (this.name && this.stream && this.name.toLowerCase() == this.stream.toLowerCase()) {
                    // join same runner and twitch name into one display
                    this.setContent(this.$.runner, twitchIcon + this.stream);
                } else if (!this.stream) {
                    // only runner name, no timeline needed
                    this.setContent(this.$.runner, this.name);
                } else {
                    // alternate between runner and twitch
                    this.setContent(this.$.runner, this.name);
                    this.buildTimeline(this.$.runner, twitchIcon + this.stream);
                }
            } else if (this.compact) {
                // compact shows runner, alternates twitch and twitter if needed
                this.setContent(this.$.runner, this.name);

                if (this.stream && this.twitter && this.stream.toLowerCase() == this.twitter.toLowerCase()) {
                    // if they match, no timeline needed
                    this.setContent(this.$.social, twitchIcon + twitterIcon + this.twitter);
                } else if (this.stream && !this.twitter) {
                    this.setContent(this.$.social, twitchIcon + this.stream);
                } else if (!this.stream && this.twitter) {
                    this.setContent(this.$.social, twitterIcon + this.twitter);
                } else if (this.stream && this.twitter) {
                    // if they don't match, alternate between them
                    this.setContent(this.$.social, twitchIcon + this.stream);
                    this.buildTimeline(this.$.social, twitterIcon + this.twitter);
                } else {
                    this.setContent(this.$.social, '');
                }
            } else {
                // not compact, no timeline needed, show all
                this.setContent(this.$.runner, this.name);

                console.log(this.name, this.stream, this.twitter);
                if (this.stream && this.twitter && this.stream.toLowerCase() == this.twitter.toLowerCase()) {
                    console.log('is this happening?');
                    this.setContent(this.$.social, twitchIcon + twitterIcon + this.twitter);
                } else if (this.stream && !this.twitter) {
                    console.log('or this?');
                    this.setContent(this.$.social, twitchIcon + this.stream);
                } else if (!this.stream && this.twitter) {
                    this.setContent(this.$.social, twitterIcon + this.twitter);
                } else if (this.stream && this.twitter) {
                    this.setContent(this.$.social, twitchIcon + this.stream + buffer + twitterIcon + this.twitter);
                } else {
                    this.setContent(this.$.social, '');
                }
            }
        },

        setDetails: function(name, stream, twitter) {
            this.name = name;
            this.stream = stream;
            this.twitter = twitter;
            this.restartTimeline();
        },

        handleCurrentRunChange: function(name, stream, twitter) {
            var tl = new TimelineLite();

            tl.to(this.$.contents, 0.33, {
                alpha: 0.0,
                y: 20,
                ease: Power3.easeInOut,
                onComplete: function() {
                    this.setDetails(name, stream, twitter);
                }.bind(this)
            });

            tl.to(this.$.contents, 0.01, {
                y: -20,
                ease: Linear.none
            });

            tl.to(this.$.contents, 0.33, {
                alpha: 1.0,
                y: 0,
                ease: Power3.easeInOut
            });
        },

        ready: function() {
            currentRun.on('change', function(newVal) {
                var runner = newVal.runners[this.index];
                if (runner) {
                    this.handleCurrentRunChange(runner.name, runner.stream, runner.twitter);
                } else {
                    this.handleCurrentRunChange('', '', '');
                }
            }.bind(this));
        }
    });
})();