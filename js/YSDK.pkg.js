(function() {
    var YSDK = {
        Env: {
            mods: {}, // 所有模块列表
            _loadQueue: {} // 加载的模块信息
        }
    };

    /*    YSDK.substitute = function(str, o) {
     console.log(str);
     var reg = /{.*}/ig;
     var arr = str.match(reg);

     };*/

    YSDK.substitute = function(str, o, regexp) {
        //if(!S.isString(str) || !$.isPlainObject(o)) return str;

        return str.replace(regexp || /\\?\{([^{}]+)\}/g, function(match, name) {
            if (match.charAt(0) === '\\') return match.slice(1);
            return (o[name] !== undefined) ? o[name] : '';
        });
    }

    YSDK.mix = mix;

    YSDK.merge = function() {
        var o = {},
            i, l = arguments.length;
        for (i = 0; i < l; ++i) {
            mix(o, arguments[i]);
        }
        return o;
    }

    YSDK.augment = function( /*r, s1, s2, ..., ov, wl*/ ) {
        var args = arguments,
            len = args.length - 2,
            r = args[0],
            ov = args[len],
            wl = args[len + 1],
            i = 1;
        console.log(args);
        if (!$.isArray(wl)) {
            ov = wl;
            wl = undefined;
            len++;
        }

        if (!typeof(ov) == 'boolean') {
            ov = undefined;
            len++;
        }

        for (; i < len; i++) {
            mix(r.prototype, args[i].prototype || args[i], ov, wl);
        }

        return r;
    }

    YSDK.add = function(fn) {
        fn(this);
        return this;
    }

    YSDK.event = {
        on: function(name, fn, scope) {
            scope.events = scope.events || {};
            //if(!me.events[name]){
            //    me.events[name] = [];
            //    me.events[name].push({
            //        fn:fn,
            //        scope:scope
            //    });
            //}else{
            //    me.events[name].push({
            //        fn:fn,
            //        scope:scope
            //    });
            //}
            scope.events[name] = fn;

        },

        un: function(name, scope) {
            if (scope.events && scope.events[name]) {
                scope.events[name] = null;
                delete scope.events[name];
            }
        },

        fire: function(name, data, scope) {
            scope.events = scope.events || {};
            var fnAr = scope.events[name];
            if (fnAr) {
                fnAr(data);
            }
        }
    }

    YSDK.extend = function(r, s, px, sx) {
        if (!s || !r) return r;
        var create = Object.create ?
            function(proto, c) {
                return Object.create(proto, {
                    constructor: {
                        value: c
                    }
                });
            } :
            function(proto, c) {
                function F() {}

                F.prototype = proto;

                var o = new F();
                o.constructor = c;
                return o;
            },
            sp = s.prototype,
            rp;

        // add prototype chain
        rp = create(sp, r);
        r.prototype = $.extend(rp, r.prototype);
        r.superclass = create(sp, s);

        // add prototype overrides
        if (px) {
            $.extend(rp, px);
        }

        // add object overrides
        if (sx) {
            $.extend(r, sx);
        }

        return r;
    }

    function mix(r, s, ov, wl) {
        if (!s || !r) return r;
        if (ov === undefined) ov = true;
        var i, p, l;

        if (wl && (l = wl.length)) {
            for (i = 0; i < l; i++) {
                p = wl[i];
                if (p in s) {
                    if (ov || !(p in r)) {
                        r[p] = s[p];
                    }
                }
            }
        } else {
            for (p in s) {
                if (ov || !(p in r)) {
                    r[p] = s[p];
                }
            }
        }
        return r;
    }

    window.YSDK = YSDK;
})(window, 'YSDK')

