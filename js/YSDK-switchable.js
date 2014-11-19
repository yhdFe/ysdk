YSDK.add(function() {
    var DISPLAY = "display", BLOCK = "block", NONE = "none", FORWARD = "forward", BACKWARD = "backward", DOT = ".", EVENT_INIT = "init", EVENT_BEFORE_SWITCH = "beforeSwitch", EVENT_SWITCH = "switch", CLS_PREFIX = "ks-switchable-";
    function Switchable(container, config) {
        var self = this;
        config = config || {};
        if (!("markupType" in config)) {
            if (config.panelCls) {
                config.markupType = 1;
            } else if (config.panels) {
                config.markupType = 2;
            }
        }
        config = YSDK.merge(Switchable.Config, config);
        self.container = $(container);
        self.config = config;
        self.activeIndex = config.activeIndex;
        console.log(self);
        self._init();
    }
    Switchable.Config = {
        markupType:0,
        navCls:CLS_PREFIX + "nav",
        contentCls:CLS_PREFIX + "content",
        triggerCls:CLS_PREFIX + "trigger",
        panelCls:CLS_PREFIX + "panel",
        triggers:[],
        panels:[],
        hasTriggers:true,
        triggerType:"mouse",
        delay:.1,
        activeIndex:0,
        activeTriggerCls:"ks-active",
        steps:1,
        viewSize:[]
    };
    Switchable.Plugins = [];
    Switchable.prototype = {
        _init:function() {
            var self = this, cfg = self.config;
            self._parseMarkup();
            if (cfg.switchTo) {
                self.switchTo(cfg.switchTo);
            }
            if (cfg.hasTriggers) {
                self._bindTriggers();
            }
            $.each(Switchable.Plugins, function(i, plugin) {
                if (plugin.init) {
                    plugin.init(self);
                }
            });
            $(self).trigger(EVENT_INIT);
        },
        _parseMarkup:function() {
            var self = this, container = self.container, cfg = self.config, nav, content, triggers = [], panels = [], i, n, m;
            switch (cfg.markupType) {
              case 0:
                nav = $(DOT + cfg.navCls, container);
                if (nav) triggers = $(nav).children();
                content = $(DOT + cfg.contentCls, container);
                panels = $(content).children();
                break;

              case 1:
                triggers = $(DOT + cfg.triggerCls, container);
                panels = $(DOT + cfg.panelCls, container);
                break;

              case 2:
                triggers = cfg.triggers;
                panels = cfg.panels;
                break;
            }
            n = panels.length;
            self.length = n / cfg.steps;
            if (cfg.hasTriggers && n > 0 && triggers.length === 0) {
                triggers = self._generateTriggersMarkup(self.length);
            }
            self.triggers = $.makeArray(triggers);
            self.panels = $.makeArray(panels);
            self.content = content || panels[0].parentNode;
        },
        _generateTriggersMarkup:function(len) {
            var self = this, cfg = self.config, ul = $("<ul>"), li, i;
            ul.addClass(cfg.navCls);
            for (i = 0; i < len; i++) {
                li = $("<li>");
                if (i === self.activeIndex) {
                    li.addClass(cfg.activeTriggerCls);
                }
                li.html(i + 1);
                ul.append(li);
            }
            self.container.append(ul);
            return $(ul).children();
        },
        _bindTriggers:function() {
            var self = this, cfg = self.config, triggers = self.triggers, trigger, i, len = triggers.length;
            for (i = 0; i < len; i++) {
                (function(index) {
                    trigger = triggers[index];
                    $(trigger).bind("click", function() {
                        self._onFocusTrigger(index);
                    });
                    if (cfg.triggerType === "mouse") {
                        $(trigger).bind("mouseenter", function() {
                            self._onMouseEnterTrigger(index);
                        });
                        $(trigger).bind("mouseleave", function() {
                            self._onMouseLeaveTrigger(index);
                        });
                    }
                })(i);
            }
        },
        _onFocusTrigger:function(index) {
            var self = this;
            if (!self._triggerIsValid(index)) return;
            this._cancelSwitchTimer();
            self.switchTo(index);
        },
        _onMouseEnterTrigger:function(index) {
            var self = this;
            if (!self._triggerIsValid(index)) return;
            self.switchTimer = setTimeout(function() {
                self.switchTo(index);
            }, self.config.delay * 1e3);
        },
        _onMouseLeaveTrigger:function() {
            this._cancelSwitchTimer();
        },
        _triggerIsValid:function(index) {
            return this.activeIndex !== index;
        },
        _cancelSwitchTimer:function() {
            var self = this;
            if (self.switchTimer) {
                clearTimeout(self.switchTimer);
                self.switchTimer = undefined;
            }
        },
        switchTo:function(index, direction) {
            var self = this, cfg = self.config, triggers = self.triggers, panels = self.panels, activeIndex = self.activeIndex, steps = cfg.steps, fromIndex = activeIndex * steps, toIndex = index * steps;
            if (!self._triggerIsValid(index)) return self;
            if ($(self).trigger(EVENT_BEFORE_SWITCH, {
                toIndex:index
            }) === false) return self;
            if (cfg.hasTriggers) {
                self._switchTrigger(activeIndex > -1 ? triggers[activeIndex] :null, triggers[index]);
            }
            if (direction === undefined) {
                direction = index > activeIndex ? FORWARD :BACKWARD;
            }
            self._switchView(panels.slice(fromIndex, fromIndex + steps), panels.slice(toIndex, toIndex + steps), index, direction);
            self.activeIndex = index;
            return self;
        },
        _switchTrigger:function(fromTrigger, toTrigger) {
            var activeTriggerCls = this.config.activeTriggerCls;
            if (fromTrigger) $(fromTrigger).removeClass(activeTriggerCls);
            $(toTrigger).addClass(activeTriggerCls);
        },
        _switchView:function(fromPanels, toPanels, index) {
            $(fromPanels).css(DISPLAY, NONE);
            $(toPanels).css(DISPLAY, BLOCK);
            this._fireOnSwitch(index);
        },
        _fireOnSwitch:function(index) {
            $(this).trigger(EVENT_SWITCH, {
                currentIndex:index
            });
        },
        prev:function() {
            var self = this, activeIndex = self.activeIndex;
            self.switchTo(activeIndex > 0 ? activeIndex - 1 :self.length - 1, BACKWARD);
        },
        next:function() {
            var self = this, activeIndex = self.activeIndex;
            self.switchTo(activeIndex < self.length - 1 ? activeIndex + 1 :0, FORWARD);
        }
    };
    YSDK.Switchable = Switchable;
});

