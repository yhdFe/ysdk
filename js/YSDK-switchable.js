/*
 Copyright 2010, KISSY UI Library v1.1.5
 MIT Licensed
 build time: Oct 15 14:08
 */
/**
 * Switchable
 * @creator  玉伯<lifesinger@gmail.com>
 */
YSDK.add(function () {

    var DISPLAY = 'display', BLOCK = 'block', NONE = 'none',
        FORWARD = 'forward', BACKWARD = 'backward',
        DOT = '.',

        EVENT_INIT = 'init',
        EVENT_BEFORE_SWITCH = 'beforeSwitch', EVENT_SWITCH = 'switch',
        CLS_PREFIX = 'ks-switchable-';

    /**
     * Switchable Widget
     * attached members：
     *   - this.container
     *   - this.config
     *   - this.triggers  可以为空值 []
     *   - this.panels    可以为空值 []
     *   - this.content
     *   - this.length
     *   - this.activeIndex
     *   - this.switchTimer
     */
    function Switchable(container, config) {
        var self = this;

        // 调整配置信息
        config = config || {};
        if (!('markupType' in config)) {
            if (config.panelCls) {
                config.markupType = 1;
            } else if (config.panels) {
                config.markupType = 2;
            }
        }
        config = YSDK.merge(Switchable.Config, config);

        /**
         * the container of widget
         * @type HTMLElement
         */
        self.container = $(container);

        /**
         * 配置参数
         * @type Object
         */
        self.config = config;

        /**
         * triggers
         * @type Array of HTMLElement
         */
        //self.triggers

        /**
         * panels
         * @type Array of HTMLElement
         */
        //self.panels

        /**
         * length = panels.length / steps
         * @type number
         */
        //self.length

        /**
         * the parentNode of panels
         * @type HTMLElement
         */
        //self.content

        /**
         * 当前激活的 index
         * @type Number
         */
        self.activeIndex = config.activeIndex;
        console.log(self);
        self._init();
    }

    // 默认配置
    Switchable.Config = {
        markupType: 0, // markup 的类型，取值如下：

        // 0 - 默认结构：通过 nav 和 content 来获取 triggers 和 panels
        navCls: CLS_PREFIX + 'nav',
        contentCls: CLS_PREFIX + 'content',

        // 1 - 适度灵活：通过 cls 来获取 triggers 和 panels
        triggerCls: CLS_PREFIX + 'trigger',
        panelCls: CLS_PREFIX + 'panel',

        // 2 - 完全自由：直接传入 triggers 和 panels
        triggers: [],
        panels: [],

        // 是否有触点
        hasTriggers: true,

        // 触发类型
        triggerType: 'mouse', // or 'click'
        // 触发延迟
        delay: .1, // 100ms

        activeIndex: 0, // markup 的默认激活项应与 activeIndex 保持一致
        activeTriggerCls: 'ks-active',
        //switchTo: 0,

        // 可见视图内有多少个 panels
        steps: 1,

        // 可见视图区域的大小。一般不需要设定此值，仅当获取值不正确时，用于手工指定大小
        viewSize: []
    };

    // 插件
    Switchable.Plugins = [];

    Switchable.prototype = {

        /**
         * init switchable
         */
        _init: function () {
            var self = this, cfg = self.config;

            // parse markup
            self._parseMarkup();

            // 切换到指定项
            if (cfg.switchTo) {
                self.switchTo(cfg.switchTo);
            }

            // bind triggers
            if (cfg.hasTriggers) {
                self._bindTriggers();
            }

            // init plugins
            $.each(Switchable.Plugins, function (i, plugin) {
                if (plugin.init) {
                    plugin.init(self);
                }
            });

            $(self).trigger(EVENT_INIT);
        },

        /**
         * 解析 markup, 获取 triggers, panels, content
         */
        _parseMarkup: function () {
            var self = this, container = self.container,
                cfg = self.config,
                nav, content, triggers = [], panels = [], i, n, m;

            switch (cfg.markupType) {
                case 0: // 默认结构
                    nav = $(DOT + cfg.navCls, container);
                    if (nav) triggers = $(nav).children();
                    content = $(DOT + cfg.contentCls, container);
                    panels = $(content).children();
                    break;
                case 1: // 适度灵活
                    triggers = $(DOT + cfg.triggerCls, container);
                    panels = $(DOT + cfg.panelCls, container);
                    break;
                case 2: // 完全自由
                    triggers = cfg.triggers;
                    panels = cfg.panels;
                    break;
            }


            // get length
            n = panels.length;
            self.length = n / cfg.steps;

            // 自动生成 triggers
            if (cfg.hasTriggers && n > 0 && triggers.length === 0) {
                triggers = self._generateTriggersMarkup(self.length);
            }

            // 将 triggers 和 panels 转换为普通数组
            self.triggers = $.makeArray(triggers);
            self.panels = $.makeArray(panels);

            // get content
            self.content = content || panels[0].parentNode;
        },

        /**
         * 自动生成 triggers 的 markup
         */
        _generateTriggersMarkup: function (len) {
            var self = this, cfg = self.config,
                ul = $('<ul>'), li, i;

            ul.addClass(cfg.navCls);
            for (i = 0; i < len; i++) {
                li = $('<li>');
                if (i === self.activeIndex) {
                    li.addClass(cfg.activeTriggerCls);
                }
                li.html(i + 1);
                ul.append(li);
            }

            self.container.append(ul);
            return $(ul).children();
        },

        /**
         * 给 triggers 添加事件
         */
        _bindTriggers: function () {
            var self = this, cfg = self.config,
                triggers = self.triggers, trigger,
                i, len = triggers.length;

            for (i = 0; i < len; i++) {
                (function (index) {
                    trigger = triggers[index];

                    $(trigger).bind('click', function () {
                        self._onFocusTrigger(index);
                    });

                    if (cfg.triggerType === 'mouse') {
                        $(trigger).bind('mouseenter', function () {
                            self._onMouseEnterTrigger(index);
                        });
                        $(trigger).bind('mouseleave', function () {
                            self._onMouseLeaveTrigger(index);
                        });
                    }
                })(i);
            }
        },

        /**
         * click or tab 键激活 trigger 时触发的事件
         */
        _onFocusTrigger: function (index) {
            var self = this;
            if (!self._triggerIsValid(index)) return; // 重复点击

            this._cancelSwitchTimer(); // 比如：先悬浮，再立刻点击，这时悬浮触发的切换可以取消掉。
            self.switchTo(index);
        },

        /**
         * 鼠标悬浮在 trigger 上时触发的事件
         */
        _onMouseEnterTrigger: function (index) {
            var self = this;
            if (!self._triggerIsValid(index)) return; // 重复悬浮。比如：已显示内容时，将鼠标快速滑出再滑进来，不必再次触发。

            self.switchTimer = setTimeout(function () {
                self.switchTo(index);
            }, self.config.delay * 1000)

        },

        /**
         * 鼠标移出 trigger 时触发的事件
         */
        _onMouseLeaveTrigger: function () {
            this._cancelSwitchTimer();
        },

        /**
         * 重复触发时的有效判断
         */
        _triggerIsValid: function (index) {
            return this.activeIndex !== index;
        },

        /**
         * 取消切换定时器
         */
        _cancelSwitchTimer: function () {
            var self = this;
            if (self.switchTimer) {
                clearTimeout(self.switchTimer);
                self.switchTimer = undefined;
            }
        },

        /**
         * 切换操作
         */
        switchTo: function (index, direction) {
            var self = this, cfg = self.config,
                triggers = self.triggers, panels = self.panels,
                activeIndex = self.activeIndex,
                steps = cfg.steps,
                fromIndex = activeIndex * steps, toIndex = index * steps;

            if (!self._triggerIsValid(index)) return self; // 再次避免重复触发
            if ($(self).trigger(EVENT_BEFORE_SWITCH, {toIndex: index}) === false) return self;

            // switch active trigger
            if (cfg.hasTriggers) {
                self._switchTrigger(activeIndex > -1 ? triggers[activeIndex] : null, triggers[index]);
            }

            // switch active panels
            if (direction === undefined) {
                direction = index > activeIndex ? FORWARD : BACKWARD;
            }

            // switch view
            self._switchView(
                panels.slice(fromIndex, fromIndex + steps),
                panels.slice(toIndex, toIndex + steps),
                index,
                direction);

            // update activeIndex
            self.activeIndex = index;

            return self; // chain
        },

        /**
         * 切换当前触点
         */
        _switchTrigger: function (fromTrigger, toTrigger/*, index*/) {
            var activeTriggerCls = this.config.activeTriggerCls;

            if (fromTrigger) $(fromTrigger).removeClass(activeTriggerCls);
            $(toTrigger).addClass(activeTriggerCls);
        },

        /**
         * 切换视图
         */
        _switchView: function (fromPanels, toPanels, index/*, direction*/) {
            // 最简单的切换效果：直接隐藏/显示
            $(fromPanels).css(DISPLAY, NONE);
            $(toPanels).css(DISPLAY, BLOCK);

            // fire onSwitch events
            this._fireOnSwitch(index);
        },

        /**
         * 触发 switch 相关事件
         */
        _fireOnSwitch: function (index) {
            $(this).trigger(EVENT_SWITCH, {currentIndex: index});
        },

        /**
         * 切换到上一视图
         */
        prev: function () {
            var self = this, activeIndex = self.activeIndex;
            self.switchTo(activeIndex > 0 ? activeIndex - 1 : self.length - 1, BACKWARD);
        },

        /**
         * 切换到下一视图
         */
        next: function () {
            var self = this, activeIndex = self.activeIndex;
            self.switchTo(activeIndex < self.length - 1 ? activeIndex + 1 : 0, FORWARD);
        }
    }

    YSDK.Switchable = Switchable;

});

