(function () {
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

    YSDK.substitute = function (str, o, regexp) {
        //if(!S.isString(str) || !$.isPlainObject(o)) return str;

        return str.replace(regexp || /\\?\{([^{}]+)\}/g, function (match, name) {
            if (match.charAt(0) === '\\') return match.slice(1);
            return (o[name] !== undefined) ? o[name] : '';
        });
    }

    YSDK.mix = mix;

    YSDK.merge = function () {
        var o = {},
            i, l = arguments.length;
        for (i = 0; i < l; ++i) {
            mix(o, arguments[i]);
        }
        return o;
    }

    YSDK.augment = function (/*r, s1, s2, ..., ov, wl*/) {
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

        if (!typeof (ov) == 'boolean') {
            ov = undefined;
            len++;
        }

        for (; i < len; i++) {
            mix(r.prototype, args[i].prototype || args[i], ov, wl);
        }

        return r;
    }

    YSDK.add = function (fn) {
        fn(this);
        return this;
    }

    YSDK.extend = function (r, s, px, sx) {
        if (!s || !r) return r;
        var create = Object.create ?
                function (proto, c) {
                    return Object.create(proto, {
                        constructor: {
                            value: c
                        }
                    });
                } :
                function (proto, c) {
                    function F() {
                    }

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