YSDK.add(function() {
    var DISPLAY = "display",
        ie = $.browser.msie && $.browser.version,
        ie6 = ie === 6,
        MASK_STYLE = "position:absolute;left:0;top:0;width:100%;border:0;background:black;z-index:9998;display:none;",
        SHIM_STYLE = "position:absolute;z-index:9997;border:0;display:none;",
        defaultConfig = {
            shim: false,
            opacity: .6,
            style: ""
        };

    function Mask(config) {
        if (!(this instanceof Mask)) {
            return new Mask(config);
        }
        config = YSDK.merge(defaultConfig, config);
        var isShim = config.shim,
            style = isShim ? SHIM_STYLE : MASK_STYLE + config.style,
            opacity = isShim ? 0 : config.opacity,
            ifr = createMaskElem("<iframe>", style, opacity, !isShim);
        if (!isShim && ie) this.layer = createMaskElem("<div>", style, opacity, true);
        this.config = config;
        this.iframe = ifr;
    }

    Mask.prototype = {
        show: function() {
            $(this.iframe, this.layer).show();
        },
        hide: function() {
            $(this.iframe, this.layer).hide();
        },
        toggle: function() {
            var isVisible = $(this.iframe).css(DISPLAY) !== "none";
            if (isVisible) {
                this.hide();
            } else {
                this.show();
            }
        },
        setSize: function(w, h) {
            setSize(this.iframe, w, h);
            setSize(this.layer, w, h);
        },
        setOffset: function(x, y) {
            var offset = x;
            if (y !== undefined) {
                offset = {
                    left: x,
                    top: y
                };
            }
            $(this.iframe, this.layer).offset(offset);
        }
    };

    function createMaskElem(tag, style, opacity, setWH) {
        var elem = $(tag);
        elem.attr("style", style);
        elem.css("opacity", opacity);
        if (setWH) {
            elem.height($(document).height());
            if (ie6) {
                elem.width($(document).width());
            }
        }
        $("body").append(elem);
        return elem;
    }

    function setSize(elem, w, h) {
        if (elem) {
            elem.height(h);
            elem.width(w);
        }
    }

    YSDK.Mask = Mask;
});