/**
 * NOTES:
 *
 * 2010.07
 *  - 重构，去掉对 YUI2-Animation 的依赖
 *
 * 2010.04
 *  - 重构，脱离对 yahoo-dom-event 的依赖
 *
 * 2010.03
 *  - 重构，去掉 Widget, 部分代码直接采用 kissy 基础库
 *  - 插件机制从 weave 织入法改成 hook 钩子法
 *
 * TODO:
 *  - http://malsup.com/jquery/cycle/
 *  - http://www.mall.taobao.com/go/chn/mall_chl/flagship.php
 *  - 对 touch 设备的支持
 *
 * References:
 *  - jQuery Scrollable http://flowplayer.org/tools/scrollable.html
 *
 */
/**
 * Switchable Autoplay Plugin
 * @creator  玉伯<lifesinger@gmail.com>
 */
YSDK.add(function () {

    var Switchable = YSDK.Switchable;

    /**
     * 添加默认配置
     */
    YSDK.mix(Switchable.Config, {
        autoplay: false,
        interval: 5, // 自动播放间隔时间
        pauseOnHover: true  // triggerType 为 mouse 时，鼠标悬停在 slide 上是否暂停自动播放
    });

    /**
     * 添加插件
     * attached members:
     *   - this.paused
     */
    Switchable.Plugins.push({

        name: 'autoplay',

        init: function (host) {
            var cfg = host.config, interval = cfg.interval * 1000, timer;
            if (!cfg.autoplay) return;

            // 鼠标悬停，停止自动播放
            if (cfg.pauseOnHover) {
                $(host.container).bind('mouseenter', function () {
                    if (timer) {
                        clearInterval(timer);
                        timer = undefined;
                    }
                    host.paused = true; // paused 可以让外部知道 autoplay 的当前状态
                });
                $(host.container).bind('mouseleave', function () {
                    host.paused = false;
                    startAutoplay();
                });
            }

            function startAutoplay() {
                // 设置自动播放

                timer = setInterval(function () {
                    if (host.paused) return;

                    // 自动播放默认 forward（不提供配置），这样可以保证 circular 在临界点正确切换
                    host.switchTo(host.activeIndex < host.length - 1 ? host.activeIndex + 1 : 0, 'forward');
                }, interval)
            }

            // go
            startAutoplay();
        }
    });

});
/**
 * Switchable Effect Plugin
 * @creator  玉伯<lifesinger@gmail.com>
 */