YSDK.add(function() {
    var Switchable = YSDK.Switchable;
    YSDK.mix(Switchable.Config, {
        autoplay:false,
        interval:5,
        pauseOnHover:true
    });
    Switchable.Plugins.push({
        name:"autoplay",
        init:function(host) {
            var cfg = host.config, interval = cfg.interval * 1e3, timer;
            if (!cfg.autoplay) return;
            if (cfg.pauseOnHover) {
                $(host.container).bind("mouseenter", function() {
                    if (timer) {
                        clearInterval(timer);
                        timer = undefined;
                    }
                    host.paused = true;
                });
                $(host.container).bind("mouseleave", function() {
                    host.paused = false;
                    startAutoplay();
                });
            }
            function startAutoplay() {
                timer = setInterval(function() {
                    if (host.paused) return;
                    host.switchTo(host.activeIndex < host.length - 1 ? host.activeIndex + 1 :0, "forward");
                }, interval);
            }
            startAutoplay();
        }
    });
});

YSDK.add(function() {
    var DISPLAY = "display", BLOCK = "block", NONE = "none", OPACITY = "opacity", Z_INDEX = "z-index", POSITION = "position", RELATIVE = "relative", ABSOLUTE = "absolute", SCROLLX = "scrollx", SCROLLY = "scrolly", FADE = "fade", LEFT = "left", TOP = "top", FLOAT = "float", PX = "px", Switchable = YSDK.Switchable, Effects;
    YSDK.mix(Switchable.Config, {
        effect:NONE,
        duration:500,
        easing:"easeNone",
        nativeAnim:true
    });
    Switchable.Effects = {
        none:function(fromEls, toEls, callback) {
            $(fromEls).css(DISPLAY, NONE);
            $(toEls).css(DISPLAY, BLOCK);
            callback();
        },
        fade:function(fromEls, toEls, callback) {
            if (fromEls.length !== 1) {}
            var self = this, cfg = self.config, fromEl = fromEls[0], toEl = toEls[0];
            if (self.anim) $(self).stop(true);
            $(toEl).css(OPACITY, 1);
            self.anim = $(fromEl).animate({
                opacity:0
            }, {
                duration:cfg.duration,
                easing:cfg.easing
            }, function() {
                self.anim = undefined;
                $(toEl).css(Z_INDEX, 9);
                $(fromEl).css(Z_INDEX, 1);
                callback();
            });
        },
        scroll:function(fromEls, toEls, callback, index) {
            var self = this, cfg = self.config, isX = cfg.effect === SCROLLX, diff = self.viewSize[isX ? 0 :1] * index, props = {};
            props[isX ? LEFT :TOP] = -diff + PX;
            if (self.anim) $(self).stop(true);
            self.anim = $(self.content).animate(props, {
                duration:cfg.duration,
                easing:cfg.easing
            }, function() {
                self.anim = undefined;
                callback();
            });
        }
    };
    Effects = Switchable.Effects;
    Effects[SCROLLX] = Effects[SCROLLY] = Effects.scroll;
    Switchable.Plugins.push({
        name:"effect",
        init:function(host) {
            var cfg = host.config, effect = cfg.effect, panels = host.panels, content = host.content, steps = cfg.steps, activeIndex = host.activeIndex, len = panels.length;
            host.viewSize = [ cfg.viewSize[0] || panels[0].offsetWidth * steps, cfg.viewSize[1] || panels[0].offsetHeight * steps ];
            if (effect !== NONE) {
                $.each(panels, function(i, panel) {
                    $(panel).css(DISPLAY, BLOCK);
                });
                switch (effect) {
                  case SCROLLX:
                  case SCROLLY:
                    $(content).css(POSITION, ABSOLUTE);
                    $(content.parentNode).css(POSITION, RELATIVE);
                    if (effect === SCROLLX) {
                        $(panels).css(FLOAT, LEFT);
                        $(content).width(host.viewSize[0] * (len / steps));
                    }
                    break;

                  case FADE:
                    var min = activeIndex * steps, max = min + steps - 1, isActivePanel;
                    $.each(panels, function(i, panel) {
                        isActivePanel = i >= min && i <= max;
                        $(panel).css({
                            opacity:isActivePanel ? 1 :0,
                            position:ABSOLUTE,
                            zIndex:isActivePanel ? 9 :1
                        });
                    });
                    break;
                }
            }
        }
    });
    Switchable.prototype._switchView = function(fromEls, toEls, index, direction) {
        var self = this, cfg = self.config, effect = cfg.effect, fn = $.isFunction(effect) ? effect :Effects[effect];
        fn.call(self, fromEls, toEls, function() {
            self._fireOnSwitch(index);
        }, index, direction);
    };
});

