/*
Copyright 2010, KISSY UI Library v1.1.5
MIT Licensed
build time: Oct 15 14:07
*/
/**
 * KISSY Mask
 * @creator   玉伯<lifesinger@gmail.com>, 乔花<qiaohua@taobao.com>
 */

YSDK.add(function() {
    var DISPLAY = 'display',
        ie = $.browser.msie && $.browser.version,
        ie6 = ie === 6,

        MASK_STYLE = 'position:absolute;left:0;top:0;width:100%;border:0;background:black;z-index:9998;display:none;',
        SHIM_STYLE = 'position:absolute;z-index:9997;border:0;display:none;',

        defaultConfig = {
            shim: false,
            opacity: .6,
            style: ''
        };
    /*
     * Mask Class
     * @constructor
     * attached members：
     *   - this.iframe
     *   - this.config
     *   - this.layer
     */
    function Mask(config) {

        if (!(this instanceof Mask)) {
            return new Mask(config);
        }

        config = YSDK.merge(defaultConfig, config);

        var isShim = config.shim,
            style = isShim ? SHIM_STYLE : MASK_STYLE + config.style,
            opacity = isShim ? 0 : config.opacity,
            ifr = createMaskElem('<iframe>', style, opacity, !isShim);

        if (!isShim && ie) this.layer = createMaskElem('<div>', style, opacity, true);

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
            var isVisible = $(this.iframe).css(DISPLAY) !== 'none';
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
                }
            }
            $(this.iframe, this.layer).offset(offset);
        }
    };

    function createMaskElem(tag, style, opacity, setWH) {
        var elem = $(tag);

        elem.attr('style', style);
        elem.css('opacity', opacity);

        if (setWH) {
            elem.height($(document).height());
            if (ie6) {
                elem.width($(document).width());
            }
        }

        $('body').append(elem);
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

        DOT = '.',
        KEYDOWN = 'keydown',
        POSITION_ALIGN = {
            TL: 'tl',
            TC: 'tc',
            TR: 'tr',
            LC: 'cl',
            CC: 'cc',
            RC: 'cr',
            BL: 'bl',
            BC: 'bc',
            BR: 'br'
        },

        CLS_CONTAINER = 'ks-overlay',
        CLS_PREFIX = CLS_CONTAINER + '-',

        EVT_SHOW = 'show',
        EVT_HIDE = 'hide',

        /**
         * 默认设置
         */
        defaultConfig = {
            /*
             * DOM 结构
             *  <div class="ks-overlay-container">
             *      <div class="ks-overlay-bd"></div>
             *  </div>
             */
            container: null,
            containerCls: CLS_CONTAINER,
            //content: undefined,      // 默认为 undefined, 不设置
            bdCls: CLS_PREFIX + 'bd',

            trigger: null,
            triggerType: 'click', // 触发类型

            width: 0,
            height: 0,
            zIndex: 9999,

            xy: null, // 相对 page 定位, 有效值为 [n, m]
            align: { // 相对指定 node or viewport 定位
                node: null, // 参考元素, falsy 值为可视区域, 'trigger' 为触发元素, 其他为指定元素
                points: [POSITION_ALIGN.CC, POSITION_ALIGN.CC], // ['tl', 'tr'] 表示 overlay 的 tl 与参考节点的 tr 对齐
                offset: [0, 0] // 有效值为 [n, m]
            },

            mask: false, // 是否显示蒙层, 默认不显示
            shim: ie6
        },

        DEFAULT_STYLE = 'visibility:hidden;position:absolute;',
        TMPL = '<div class="{containerCls}" style="' + DEFAULT_STYLE + '"><div class="{bdCls}">{content}</div></div>',

        mask;

    /*
     * Overlay Class
     * @constructor
     * attached members：
     *   - this.container
     *   - this.trigger
     *   - this.config
     *   - this.body
     *   - this.shim
     */
    function Overlay(container, config) {
        var self = this;
        config = config || {};

        // 支持 Overlay(config)
        if ($.isPlainObject(container)) {
            config = container;
        } else {
            config.container = container;
        }

        // 获取相关联的 DOM 节点
        self.container = $(config.container);

        self.trigger = $(config.trigger);

        // 合并配置信息
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

            if (self.config.triggerType === 'mouse') {
                self._bindTriggerMouse();
            } else {
                self._bindTriggerClick();
            }
        },

        _bindTriggerMouse: function() {
            var self = this,
                trigger = self.trigger,
                timer;

            $(trigger).bind('mouseenter', function() {
                self._clearHiddenTimer();

                timer = setTimeout(function() {
                    self.show();
                    timer = undefined;
                }, 100);
            });

            $(trigger).bind('mouseleave', function() {
                if (timer) {
                    clearTimeout(timer);
                    timer = undefined;
                }

                self._setHiddenTimer();
            });
        },

        _bindContainerMouse: function() {
            var self = this;

            $(self.container).bind('mouseleave', function() {
                self._setHiddenTimer();
            });

            $(self.container).bind('mouseenter', function() {
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

            $(self.trigger).bind('click', function(e) {
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

            //$(self.container).css('visibility', isVisible ? 'hidden' : '');

            if (self.shim) self.shim.toggle();
            if (self.config.mask) mask[isVisible ? 'hide' : 'show']();

            self[isVisible ? '_unbindUI' : '_bindUI']();
            if(isVisible){
                $(self.container).css('visibility','hidden');
            }else {
                $(self.container).css('visibility','visible');
            }
        },


        hide: function() {
            this._toggle(true);
        },

        _prepareMarkup: function() {
            var self = this,
                config = self.config,
                container = self.container;

            // 多个 Overlay 实例共用一个 mask
            if (config.mask && !mask) {
                mask = new YSDK.Mask();
            }
            if (config.shim) {
                self.shim = new YSDK.Mask({
                    shim: true
                });
            }

            // 已有 Markup
            if (container.length !== 0) {
                // 已有 markup 可以很灵活，如果没有 bdCls, 就让 body 指向 container
                self.body = $(DOT + config.bdCls, container) || container;
                container.get(0).style.cssText += DEFAULT_STYLE;
            }
            // 构建 DOM
            else {
                container = self.container = $(YSDK.substitute(TMPL, config));
                self.body = $(container).children().eq(0);
                $('body').append(container);
            }

            $(container).css('zIndex', config.zIndex);

            self.setBody(config.content);
            self._setSize();

            if (config.triggerType === 'mouse') self._bindContainerMouse();
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
            // 防止其他地方设置 display: none 后, 无法再次显示
            if ($(self.container).css('display') === 'none') {
                $(self.container).css('display', 'block');
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

            $(self.container).offset(offset);
            if (self.shim) self.shim.setOffset(offset);
        },

        align: function(node, points, offset) {
            var self = this,
                alignConfig = self.config.align,
                xy, diff, p1, p2;

            node = node || alignConfig.node;
            if (node === 'trigger') node = self.trigger;
            else node = $(node);

            points = points || alignConfig.points;

            offset = offset === undefined ? alignConfig.offset : offset;
            xy = $(self.container).offset();

            // p1 是 node 上 points[0] 的 offset
            // p2 是 overlay 上 points[1] 的 offset
            p1 = self._getAlignOffset(node, points[0]);
            p2 = self._getAlignOffset(self.container, points[1]);
            diff = [p2.left - p1.left, p2.top - p1.top];

            self.move(xy.left - diff[0] + (+offset[0]), xy.top - diff[1] + (+offset[1]));
        },

        /**
         * 获取 node 上的 align 对齐点 相对 page 的坐标
         */
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

            if (V === 'c') {
                y += h / 2;
            } else if (V === 'b') {
                y += h;
            }

            if (H === 'c') {
                x += w / 2;
            } else if (H === 'r') {
                x += w;
            }

            return {
                left: x,
                top: y
            };
        },

        center: function() {
            var self = this;

            self.move(
                ($(document).width() - $(self.container).width()) / 2 + $(document).scrollLeft(), ($(document).height() - $(self.container).height()) / 2 + $(document).scrollTop()
            );
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
            this._setContent('body', html);
        },

        _setContent: function(where, html) {
            if (typeof html === 'string') $(this[where]).html(html);
        }
    }

    YSDK.Overlay = Overlay;

});

YSDK.add( function() {

    var defaultConfig = {
        triggerType: 'mouse', // 触发类型, click, mouse
        align: {
            node: 'trigger',
            points: ['cr', 'ct'],
            offset: [10, 0]
        }
    };

    /**
     * Popup Class
     * @constructor
     */
    function Popup(container, config) {
        var self = this;

        if (!(self instanceof Popup)) {
            return new Popup(container, config);
        }

        config = config || { };
        if ($.isPlainObject(container)) config = container;
        else config.container = container;
        config.align = YSDK.merge({},(defaultConfig.align), config.align);

        Popup.superclass.constructor.call(self, YSDK.merge(defaultConfig, config));
    }

    YSDK.extend(Popup, YSDK.Overlay);
    YSDK.Popup = Popup;

});


YSDK.add(function(S) {

    /**
     * 自动渲染 container 元素内的所有 Overlay 组件
     * 默认钩子：<div class="KS_Widget" data-widget-type="Popup" data-widget-config="{...}">
     */
    YSDK.Overlay.autoRender = function(hook, container) {
        hook = '.' + (hook || 'KS_Widget');
        var ts = container+ ' '+ hook;
        $(ts).each(function(i,elem) {
            var type = elem.getAttribute('data-widget-type'), config;

            if (type && ('Dialog Popup'.indexOf(type) > -1)) {
                try {
                    config = elem.getAttribute('data-widget-config');
                    if (config) config = config.replace(/'/g, '"');
                    new YSDK[type](elem, $.parseJSON(config));
                } catch(ex) {
                    console.log('Overlay.autoRender: ' + ex, 'warn');
                }
            }
        });
    }

});