YSDK.add(function() {
    var doc = document,
        ie = $.browser.msie && $.browser.version,
        ie6 = ie === 6,
        DOT = ".",
        KEYDOWN = "keydown",
        POSITION_ALIGN = {
            TL: "tl",
            TC: "tc",
            TR: "tr",
            LC: "cl",
            CC: "cc",
            RC: "cr",
            BL: "bl",
            BC: "bc",
            BR: "br"
        },
        CLS_CONTAINER = "ks-overlay",
        CLS_PREFIX = CLS_CONTAINER + "-",
        EVT_SHOW = "show",
        EVT_HIDE = "hide",
        defaultConfig = {
            container: null,
            containerCls: CLS_CONTAINER,
            bdCls: CLS_PREFIX + "bd",
            trigger: null,
            triggerType: "click",
            width: 0,
            height: 0,
            zIndex: 9999,
            xy: null,
            align: {
                node: null,
                points: [POSITION_ALIGN.CC, POSITION_ALIGN.CC],
                offset: [0, 0]
            },
            mask: false,
            shim: ie6
        },
        DEFAULT_STYLE = "visibility:hidden;position:absolute;",
        TMPL = '<div class="{containerCls}" style="' + DEFAULT_STYLE + '"><div class="{bdCls}">{content}</div></div>',
        mask;

    function Overlay(container, config) {
        var self = this;
        config = config || {};
        if ($.isPlainObject(container)) {
            config = container;
        } else {
            config.container = container;
        }
        self.container = $(config.container);
        self.trigger = $(config.trigger);
        config.align = YSDK.merge({}, defaultConfig.align, config.align);
        self.config = YSDK.merge(defaultConfig, config);
        self._init();
    }

    Overlay.prototype = {
        _init: function() {
            if (this.trigger) {
                this._bindTrigger();
            }
        },
        _bindTrigger: function() {
            var self = this;
            if (self.config.triggerType === "mouse") {
                self._bindTriggerMouse();
            } else {
                self._bindTriggerClick();
            }
        },
        _bindTriggerMouse: function() {
            var self = this,
                trigger = self.trigger,
                timer;
            $(trigger).bind("mouseenter", function() {
                self._clearHiddenTimer();
                timer = setTimeout(function() {
                    self.show();
                    timer = undefined;
                }, 100);
            });
            $(trigger).bind("mouseleave", function() {
                if (timer) {
                    clearTimeout(timer);
                    timer = undefined;
                }
                self._setHiddenTimer();
            });
        },
        _bindContainerMouse: function() {
            var self = this;
            $(self.container).bind("mouseleave", function() {
                self._setHiddenTimer();
            });
            $(self.container).bind("mouseenter", function() {
                self._clearHiddenTimer();
            });
        },
        _setHiddenTimer: function() {
            var self = this;
            self._hiddenTimer = setTimeout(function() {
                self.hide();
            }, 120);
        },
        _clearHiddenTimer: function() {
            var self = this;
            if (self._hiddenTimer) {
                clearTimeout(self._hiddenTimer);
                self._hiddenTimer = undefined;
            }
        },
        _bindTriggerClick: function() {
            var self = this;
            $(self.trigger).bind("click", function(e) {
                e.halt();
                self.show();
            });
        },
        show: function() {
            this._firstShow();
        },
        _firstShow: function() {
            var self = this;
            self._prepareMarkup();
            self._realShow();
            self._firstShow = self._realShow;
        },
        _realShow: function() {
            this._setPosition();
            this._toggle(false);
        },
        _toggle: function(isVisible) {
            var self = this;
            if (self.shim) self.shim.toggle();
            if (self.config.mask) mask[isVisible ? "hide" : "show"]();
            self[isVisible ? "_unbindUI" : "_bindUI"]();
            if (isVisible) {
                $(self.container).css("visibility", "hidden");
            } else {
                $(self.container).css("visibility", "visible");
            }
        },
        hide: function() {
            this._toggle(true);
        },
        _prepareMarkup: function() {
            var self = this,
                config = self.config,
                container = self.container;
            if (config.mask && !mask) {
                mask = new YSDK.Mask();
            }
            if (config.shim) {
                self.shim = new YSDK.Mask({
                    shim: true
                });
            }
            if (container.length !== 0) {
                self.body = $(DOT + config.bdCls, container) || container;
                container.get(0).style.cssText += DEFAULT_STYLE;
            } else {
                container = self.container = $(YSDK.substitute(TMPL, config));
                self.body = $(container).children().eq(0);
                $("body").append(container);
            }
            $(container).css("zIndex", config.zIndex);
            self.setBody(config.content);
            self._setSize();
            if (config.triggerType === "mouse") self._bindContainerMouse();
        },
        _setSize: function(w, h) {
            var self = this,
                config = self.config;
            w = w || config.width;
            h = h || config.height;
            if (w) $(self.container).width(w);
            if (h) $(self.container).height(h);
            if (self.shim) self.shim.setSize(w, h);
        },
        _setDisplay: function() {
            var self = this;
            if ($(self.container).css("display") === "none") {
                $(self.container).css("display", "block");
            }
        },
        _setPosition: function() {
            var self = this,
                xy = self.config.xy;
            if (xy) {
                self.move(xy);
            } else {
                self._setDisplay();
                self.align();
            }
        },
        move: function(x, y) {
            var self = this,
                offset;
            if ($.isArray(x)) {
                y = x[1];
                x = x[0];
            }
            offset = {
                left: x,
                top: y
            };
            $(self.container).css({
                left: offset.left,
                top: offset.top
            });
            if (self.shim) self.shim.setOffset(offset);
        },
        align: function(node, points, offset) {
            var self = this,
                alignConfig = self.config.align,
                xy, diff, p1, p2;
            node = node || alignConfig.node;
            if (node === "trigger") node = self.trigger;
            else node = $(node);
            points = points || alignConfig.points;
            offset = offset === undefined ? alignConfig.offset : offset;
            xy = $(self.container).offset();
            p1 = self._getAlignOffset(node, points[0]);
            p2 = self._getAlignOffset(self.container, points[1]);
            diff = [p2.left - p1.left, p2.top - p1.top];
            self.move(xy.left - diff[0] + +offset[0], xy.top - diff[1] + +offset[1]);
        },
        _getAlignOffset: function(node, align) {
            var V = align.charAt(0),
                H = align.charAt(1),
                offset, w, h, x, y;
            if (node.length != 0) {
                offset = $(node).offset();
                w = node.get(0).offsetWidth;
                h = node.get(0).offsetHeight;
            } else {
                offset = {
                    left: $(document).scrollLeft(),
                    top: $(document).scrollTop()
                };
                w = $(document).width();
                h = $(document).height();
            }
            x = offset.left;
            y = offset.top;
            if (V === "c") {
                y += h / 2;
            } else if (V === "b") {
                y += h;
            }
            if (H === "c") {
                x += w / 2;
            } else if (H === "r") {
                x += w;
            }
            return {
                left: x,
                top: y
            };
        },
        center: function() {
            var self = this;
            self.move(($(document).width() - $(self.container).width()) / 2 + $(document).scrollLeft(), ($(document).height() - $(self.container).height()) / 2 + $(document).scrollTop());
        },
        _bindUI: function() {
            $(doc).bind(KEYDOWN, this._esc);
        },
        _unbindUI: function() {
            $(doc).unbind(KEYDOWN, this._esc);
        },
        _esc: function(e) {
            if (e.keyCode === 27) this.hide();
        },
        setBody: function(html) {
            this._setContent("body", html);
        },
        _setContent: function(where, html) {
            if (typeof html === "string") $(this[where]).html(html);
        }
    };
    YSDK.Overlay = Overlay;
});