YSDK.add(function() {
    var POSITION = "position", RELATIVE = "relative", LEFT = "left", TOP = "top", EMPTY = "", PX = "px", FORWARD = "forward", BACKWARD = "backward", SCROLLX = "scrollx", SCROLLY = "scrolly", Switchable = YSDK.Switchable;
    YSDK.mix(Switchable.Config, {
        circular:false
    });
    function circularScroll(fromEls, toEls, callback, index, direction) {
        var self = this, cfg = self.config, len = self.length, activeIndex = self.activeIndex, isX = cfg.scrollType === SCROLLX, prop = isX ? LEFT :TOP, viewDiff = self.viewSize[isX ? 0 :1], diff = -viewDiff * index, props = {}, isCritical, isBackward = direction === BACKWARD;
        isCritical = isBackward && activeIndex === 0 && index === len - 1 || direction === FORWARD && activeIndex === len - 1 && index === 0;
        if (isCritical) {
            diff = adjustPosition.call(self, self.panels, index, isBackward, prop, viewDiff);
        }
        props[prop] = diff + PX;
        if (self.anim) $(this).stop();
        self.anim = $(self.content).animate(props, {
            duration:cfg.duration,
            easing:cfg.easing
        }, function() {
            if (isCritical) {
                resetPosition.call(self, self.panels, index, isBackward, prop, viewDiff);
            }
            self.anim = undefined;
            callback();
        });
    }
    function adjustPosition(panels, index, isBackward, prop, viewDiff) {
        var self = this, cfg = self.config, steps = cfg.steps, len = self.length, start = isBackward ? len - 1 :0, from = start * steps, to = (start + 1) * steps, i;
        for (i = from; i < to; i++) {
            $(panels[i]).css(POSITION, RELATIVE);
            $(panels[i]).css(prop, (isBackward ? -1 :1) * viewDiff * len);
        }
        return isBackward ? viewDiff :-viewDiff * len;
    }
    function resetPosition(panels, index, isBackward, prop, viewDiff) {
        var self = this, cfg = self.config, steps = cfg.steps, len = self.length, start = isBackward ? len - 1 :0, from = start * steps, to = (start + 1) * steps, i;
        for (i = from; i < to; i++) {
            $(panels[i]).css(POSITION, EMPTY);
            $(panels[i]).css(prop, EMPTY);
        }
        $(self.content).css(prop, isBackward ? -viewDiff * (len - 1) :EMPTY);
    }
    Switchable.Plugins.push({
        name:"circular",
        init:function(host) {
            var cfg = host.config;
            if (cfg.circular && (cfg.effect === SCROLLX || cfg.effect === SCROLLY)) {
                cfg.scrollType = cfg.effect;
                cfg.effect = circularScroll;
            }
        }
    });
});

