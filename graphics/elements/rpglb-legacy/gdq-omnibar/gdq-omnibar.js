(function () {
	'use strict';

	const total = nodecg.Replicant('total');
	const currentRun = nodecg.Replicant('currentRun');
	const nextRun = nodecg.Replicant('nextRun');
	const displayDuration = nodecg.bundleConfig.displayDuration;
	const currentBids = nodecg.Replicant('currentBids');
	const currentPrizes = nodecg.Replicant('currentPrizes');
	const currentScene = nodecg.Replicant('currentScene');

	Polymer({
		is: 'gdq-omnibar',

		properties: {
			state: {
				type: Object,
				value() {
					return {
						totalShowing: true,
						labelShowing: false
					};
				}
			},
			lastShownGrandPrize: {
				type: Object
			},
			label: String
		},

		showInfoNode: function(node, text, cb) {
            var tl = new TimelineLite();

            if (node === this.$.infotop && this.label != null) {
                var label = '<span class="omnilabel">' + this.label + ':&nbsp;</span>';
                text = label + text;
            }

            tl.to(node, 0.33, {
                y: 20,
                opacity: 0,
                ease: Power3.easeInOut
            });

            tl.to(node, 0.01, {
                y: -20,
                ease: Linear.none,
                onComplete: function() {
                    node.innerHTML = text;
                }.bind(this)
            });

            tl.to(node, 0.33, {
                y: 0,
                opacity: 1,
                ease: Power3.easeInOut
            });

            return tl;
        },

        showInfo: function(top, bottom) {
            this.showInfoNode(this.$.infotop, top);
            this.showInfoNode(this.$.infobottom, bottom);
        },

        showLabel: function(label) {
            this.label = label;
        },

        showPrize: function(prize) {
            // GSAP is dumb with `call` sometimes. Putting this in a near-zero duration tween seems to be more reliable.
            this.timeline.to({}, 0.01, {
                onComplete: function() {
                    var donorText = 'Provided by ' + prize.provided;
                    donorText += ' (Min. Donation: ' + prize.minimumbid + ')';

                    this.showInfoNode(this.$.infotop, donorText);

                    var prizeText = '';
                    if (prize.grand) {
                        prizeText = 'Grand Prize: ' + prize.description;
                    } else {
                        prizeText = prize.description;
                    }

                    this.showInfoNode(this.$.infobottom, prizeText);
                }.bind(this)
            });

            // Give the prize some time to show
            this.timeline.to({}, displayDuration, {});
        },

        allPrizesRep: nodecg.Replicant('allPrizes'),

        showCurrentPrizes: function() {
        	const currentGrandPrizes = currentPrizes.value.filter(prize => prize.grand);
        	const currentNormalPrizes = currentPrizes.value.filter(prize => !prize.grand);

            if (currentGrandPrizes.length > 0 || currentNormalPrizes.length > 0) {
                var prizesToDisplay = currentNormalPrizes.slice(0);
                this.timeline.to({}, 0.3, {
                    onStart: function() {
                        this.showLabel('RAFFLE\nPRIZE', 30);
                    }.bind(this)
                });

                if (currentGrandPrizes.length) {
                    // Figure out what grand prize to show in this batch.
                    var lastShownGrandPrizeIdx = currentGrandPrizes.indexOf(this.lastShownGrandPrize);
                    var nextGrandPrizeIdx = lastShownGrandPrizeIdx >= currentGrandPrizes.length - 1
                        ? 0 : lastShownGrandPrizeIdx + 1;
                    var nextGrandPrize = currentGrandPrizes[nextGrandPrizeIdx];

                    if (nextGrandPrize) {
                        prizesToDisplay.unshift(nextGrandPrize);
                        this.lastShownGrandPrize = nextGrandPrize;
                    }
                }

                // Loop over each prize and queue it up on the timeline
                prizesToDisplay.forEach(function(prize) {
                    this.showPrize(prize);
                }.bind(this));
            }

            this.timeline.to({}, 0.3, {
                onStart: function() {
                    this.showLabel(null);
                    this.showInfo('', '');
                }.bind(this),
                onComplete: this.showUpNext.bind(this)
            });
        },

        showBid: function(bid) {
            var mainLine1Text = bid.speedrun + ' - ' + bid.description;

            // GSAP is dumb with `call` sometimes. Putting this in a near-zero duration tween seems to be more reliable.
            this.timeline.to({}, 0.01, {
                onComplete: function() {
                    this.showInfoNode(this.$.infotop, mainLine1Text);
                }.bind(this)
            });

            // If this is a donation war, up to three options for it.
            // Else, it must be a normal incentive, so show its total amount raised and its goal.
            if (bid.options) {
                // If there are no options yet, display a message.
                if (bid.options.length === 0) {
                    this.timeline.call(function() {
                        this.showInfoNode(this.$.infobottom, 'Be the first to bid!');
                    }.bind(this), null, null);
                } else {
                    bid.options.forEach(function(option, index) {
                        if (index > 2) return;

                        this.timeline.call(function() {
                            // If this bid is closed, the first option (the winner)
                            // should be green and the rest should be red.
                            var mainLine2Text = (index + 1) + '. ' + (option.description || option.name)
                                + ' - ' + option.total;
                            this.showInfoNode(this.$.infobottom, mainLine2Text);
                        }.bind(this), null, null, "+=" + (index ? displayDuration/2.5 : 0));
                    }.bind(this));
                }
            } else {
                this.timeline.call(function() {
                    this.showInfoNode(this.$.infobottom, bid.total + ' / ' + bid.goal);
                }.bind(this), null, null, '+=0.08');
            }

            // Give the bid some time to show
            this.timeline.to({}, displayDuration, {});
        },

        showCurrentBids: function() {
            if (currentBids.value.length > 0) {
                var showedLabel = false;

                // Figure out what bids to display in this batch
                var bidsToDisplay = [];

                currentBids.value.forEach(function(bid) {
                    // Don't show closed bids in the automatic rotation.
                    if (bid.state.toLowerCase() === 'closed') return;

                    // We have at least one bid to show, so show the label
                    if (!showedLabel) {
                        showedLabel = true;
                        this.timeline.to({}, 0.3, {
                            onStart: function() {
                                this.showLabel('DONATION\nINCENTIVE', 24);
                            }.bind(this)
                        });
                    }

                    // If we have already have our three bids determined, we still need to check
                    // if any of the remaining bids are for the same speedrun as the third bid.
                    // This ensures that we are never displaying a partial list of bids for a given speedrun.
                    if (bidsToDisplay.length < 3) {
                        bidsToDisplay.push(bid);
                    } else if (bid.speedrun === bidsToDisplay[bidsToDisplay.length - 1].speedrun) {
                        bidsToDisplay.push(bid);
                    }
                }.bind(this));

                // Loop over each bid and queue it up on the timeline
                bidsToDisplay.forEach(function(bid) {
                    this.showBid(bid);
                }.bind(this));
            }

            this.timeline.to({}, 0.3, {
                onStart: function() {
                    this.showLabel(null);
                    this.showInfo('', '');
                }.bind(this),
                onComplete: this.showCurrentPrizes.bind(this)
            });
        },

        concatRunners: function(runners) {
            if (!runners || !Array.isArray(runners)) {
                return '?';
            }

            let concatenatedRunners;
            if (runners.length === 1) {
                concatenatedRunners = runners[0].name;
            } else {
                concatenatedRunners = runners.slice(1).reduce((prev, curr, index, array) => {
                    if (index === array.length - 1) {
                        return `${prev} & ${curr.name}`;
                    }

                    return `${prev}, ${curr.name}`;
                }, runners[0].name);
            }

            return concatenatedRunners;
        },

        showUpNext: function() {
            let upNextRun = nextRun.value;

            if (currentScene.value === 'break') {
                upNextRun = currentRun.value;
            }

            if (upNextRun) {
                this.timeline.to({}, 0.3, {
                    onStart: function() {
                        this.showLabel('UP NEXT', 32);
                    }.bind(this)
                });

                // GSAP is dumb with `call` sometimes. Putting this in a near-zero duration tween seems to be more reliable.
                this.timeline.to({}, 0.01, {
                    onComplete: function() {
                        /* Depending on how we enter the very end of the schedule, we might end up in this func
                         * after window.nextRun has been set to null. In that case, we immediately clear the
                         * timeline and bail out to social media again.
                         */
                        const upNextRun = currentScene.value === 'break' ? currentRun.value : nextRun.value;
                        if (upNextRun) {
                            this.showInfo(this.concatRunners(upNextRun.runners), upNextRun.name + ' - ' + upNextRun.category);
                        } else {
                            this.timeline.clear();

                            this.timeline.to({}, 0.3, {
                                onStart: function() {
                                    this.showInfo('', '');
                                }.bind(this),
                                onComplete: this.showSocialMedia.bind(this)
                            });
                        }
                    }.bind(this)
                });

                // Give it some time to show
                this.timeline.to({}, displayDuration, {});
            }

            this.timeline.to({}, 0.3, {
                onStart: function() {
                    this.showLabel(null);
                    this.showInfo('', '');
                }.bind(this),
                onComplete: this.showCTA.bind(this)
            });
        },

        showSocialMedia: function() {
            var socialText = '<img class="social www">RPGLimitBreak.com';
            socialText += '<div style="width:1.5ex;display:inline-block"></div>';
            socialText += '<img class="social twitch"><img class="social twitter">RPGLimitBreak';

            this.showInfo('Spread the word on social media with #RPGLB2017', socialText);
            this.timeline.to({}, displayDuration, {});
            this.timeline.to({}, 0.3, {
                onStart: function() {
                    this.showInfo('', '');
                }.bind(this),
                onComplete: this.showCurrentBids.bind(this)
            });
        },

        layoutState: nodecg.Replicant('layoutState'),

        showCTA: function() {
            if (currentScene.value != '3ds' &&
                currentScene.value != 'ds' &&
                currentScene.value != 'break') {
                this.showSocialMedia();
                return;
            }

            this.timeline.call(function() {
                this.showInfo('', '');
            }.bind(this), null, null, '+=0.01');

            this.timeline.call(function() {
                var text = 'We support the National Alliance on Mental Illness';
                this.showInfoNode(this.$.infobottom, text);
            }.bind(this), null, null, '+=0.70');

            this.timeline.call(function() {
                var text = '&nbsp;Donate at rpglimitbreak.com/donate';
                this.showInfoNode(this.$.infobottom, text);
            }.bind(this), null, null, '+=' + displayDuration);

            this.timeline.to({}, 0.3, {
                onStart: function() {
                    this.showInfo('', '');
                }.bind(this),
                onComplete: function() {
                    this.showSocialMedia();
                }.bind(this),
            }, '+=' + displayDuration);
        },

        totalChanged: function(newVal) {
        	if (!this._totalInitialized) {
				this._totalInitialized = true;
				this.$.amount.rawValue = newVal.raw;
				this.$.amount.textContent = newVal.raw.toLocaleString('en-US', {
					maximumFractionDigits: 0
				});
				return;
			}

			const TIME_PER_DOLLAR = 0.03;
            const delta = newVal.raw - this.$.amount.rawValue;
            const duration = Math.min(delta * TIME_PER_DOLLAR, 3);
            TweenLite.to(this.$.amount, duration, {
                rawValue: newVal.raw,
                ease: Power2.easeOut,
                onUpdate: function() {
                	this.$.amount.textContent = this.$.amount.rawValue.toLocaleString('en-US', {
                		maximumFractionDigits: 0
                	});
                }.bind(this)
            });
        },

        ready: function() {
            this.timeline = new TimelineLite({autoRemoveChildren: true});
            this.showSocialMedia();

            this.$.amount.rawValue = 0;
            total.on('change', this.totalChanged.bind(this));
        }
	});
})();