YSDK.add(function() {
    var defaultConfig = {
        triggerType: "mouse",
        align: {
            node: "trigger",
            points: ["cr", "ct"],
            offset: [10, 0]
        }
    };

    function Popup(container, config) {
        var self = this;
        if (!(self instanceof Popup)) {
            return new Popup(container, config);
        }
        config = config || {};
        if ($.isPlainObject(container)) config = container;
        else config.container = container;
        config.align = YSDK.merge({}, defaultConfig.align, config.align);
        Popup.superclass.constructor.call(self, YSDK.merge(defaultConfig, config));
    }

    YSDK.extend(Popup, YSDK.Overlay);
    YSDK.Popup = Popup;
});

YSDK.add(function() {
    var DOT = ".",
        DIV = "<div>",
        CLS_CONTAINER = "ks-overlay ks-dialog",
        CLS_PREFIX = "ks-dialog-",
        defaultConfig = {
            header: "",
            footer: "",
            containerCls: CLS_CONTAINER,
            hdCls: CLS_PREFIX + "hd",
            bdCls: CLS_PREFIX + "bd",
            ftCls: CLS_PREFIX + "ft",
            closeBtnCls: CLS_PREFIX + "close",
            width: 400,
            height: 300,
            closable: true
        };

    function Dialog(container, config) {
        var self = this;
        if (!(self instanceof Dialog)) {
            return new Dialog(container, config);
        }
        config = config || {};
        if ($.isPlainObject(container)) config = container;
        else config.container = container;
        config.align = YSDK.merge({}, defaultConfig.align, config.align);
        Dialog.superclass.constructor.call(self, YSDK.merge(defaultConfig, config));
        self.manager = YSDK.DialogManager;
        self.manager.register(self);
    }

    YSDK.extend(Dialog, YSDK.Overlay);
    YSDK.Dialog = Dialog;
    Dialog.prototype = {
        _prepareMarkup: function() {
            var self = this,
                config = self.config;
            Dialog.superclass._prepareMarkup.call(self);
            self.header = $(DOT + config.hdCls, self.container);
            if (!self.header) {
                self.header = $("<div class=" + config.hdCls + "></div>");
                self.header.insertBefore(self.body);
            }
            self.setHeader(config.header);
            if (config.footer) {
                self.footer = $(DOT + config.ftCls, self.container);
                if (!self.footer) {
                    self.footer = $("<div class=" + config.ftCls + "></div>");
                    self.container.append(self.footer);
                }
                self.setFooter(config.footer);
            }
            if (config.closable) self._initClose();
        },
        _initClose: function() {
            var self = this,
                config = self.config,
                elem = $("<div class=" + config.closeBtnCls + "></div>");
            $(elem).html("close");
            $(elem).bind("click", function(e) {
                e.halt();
                self.hide();
            });
            self.header.append(elem);
        },
        setHeader: function(html) {
            this._setContent("header", html);
        },
        setFooter: function(html) {
            this._setContent("footer", html);
        }
    };
    YSDK.DialogManager = {
        register: function(dlg) {
            if (dlg instanceof Dialog) {
                this._dialog.push(dlg);
            }
        },
        _dialog: [],
        hideAll: function() {
            $.each(this._dialog, function(i, dlg) {
                dlg && dlg.hide();
            });
        }
    };
});

