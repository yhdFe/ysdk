(function(win, S, undefined) {
    if (win[S] === undefined) win[S] = {};
    S = win[S]; // shortcut

    var mix = function(r, s, ov, wl) {
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
        };

    mix(S, {


        __init: function() {
            // 环境信息
            this.Env = {
                mods: { }
            };
        },


        mix: mix,

        merge: function() {
            var o = {}, i, l = arguments.length;
            for (i = 0; i < l; ++i) {
                mix(o, arguments[i]);
            }
            return o;
        },


        augment: function(/*r, s1, s2, ..., ov, wl*/) {
            var args = arguments, len = args.length - 2,
                r = args[0], ov = args[len], wl = args[len + 1],
                i = 1;

            if (!S.isArray(wl)) {
                ov = wl;
                wl = undefined;
                len++;
            }

            if (!S.isBoolean(ov)) {
                ov = undefined;
                len++;
            }

            for (; i < len; i++) {
                mix(r.prototype, args[i].prototype || args[i], ov, wl);
            }

            return r;
        },

        extend: function(r, s, px, sx) {
            if (!s || !r) return r;

            var OP = Object.prototype,
                O = function (o) {
                    function F() {
                    }

                    F.prototype = o;
                    return new F();
                },
                sp = s.prototype,
                rp = O(sp);

            r.prototype = rp;
            rp.constructor = r;
            r.superclass = sp;

            // assign constructor property
            if (s !== Object && sp.constructor === OP.constructor) {
                sp.constructor = s;
            }

            // add prototype overrides
            if (px) {
                mix(rp, px);
            }

            // add object overrides
            if (sx) {
                mix(r, sx);
            }

            return r;
        },

        add: function(name, fn, config) {
            var self = this, mods = self.Env.mods, o;

            // S.add(name, config) => S.add( { name: config } )
                o = { };
                o[name] = fn;
                name = o;


            // S.add( { name: config } )
            if ($.isPlainObject(name)) {
                $.each(name, function(v, k) {
                    v.name = k;
                    if(mods[k]) mix(v, mods[k], false); // 保留之前添加的配置
                });
                mix(mods, name);
            }
            return self;
        }


    });

    S.__init();

})(window, 'YSDK');








