YSDK.add(function () {

    var DISPLAY = 'display', BLOCK = 'block', NONE = 'none',
        OPACITY = 'opacity', Z_INDEX = 'z-index',
        POSITION = 'position', RELATIVE = 'relative', ABSOLUTE = 'absolute',
        SCROLLX = 'scrollx', SCROLLY = 'scrolly', FADE = 'fade',
        LEFT = 'left', TOP = 'top', FLOAT = 'float', PX = 'px',
        Switchable = YSDK.Switchable, Effects;

    /**
     * 添加默认配置
     */
    YSDK.mix(Switchable.Config, {
        effect: NONE, // 'scrollx', 'scrolly', 'fade' 或者直接传入 custom effect fn
        duration: 500, // 动画的时长
        easing: 'easeNone', // easing method
        nativeAnim: true
    });

    /**
     * 定义效果集
     */
    Switchable.Effects = {

        // 最朴素的显示/隐藏效果
        none: function (fromEls, toEls, callback) {
            $(fromEls).css(DISPLAY, NONE);
            $(toEls).css(DISPLAY, BLOCK);
            callback();
        },

        // 淡隐淡现效果
        fade: function (fromEls, toEls, callback) {
            if (fromEls.length !== 1) {
                //  S.error('fade effect only supports steps == 1.');
            }
            var self = this, cfg = self.config,
                fromEl = fromEls[0], toEl = toEls[0];

            if (self.anim) $(self).stop(true);

            // 首先显示下一张
            $(toEl).css(OPACITY, 1);

            // 动画切换
            self.anim = $(fromEl).animate({opacity: 0}, {duration: cfg.duration, easing: cfg.easing}, function () {
                self.anim = undefined; // free

                // 切换 z-index
                $(toEl).css(Z_INDEX, 9);
                $(fromEl).css(Z_INDEX, 1);

                callback();
            });
        },

        // 水平/垂直滚动效果
        scroll: function (fromEls, toEls, callback, index) {
            var self = this, cfg = self.config,
                isX = cfg.effect === SCROLLX,
                diff = self.viewSize[isX ? 0 : 1] * index,
                props = {};

            props[isX ? LEFT : TOP] = -diff + PX;
            if (self.anim) $(self).stop(true);

            self.anim = $(self.content).animate(props, {duration: cfg.duration, easing: cfg.easing}, function () {
                self.anim = undefined; // free
                callback();
            });
        }
    };
    Effects = Switchable.Effects;
    Effects[SCROLLX] = Effects[SCROLLY] = Effects.scroll;

    /**
     * 添加插件
     * attached members:
     *   - this.viewSize
     */
    Switchable.Plugins.push({

        name: 'effect',

        /**
         * 根据 effect, 调整初始状态
         */
        init: function (host) {
            var cfg = host.config, effect = cfg.effect,
                panels = host.panels, content = host.content,
                steps = cfg.steps,
                activeIndex = host.activeIndex,
                len = panels.length;

            // 1. 获取高宽
            host.viewSize = [
                cfg.viewSize[0] || panels[0].offsetWidth * steps,
                cfg.viewSize[1] || panels[0].offsetHeight * steps
            ];
            // 注：所有 panel 的尺寸应该相同
            //    最好指定第一个 panel 的 width 和 height, 因为 Safari 下，图片未加载时，读取的 offsetHeight 等值会不对

            // 2. 初始化 panels 样式
            if (effect !== NONE) { // effect = scrollx, scrolly, fade

                // 这些特效需要将 panels 都显示出来
                $.each(panels, function (i, panel) {
                    $(panel).css(DISPLAY, BLOCK);
                });

                switch (effect) {
                    // 如果是滚动效果
                    case SCROLLX:
                    case SCROLLY:
                        // 设置定位信息，为滚动效果做铺垫
                        $(content).css(POSITION, ABSOLUTE);
                        $(content.parentNode).css(POSITION, RELATIVE); // 注：content 的父级不一定是 container

                        // 水平排列
                        if (effect === SCROLLX) {
                            $(panels).css(FLOAT, LEFT);

                            // 设置最大宽度，以保证有空间让 panels 水平排布
                            $(content).width(host.viewSize[0] * (len / steps));
                        }
                        break;

                    // 如果是透明效果，则初始化透明
                    case FADE:
                        var min = activeIndex * steps,
                            max = min + steps - 1,
                            isActivePanel;

                        $.each(panels, function (i, panel) {
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

            // 3. 在 CSS 里，需要给 container 设定高宽和 overflow: hidden
        }
    });

    /**
     * 覆盖切换方法
     */
    Switchable.prototype._switchView = function (fromEls, toEls, index, direction) {
        var self = this, cfg = self.config,
            effect = cfg.effect,
            fn = $.isFunction(effect) ? effect : Effects[effect];

        fn.call(self, fromEls, toEls, function () {
            self._fireOnSwitch(index);
        }, index, direction);
    }

});
/**
 * Switchable Circular Plugin
 * @creator  玉伯<lifesinger@gmail.com>
 */
YSDK.add(function () {

    var POSITION = 'position', RELATIVE = 'relative',
        LEFT = 'left', TOP = 'top',
        EMPTY = '', PX = 'px',
        FORWARD = 'forward', BACKWARD = 'backward',
        SCROLLX = 'scrollx', SCROLLY = 'scrolly',
        Switchable = YSDK.Switchable;

    /**
     * 添加默认配置
     */
    YSDK.mix(Switchable.Config, {
        circular: false
    });

    /**
     * 循环滚动效果函数
     */
    function circularScroll(fromEls, toEls, callback, index, direction) {
        var self = this, cfg = self.config,
            len = self.length,
            activeIndex = self.activeIndex,
            isX = cfg.scrollType === SCROLLX,
            prop = isX ? LEFT : TOP,
            viewDiff = self.viewSize[isX ? 0 : 1],
            diff = -viewDiff * index,
            props = {},
            isCritical,
            isBackward = direction === BACKWARD;

        // 从第一个反向滚动到最后一个 or 从最后一个正向滚动到第一个
        isCritical = (isBackward && activeIndex === 0 && index === len - 1)
        || (direction === FORWARD && activeIndex === len - 1 && index === 0);

        if (isCritical) {
            // 调整位置并获取 diff
            diff = adjustPosition.call(self, self.panels, index, isBackward, prop, viewDiff);
        }
        props[prop] = diff + PX;

        // 开始动画
        if (self.anim) $(this).stop();
        self.anim = $(self.content).animate(props, {duration: cfg.duration, easing: cfg.easing}, function () {
            if (isCritical) {
                // 复原位置
                resetPosition.call(self, self.panels, index, isBackward, prop, viewDiff);
            }
            // free
            self.anim = undefined;
            callback();
        });
    }

    /**
     * 调整位置
     */
    function adjustPosition(panels, index, isBackward, prop, viewDiff) {
        var self = this, cfg = self.config,
            steps = cfg.steps,
            len = self.length,
            start = isBackward ? len - 1 : 0,
            from = start * steps,
            to = (start + 1) * steps,
            i;

        // 调整 panels 到下一个视图中
        for (i = from; i < to; i++) {
            $(panels[i]).css(POSITION, RELATIVE);
            $(panels[i]).css(prop, (isBackward ? -1 : 1) * viewDiff * len);
        }

        // 偏移量
        return isBackward ? viewDiff : -viewDiff * len;
    }

    /**
     * 复原位置
     */
    function resetPosition(panels, index, isBackward, prop, viewDiff) {
        var self = this, cfg = self.config,
            steps = cfg.steps,
            len = self.length,
            start = isBackward ? len - 1 : 0,
            from = start * steps,
            to = (start + 1) * steps,
            i;

        // 滚动完成后，复位到正常状态
        for (i = from; i < to; i++) {
            $(panels[i]).css(POSITION, EMPTY);
            $(panels[i]).css(prop, EMPTY);
        }

        // 瞬移到正常位置
        $(self.content).css(prop, isBackward ? -viewDiff * (len - 1) : EMPTY);
    }

    /**
     * 添加插件
     */
    Switchable.Plugins.push({

        name: 'circular',

        /**
         * 根据 effect, 调整初始状态
         */
        init: function (host) {
            var cfg = host.config;

            // 仅有滚动效果需要下面的调整
            if (cfg.circular && (cfg.effect === SCROLLX || cfg.effect === SCROLLY)) {
                // 覆盖滚动效果函数
                cfg.scrollType = cfg.effect; // 保存到 scrollType 中
                cfg.effect = circularScroll;
            }
        }
    });

});

/**
 * TODO:
 *   - 是否需要考虑从 0 到 2（非最后一个） 的 backward 滚动？需要更灵活
 */
/**
 * Switchable Lazyload Plugin
 * @creator  玉伯<lifesinger@gmail.com>
 */
YSDK.add(function () {

    var EVENT_BEFORE_SWITCH = 'beforeSwitch',
        IMG_SRC = 'img-src',
        AREA_DATA = 'area-data',
        FLAGS = {},
        Switchable = YSDK.Switchable;

    FLAGS[IMG_SRC] = 'data-ks-lazyload-custom';
    FLAGS[AREA_DATA] = 'ks-datalazyload-custom';

    /**
     * 添加默认配置
     */
    YSDK.mix(Switchable.Config, {
        lazyDataType: AREA_DATA // or IMG_SRC
    });

    /**
     * 织入初始化函数
     */
    Switchable.Plugins.push({

        name: 'lazyload',

        init: function (host) {
            var DataLazyload = YSDK.DataLazyload,
                cfg = host.config,
                type = cfg.lazyDataType, flag = FLAGS[type];

            if (!DataLazyload || !type || !flag) return; // 没有延迟项

            $(host).bind(EVENT_BEFORE_SWITCH, loadLazyData);

            /**
             * 加载延迟数据
             */
            function loadLazyData(ev) {
                var steps = cfg.steps,
                    from = ev.toIndex * steps,
                    to = from + steps;

                DataLazyload.loadCustomLazyData(host.panels.slice(from, to), type);
                if (isAllDone()) {
                    $(host).unbind(EVENT_BEFORE_SWITCH, loadLazyData);
                }
            }

            /**
             * 是否都已加载完成
             */
            function isAllDone() {
                var elems, i, len,
                    isImgSrc = type === IMG_SRC,
                    tagName = isImgSrc ? 'img' : (type === AREA_DATA ? 'textarea' : '');

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
/**
 * Switchable Autorender Plugin
 * @creator  玉伯<lifesinger@gmail.com>
 */
YSDK.add(function () {

    /**
     * 自动渲染 container 元素内的所有 Switchable 组件
     * 默认钩子：<div class="KS_Widget" data-widget-type="Tabs" data-widget-config="{...}">
     */
    YSDK.Switchable.autoRender = function (hook, container) {
        hook = '.' + (hook || 'KS_Widget');
        if (!container) container = '';
        var ts = container + ' ' + hook;
        $(ts).each(function (i, elem) {
            var type = elem.getAttribute('data-widget-type'), config;
            if (type && ('Switchable Tabs Slide Carousel Accordion'.indexOf(type) > -1)) {
                try {
                    config = elem.getAttribute('data-widget-config');
                    if (config) config = config.replace(/'/g, '"');

                    new YSDK[type](elem, $.parseJSON(config));
                } catch (ex) {
                    console.log(ex.stack);
                }
            }
        });
    }

});
/**
 * Tabs Widget
 * @creator  玉伯<lifesinger@gmail.com>
 */
YSDK.add(function () {

    /**
     * Tabs Class
     * @constructor
     */
    function Tabs(container, config) {
        var self = this;

        // factory or constructor
        if (!(self instanceof Tabs)) {
            return new Tabs(container, config);
        }
        Tabs.superclass.constructor.call(self, container, config);
    }

    YSDK.extend(Tabs, YSDK.Switchable);
    YSDK.Tabs = Tabs;

});
/**
* Tabs Widget
* @creator     玉伯<lifesinger@gmail.com>
*/
YSDK.add(function () {

    /**
     * 默认配置，和 Switchable 相同的部分此处未列出
     */
    var defaultConfig = {
        autoplay: true,
        circular: true
    };

    /**
     * Slide Class
     * @constructor
     */
    function Slide(container, config) {
        var self = this;

        // factory or constructor
        if (!(self instanceof Slide)) {
            return new Slide(container, config);
        }

        Slide.superclass.constructor.call(self, container, YSDK.merge(defaultConfig, config));
    }

    YSDK.extend(Slide, YSDK.Switchable);
    YSDK.Slide = Slide;

});
/**
* Carousel Widget
* @creator  玉伯<lifesinger@gmail.com>
*/
YSDK.add(function () {

    var CLS_PREFIX = 'ks-switchable-', DOT = '.',
        PREV_BTN = 'prevBtn', NEXT_BTN = 'nextBtn',

        /**
         * 默认配置，和 Switchable 相同的部分此处未列出
         */
        defaultConfig = {
            circular: true,
            prevBtnCls: CLS_PREFIX + 'prev-btn',
            nextBtnCls: CLS_PREFIX + 'next-btn',
            disableBtnCls: CLS_PREFIX + 'disable-btn'
        };

    /**
     * Carousel Class
     * @constructor
     */
    function Carousel(container, config) {
        var self = this;

        // factory or constructor
        if (!(self instanceof Carousel)) {
            return new Carousel(container, config);
        }

        // 插入 carousel 的初始化逻辑
        $(self).bind('init', function () {
            init_carousel(self);
        });

        // call super
        Carousel.superclass.constructor.call(self, container, YSDK.merge(defaultConfig, config));
    }

    YSDK.extend(Carousel, YSDK.Switchable);
    YSDK.Carousel = Carousel;

    /**
     * Carousel 的初始化逻辑
     * 增加了:
     *   self.prevBtn
     *   self.nextBtn
     */
    function init_carousel(self) {
        var cfg = self.config, disableCls = cfg.disableBtnCls;

        // 获取 prev/next 按钮，并添加事件
        $.each(['prev', 'next'], function (i,d) {
            var btn = self[d + 'Btn'] = $(DOT + cfg[d + 'BtnCls'], self.container);

            $(btn).bind('click', function (ev) {
                ev.preventDefault();
                if (!$(btn).hasClass(disableCls)) self[d]();
            });
        });

        // 注册 switch 事件，处理 prevBtn/nextBtn 的 disable 状态
        // circular = true 时，无需处理
        if (!cfg.circular) {
            $(this).bind('switch', function (ev) {
                var i = ev.currentIndex,
                    disableBtn = (i === 0) ? self[PREV_BTN]
                        : (i === self.length - 1) ? self[NEXT_BTN]
                        : undefined;

                $(self[PREV_BTN], self[NEXT_BTN]).removeClass(disableCls);
                if (disableBtn) $(disableBtn).addClass(disableCls);
            });
        }

        // 触发 itemSelected 事件
        $(self.panels).bind('click focus', function () {
            $(self).trigger('itemSelected', {item: this});
        });
    }

});


/**
* NOTES:
*
* 2010.07
*  - 添加对 prevBtn/nextBtn 的支持
*  - 添加 itemSelected 事件
*
* TODO:
*  - 对键盘事件的支持，比如 Up/Down 触发 prevItem/nextItem, PgDn/PgUp 触发 prev/next
*  - itemSelected 时，自动居中的特性
*/
/**
* Accordion Widget
* @creator  沉鱼<fool2fish@gmail.com>
*/
YSDK.add(function () {

    var DISPLAY = 'display', BLOCK = 'block', NONE = 'none',

        defaultConfig = {
            markupType: 1,
            triggerType: 'click',
            multiple: false
        };

    /**
     * Accordion Class
     * @constructor
     */
    function Accordion(container, config) {
        var self = this;

        // factory or constructor
        if (!(self instanceof Accordion)) {
            return new Accordion(container, config);
        }

        Accordion.superclass.constructor.call(self, container, YSDK.merge(defaultConfig, config));

        // multiple 模式时，switchTrigger 在 switchView 时已经实现
        if (self.config.multiple) {
            self._switchTrigger = function () {
            }
        }
    }

    YSDK.extend(Accordion, YSDK.Switchable);
    YSDK.Accordion = Accordion;

    Accordion.prototype._triggerIsValid = function (index) {
        // multiple 模式下，再次触发意味着切换展开/收缩状态
        return this.activeIndex !== index || this.config.multiple;
    }

    Accordion.prototype._switchView= function (fromPanels, toPanels, index) {
        var self = this, cfg = self.config,
            panel = toPanels[0];

        if (cfg.multiple) {
            $(self.triggers[index]).toggleClass( cfg.activeTriggerCls);
            $(panel).css( DISPLAY, panel.style[DISPLAY] == NONE ? BLOCK : NONE);
            this._fireOnSwitch(index);
        }
        else {
            Accordion.superclass._switchView.call(self, fromPanels, toPanels, index);
        }
    }


});

/**
* TODO:
*
*  - 支持动画
*
*/