YSDK.add(function() {
    YSDK.Overlay.autoRender = function(hook, container) {
        hook = "." + (hook || "KS_Widget");
        var ts = container + " " + hook;
        $(ts).each(function(i, elem) {
            var type = elem.getAttribute("data-widget-type"),
                config;
            if (type && "Dialog Popup".indexOf(type) > -1) {
                try {
                    config = elem.getAttribute("data-widget-config");
                    if (config) config = config.replace(/'/g, '"');
                    new YSDK[type](elem, $.parseJSON(config));
                } catch (ex) {
                    console.log("Overlay.autoRender: " + ex, "warn");
                }
            }
        });
    };
});

YSDK.add(function() {
    var DISPLAY = "display",
        BLOCK = "block",
        NONE = "none",
        FORWARD = "forward",
        BACKWARD = "backward",
        DOT = ".",
        EVENT_INIT = "init",
        EVENT_BEFORE_SWITCH = "beforeSwitch",
        EVENT_SWITCH = "switch",
        CLS_PREFIX = "yhd-switchable-";

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
        markupType: 0,
        navCls: CLS_PREFIX + "nav",
        contentCls: CLS_PREFIX + "content",
        triggerCls: CLS_PREFIX + "trigger",
        panelCls: CLS_PREFIX + "panel",
        triggers: [],
        panels: [],
        hasTriggers: true,
        triggerType: "mouse",
        delay: .1,
        activeIndex: 0,
        activeTriggerCls: "yhd-active",
        steps: 1,
        viewSize: []
    };
    Switchable.Plugins = [];
    Switchable.prototype = {
        _init: function() {
            var self = this,
                cfg = self.config;
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
            YSDK.event.fire(EVENT_INIT, '', self);
        },
        _parseMarkup: function() {
            var self = this,
                container = self.container,
                cfg = self.config,
                nav, content, triggers = [],
                panels = [],
                i, n, m;
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
        _generateTriggersMarkup: function(len) {
            var self = this,
                cfg = self.config,
                ul = $("<ul>"),
                li, i;
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
        _bindTriggers: function() {
            var self = this,
                cfg = self.config,
                triggers = self.triggers,
                trigger, i, len = triggers.length;
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
        _onFocusTrigger: function(index) {
            var self = this;
            if (!self._triggerIsValid(index)) return;
            this._cancelSwitchTimer();
            self.switchTo(index);
        },
        _onMouseEnterTrigger: function(index) {
            var self = this;
            if (!self._triggerIsValid(index)) return;
            self.switchTimer = setTimeout(function() {
                self.switchTo(index);
            }, self.config.delay * 1e3);
        },
        _onMouseLeaveTrigger: function() {
            this._cancelSwitchTimer();
        },
        _triggerIsValid: function(index) {
            return this.activeIndex !== index;
        },
        _cancelSwitchTimer: function() {
            var self = this;
            if (self.switchTimer) {
                clearTimeout(self.switchTimer);
                self.switchTimer = undefined;
            }
        },
        switchTo: function(index, direction) {
            var self = this,
                cfg = self.config,
                triggers = self.triggers,
                panels = self.panels,
                activeIndex = self.activeIndex,
                steps = cfg.steps,
                fromIndex = activeIndex * steps,
                toIndex = index * steps;
            if (!self._triggerIsValid(index)) return self;
            if (YSDK.event.fire(EVENT_BEFORE_SWITCH, {
                    toIndex: index
                }, self) === false) return self;
            if (cfg.hasTriggers) {
                self._switchTrigger(activeIndex > -1 ? triggers[activeIndex] : null, triggers[index]);
            }
            if (direction === undefined) {
                direction = index > activeIndex ? FORWARD : BACKWARD;
            }
            self._switchView(panels.slice(fromIndex, fromIndex + steps), panels.slice(toIndex, toIndex + steps), index, direction);
            self.activeIndex = index;
            return self;
        },
        _switchTrigger: function(fromTrigger, toTrigger) {
            var activeTriggerCls = this.config.activeTriggerCls;
            if (fromTrigger) $(fromTrigger).removeClass(activeTriggerCls);
            $(toTrigger).addClass(activeTriggerCls);
        },
        _switchView: function(fromPanels, toPanels, index) {
            $(fromPanels).css(DISPLAY, NONE);
            $(toPanels).css(DISPLAY, BLOCK);
            this._fireOnSwitch(index);
        },
        _fireOnSwitch: function(index) {
            YSDK.event.fire(EVENT_SWITCH, {
                currentIndex: index
            }, this);
        },
        prev: function() {
            var self = this,
                activeIndex = self.activeIndex;
            self.switchTo(activeIndex > 0 ? activeIndex - 1 : self.length - 1, BACKWARD);
        },
        next: function() {
            var self = this,
                activeIndex = self.activeIndex;
            self.switchTo(activeIndex < self.length - 1 ? activeIndex + 1 : 0, FORWARD);
        }
    };
    YSDK.Switchable = Switchable;
});

YSDK.add(function() {
    var Switchable = YSDK.Switchable;
    YSDK.mix(Switchable.Config, {
        autoplay: false,
        interval: 5,
        pauseOnHover: true
    });
    Switchable.Plugins.push({
        name: "autoplay",
        init: function(host) {
            var cfg = host.config,
                interval = cfg.interval * 1e3,
                timer;
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
                    host.switchTo(host.activeIndex < host.length - 1 ? host.activeIndex + 1 : 0, "forward");
                }, interval);
            }

            startAutoplay();
        }
    });
});