YSDK.add(function() {
    var EVENT_BEFORE_SWITCH = "beforeSwitch", IMG_SRC = "img-src", AREA_DATA = "area-data", FLAGS = {}, Switchable = YSDK.Switchable;
    FLAGS[IMG_SRC] = "data-ks-lazyload-custom";
    FLAGS[AREA_DATA] = "ks-datalazyload-custom";
    YSDK.mix(Switchable.Config, {
        lazyDataType:AREA_DATA
    });
    Switchable.Plugins.push({
        name:"lazyload",
        init:function(host) {
            var DataLazyload = YSDK.DataLazyload, cfg = host.config, type = cfg.lazyDataType, flag = FLAGS[type];
            if (!DataLazyload || !type || !flag) return;
            $(host).bind(EVENT_BEFORE_SWITCH, loadLazyData);
            function loadLazyData(ev) {
                var steps = cfg.steps, from = ev.toIndex * steps, to = from + steps;
                DataLazyload.loadCustomLazyData(host.panels.slice(from, to), type);
                if (isAllDone()) {
                    $(host).unbind(EVENT_BEFORE_SWITCH, loadLazyData);
                }
            }
            function isAllDone() {
                var elems, i, len, isImgSrc = type === IMG_SRC, tagName = isImgSrc ? "img" :type === AREA_DATA ? "textarea" :"";
                if (tagName) {
                    elems = $(tagName, host.container);
                    for (i = 0, len = elems.length; i < len; i++) {
                        if (isImgSrc ? $(elems[i]).attr(flag) :$(elems[i]).hasClass(flag)) return false;
                    }
                }
                return true;
            }
        }
    });
});