YSDK.add(function() {
    var DISPLAY = "display",
        BLOCK = "block",
        NONE = "none",
        OPACITY = "opacity",
        Z_INDEX = "z-index",
        POSITION = "position",
        RELATIVE = "relative",
        ABSOLUTE = "absolute",
        SCROLLX = "scrollx",
        SCROLLY = "scrolly",
        FADE = "fade",
        LEFT = "left",
        TOP = "top",
        FLOAT = "float",
        PX = "px",
        Switchable = YSDK.Switchable,
        Effects;
    YSDK.mix(Switchable.Config, {
        effect: NONE,
        duration: 500,
        easing: "swing",
        nativeAnim: true
    });
    Switchable.Effects = {
        none: function(fromEls, toEls, callback) {
            $(fromEls).css(DISPLAY, NONE);
            $(toEls).css(DISPLAY, BLOCK);
            callback();
        },
        fade: function(fromEls, toEls, callback) {
            if (fromEls.length !== 1) {}
            var self = this,
                cfg = self.config,
                fromEl = fromEls[0],
                toEl = toEls[0];
            if (self.anim) $(self).stop(true);
            $(toEl).css(OPACITY, 1);
            self.anim = $(fromEl).animate({
                opacity: 0
            }, {
                duration: cfg.duration,
                easing: cfg.easing
            }, function() {
                self.anim = undefined;
                $(toEl).css(Z_INDEX, 9);
                $(fromEl).css(Z_INDEX, 1);
                callback();
            });
        },
        scroll: function(fromEls, toEls, callback, index) {
            var self = this,
                cfg = self.config,
                isX = cfg.effect === SCROLLX,
                diff = self.viewSize[isX ? 0 : 1] * index,
                props = {};
            props[isX ? LEFT : TOP] = -diff + PX;
            if (self.anim) $(self).stop(true);
            self.anim = $(self.content).animate(props, {
                duration: cfg.duration,
                easing: cfg.easing,
                complete:function() {
                    self.anim = undefined;
                    callback();
                }
            });
        }
    };
    Effects = Switchable.Effects;
    Effects[SCROLLX] = Effects[SCROLLY] = Effects.scroll;
    Switchable.Plugins.push({
        name: "effect",
        init: function(host) {
            var cfg = host.config,
                effect = cfg.effect,
                panels = host.panels,
                content = host.content,
                steps = cfg.steps,
                activeIndex = host.activeIndex,
                len = panels.length;
            host.viewSize = [cfg.viewSize[0] || panels[0].offsetWidth * steps, cfg.viewSize[1] || panels[0].offsetHeight * steps];
            if (effect !== NONE) {
                $.each(panels, function(i, panel) {
                    $(panel).css(DISPLAY, BLOCK);
                });
                switch (effect) {
                    case SCROLLX:
                    case SCROLLY:
                        $(content).css(POSITION, ABSOLUTE);
                        $(content).parent().css(POSITION, RELATIVE);
                        if (effect === SCROLLX) {
                            $(panels).css(FLOAT, LEFT);
                            $(content).width(host.viewSize[0] * (len / steps));
                        }
                        break;

                    case FADE:
                        var min = activeIndex * steps,
                            max = min + steps - 1,
                            isActivePanel;
                        $.each(panels, function(i, panel) {
                            isActivePanel = i >= min && i <= max;
                            $(panel).css({
                                opacity: isActivePanel ? 1 : 0,
                                position: ABSOLUTE,
                                zIndex: isActivePanel ? 9 : 1
                            });
                        });
                        break;
                }
            }
        }
    });
    Switchable.prototype._switchView = function(fromEls, toEls, index, direction) {
        var self = this,
            cfg = self.config,
            effect = cfg.effect,
            fn = $.isFunction(effect) ? effect : Effects[effect];
        fn.call(self, fromEls, toEls, function() {
            self._fireOnSwitch(index);
        }, index, direction);
    };
});

YSDK.add(function() {
    var POSITION = "position",
        RELATIVE = "relative",
        LEFT = "left",
        TOP = "top",
        EMPTY = "",
        PX = "px",
        FORWARD = "forward",
        BACKWARD = "backward",
        SCROLLX = "scrollx",
        SCROLLY = "scrolly",
        Switchable = YSDK.Switchable;
    YSDK.mix(Switchable.Config, {
        circular: false
    });

    function circularScroll(fromEls, toEls, callback, index, direction) {
        var self = this,
            cfg = self.config,
            len = self.length,
            activeIndex = self.activeIndex,
            isX = cfg.scrollType === SCROLLX,
            prop = isX ? LEFT : TOP,
            viewDiff = self.viewSize[isX ? 0 : 1],
            diff = -viewDiff * index,
            props = {},
            isCritical, isBackward = direction === BACKWARD;
        isCritical = isBackward && activeIndex === 0 && index === len - 1 || direction === FORWARD && activeIndex === len - 1 && index === 0;
        if (isCritical) {
            diff = adjustPosition.call(self, self.panels, index, isBackward, prop, viewDiff);
        }
        props[prop] = diff + PX;
        if (self.anim) $(this).stop();
        self.anim = $(self.content).animate(props, {
            duration: cfg.duration,
            easing: cfg.easing
        }, function() {
            if (isCritical) {
                resetPosition.call(self, self.panels, index, isBackward, prop, viewDiff);
            }
            self.anim = undefined;
            callback();
        });
    }

    function adjustPosition(panels, index, isBackward, prop, viewDiff) {
        var self = this,
            cfg = self.config,
            steps = cfg.steps,
            len = self.length,
            start = isBackward ? len - 1 : 0,
            from = start * steps,
            to = (start + 1) * steps,
            i;
        for (i = from; i < to; i++) {
            $(panels[i]).css(POSITION, RELATIVE);
            $(panels[i]).css(prop, (isBackward ? -1 : 1) * viewDiff * len);
        }
        return isBackward ? viewDiff : -viewDiff * len;
    }

    function resetPosition(panels, index, isBackward, prop, viewDiff) {
        var self = this,
            cfg = self.config,
            steps = cfg.steps,
            len = self.length,
            start = isBackward ? len - 1 : 0,
            from = start * steps,
            to = (start + 1) * steps,
            i;
        for (i = from; i < to; i++) {
            $(panels[i]).css(POSITION, EMPTY);
            $(panels[i]).css(prop, EMPTY);
        }
        $(self.content).css(prop, isBackward ? -viewDiff * (len - 1) : EMPTY);
    }

    Switchable.Plugins.push({
        name: "circular",
        init: function(host) {
            var cfg = host.config;
            if (cfg.circular && (cfg.effect === SCROLLX || cfg.effect === SCROLLY)) {
                cfg.scrollType = cfg.effect;
                cfg.effect = circularScroll;
            }
        }
    });
});

YSDK.add(function() {
    var EVENT_BEFORE_SWITCH = "beforeSwitch",
        IMG_SRC = "img-src",
        AREA_DATA = "area-data",
        FLAGS = {},
        Switchable = YSDK.Switchable;
    FLAGS[IMG_SRC] = "data-yhd-lazyload-custom";
    FLAGS[AREA_DATA] = "yhd-datalazyload-custom";
    YSDK.mix(Switchable.Config, {
        lazyDataType: AREA_DATA
    });
    Switchable.Plugins.push({
        name: "lazyload",
        init: function(host) {
            var DataLazyload = YSDK.DataLazyload,
                cfg = host.config,
                type = cfg.lazyDataType,
                flag = FLAGS[type];
            if (!DataLazyload || !type || !flag) return;
            YSDK.event.on(EVENT_BEFORE_SWITCH, loadLazyData, host);

            function loadLazyData(ev) {
                var steps = cfg.steps,
                    from = ev.toIndex * steps,
                    to = from + steps;
                DataLazyload.loadCustomLazyData(host.panels.slice(from, to), type);
                if (isAllDone()) {
                    YSDK.event.un(EVENT_BEFORE_SWITCH, loadLazyData, host);
                }
            }

            function isAllDone() {
                var elems, i, len, isImgSrc = type === IMG_SRC,
                    tagName = isImgSrc ? "img" : type === AREA_DATA ? "textarea" : "";
                if (tagName) {
                    elems = $(tagName, host.container);
                    for (i = 0, len = elems.length; i < len; i++) {
                        if (isImgSrc ? $(elems[i]).attr(flag) : $(elems[i]).hasClass(flag)) return false;
                    }
                }
                return true;
            }
        }
    });
});