YSDK.add(function() {
    YSDK.Switchable.autoRender = function(hook, container) {
        hook = "." + (hook || "KS_Widget");
        if (!container) container = "";
        var ts = container + " " + hook;
        $(ts).each(function(i, elem) {
            var type = elem.getAttribute("data-widget-type"), config;
            if (type && "Switchable Tabs Slide Carousel Accordion".indexOf(type) > -1) {
                try {
                    config = elem.getAttribute("data-widget-config");
                    if (config) config = config.replace(/'/g, '"');
                    new YSDK[type](elem, $.parseJSON(config));
                } catch (ex) {
                    console.log(ex.stack);
                }
            }
        });
    };
});

YSDK.add(function() {
    function Tabs(container, config) {
        var self = this;
        if (!(self instanceof Tabs)) {
            return new Tabs(container, config);
        }
        Tabs.superclass.constructor.call(self, container, config);
    }
    YSDK.extend(Tabs, YSDK.Switchable);
    YSDK.Tabs = Tabs;
});

YSDK.add(function() {
    var defaultConfig = {
        autoplay:true,
        circular:true
    };
    function Slide(container, config) {
        var self = this;
        if (!(self instanceof Slide)) {
            return new Slide(container, config);
        }
        Slide.superclass.constructor.call(self, container, YSDK.merge(defaultConfig, config));
    }
    YSDK.extend(Slide, YSDK.Switchable);
    YSDK.Slide = Slide;
});

YSDK.add(function() {
    var CLS_PREFIX = "ks-switchable-", DOT = ".", PREV_BTN = "prevBtn", NEXT_BTN = "nextBtn", defaultConfig = {
        circular:true,
        prevBtnCls:CLS_PREFIX + "prev-btn",
        nextBtnCls:CLS_PREFIX + "next-btn",
        disableBtnCls:CLS_PREFIX + "disable-btn"
    };
    function Carousel(container, config) {
        var self = this;
        if (!(self instanceof Carousel)) {
            return new Carousel(container, config);
        }
        $(self).bind("init", function() {
            init_carousel(self);
        });
        Carousel.superclass.constructor.call(self, container, YSDK.merge(defaultConfig, config));
    }
    YSDK.extend(Carousel, YSDK.Switchable);
    YSDK.Carousel = Carousel;
    function init_carousel(self) {
        var cfg = self.config, disableCls = cfg.disableBtnCls;
        $.each([ "prev", "next" ], function(i, d) {
            var btn = self[d + "Btn"] = $(DOT + cfg[d + "BtnCls"], self.container);
            $(btn).bind("click", function(ev) {
                ev.preventDefault();
                if (!$(btn).hasClass(disableCls)) self[d]();
            });
        });
        if (!cfg.circular) {
            $(this).bind("switch", function(ev) {
                var i = ev.currentIndex, disableBtn = i === 0 ? self[PREV_BTN] :i === self.length - 1 ? self[NEXT_BTN] :undefined;
                $(self[PREV_BTN], self[NEXT_BTN]).removeClass(disableCls);
                if (disableBtn) $(disableBtn).addClass(disableCls);
            });
        }
        $(self.panels).bind("click focus", function() {
            $(self).trigger("itemSelected", {
                item:this
            });
        });
    }
});

YSDK.add(function() {
    var DISPLAY = "display", BLOCK = "block", NONE = "none", defaultConfig = {
        markupType:1,
        triggerType:"click",
        multiple:false
    };
    function Accordion(container, config) {
        var self = this;
        if (!(self instanceof Accordion)) {
            return new Accordion(container, config);
        }
        Accordion.superclass.constructor.call(self, container, YSDK.merge(defaultConfig, config));
        if (self.config.multiple) {
            self._switchTrigger = function() {};
        }
    }
    YSDK.extend(Accordion, YSDK.Switchable);
    YSDK.Accordion = Accordion;
    Accordion.prototype._triggerIsValid = function(index) {
        return this.activeIndex !== index || this.config.multiple;
    };
    Accordion.prototype._switchView = function(fromPanels, toPanels, index) {
        var self = this, cfg = self.config, panel = toPanels[0];
        if (cfg.multiple) {
            $(self.triggers[index]).toggleClass(cfg.activeTriggerCls);
            $(panel).css(DISPLAY, panel.style[DISPLAY] == NONE ? BLOCK :NONE);
            this._fireOnSwitch(index);
        } else {
            Accordion.superclass._switchView.call(self, fromPanels, toPanels, index);
        }
    };
});