YSDK.add(function() {
    YSDK.Switchable.autoRender = function(hook, container) {
        hook = "." + (hook || "YHD_Widget");
        if (!container) container = "";
        var ts = container + " " + hook;
        $(ts).each(function(i, elem) {
            var type = elem.getAttribute("data-widget-type"),
                config;
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
        autoplay: true,
        circular: true
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
    var CLS_PREFIX = "yhd-switchable-",
        DOT = ".",
        PREV_BTN = "prevBtn",
        NEXT_BTN = "nextBtn",
        defaultConfig = {
            circular: true,
            prevBtnCls: CLS_PREFIX + "prev-btn",
            nextBtnCls: CLS_PREFIX + "next-btn",
            disableBtnCls: CLS_PREFIX + "disable-btn"
        };

    function Carousel(container, config) {
        var self = this;
        if (!(self instanceof Carousel)) {
            return new Carousel(container, config);
        }
        YSDK.event.on("init", function() {
            init_carousel(self);
        }, self);
        Carousel.superclass.constructor.call(self, container, YSDK.merge(defaultConfig, config));
    }

    YSDK.extend(Carousel, YSDK.Switchable);
    YSDK.Carousel = Carousel;

    function init_carousel(self) {
        var cfg = self.config,
            disableCls = cfg.disableBtnCls;
        $.each(["prev", "next"], function(i, d) {
            var btn = self[d + "Btn"] = $(DOT + cfg[d + "BtnCls"], self.container);
            btn.bind("click", function(ev) {
                ev.preventDefault();
                if (!btn.hasClass(disableCls)) self[d]();
            });
        });
        if (!cfg.circular) {
            YSDK.event.on("switch", function(ev) {
                var i = ev.currentIndex,
                    disableBtn = i === 0 ? self[PREV_BTN] : i === self.length - 1 ? self[NEXT_BTN] : undefined;
                $(self[PREV_BTN]).removeClass(disableCls);
                $(self[NEXT_BTN]).removeClass(disableCls);
                if (disableBtn) $(disableBtn).addClass(disableCls);
            }, self);
        }
        $(self.panels).bind("click focus", function() {
            YSDK.event.fire("itemSelected", {
                item: this
            }, self);
        });
    }
});

YSDK.add(function() {
    var DISPLAY = "display",
        BLOCK = "block",
        NONE = "none",
        defaultConfig = {
            markupType: 1,
            triggerType: "click",
            multiple: false
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
        var self = this,
            cfg = self.config,
            panel = toPanels[0];
        if (cfg.multiple) {
            $(self.triggers[index]).toggleClass(cfg.activeTriggerCls);
            $(panel).css(DISPLAY, panel.style[DISPLAY] == NONE ? BLOCK : NONE);
            this._fireOnSwitch(index);
        } else {
            Accordion.superclass._switchView.call(self, fromPanels, toPanels, index);
        }
    };
});

jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend(jQuery.easing, {
    def: 'easeOutQuad',
    swing: function(x, t, b, c, d) {
        //alert(jQuery.easing.default);
        return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
    },
    easeInQuad: function(x, t, b, c, d) {
        return c * (t /= d) * t + b;
    },
    easeOutQuad: function(x, t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    },
    easeInOutQuad: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    },
    easeInCubic: function(x, t, b, c, d) {
        return c * (t /= d) * t * t + b;
    },
    easeOutCubic: function(x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    },
    easeInOutCubic: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b;
    },
    easeInQuart: function(x, t, b, c, d) {
        return c * (t /= d) * t * t * t + b;
    },
    easeOutQuart: function(x, t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    },
    easeInOutQuart: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    },
    easeInQuint: function(x, t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
    },
    easeOutQuint: function(x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    },
    easeInOutQuint: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    },
    easeInSine: function(x, t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    },
    easeOutSine: function(x, t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    },
    easeInOutSine: function(x, t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    },
    easeInExpo: function(x, t, b, c, d) {
        return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    },
    easeOutExpo: function(x, t, b, c, d) {
        return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    },
    easeInOutExpo: function(x, t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    },
    easeInCirc: function(x, t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    },
    easeOutCirc: function(x, t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    },
    easeInOutCirc: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    },
    easeInElastic: function(x, t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * .3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    },
    easeOutElastic: function(x, t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * .3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    },
    easeInOutElastic: function(x, t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d / 2) == 2) return b + c;
        if (!p) p = d * (.3 * 1.5);
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
    },
    easeInBack: function(x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * (t /= d) * t * ((s + 1) * t - s) + b;
    },
    easeOutBack: function(x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    },
    easeInOutBack: function(x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
        return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
    },
    easeInBounce: function(x, t, b, c, d) {
        return c - jQuery.easing.easeOutBounce(x, d - t, 0, c, d) + b;
    },
    easeOutBounce: function(x, t, b, c, d) {
        if ((t /= d) < (1 / 2.75)) {
            return c * (7.5625 * t * t) + b;
        } else if (t < (2 / 2.75)) {
            return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
        } else if (t < (2.5 / 2.75)) {
            return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
        } else {
            return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
        }
    },
    easeInOutBounce: function(x, t, b, c, d) {
        if (t < d / 2) return jQuery.easing.easeInBounce(x, t * 2, 0, c, d) * .5 + b;
        return jQuery.easing.easeOutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b;
    }
});
