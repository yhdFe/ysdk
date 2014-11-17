var YSDK = function () {
};
YSDK.substitute = function (str, o) {
    console.log(str);
    var reg = /{.*}/ig;
    var arr = str.match(reg);

};

YSDK.extend = function(r, s, px, sx)
{
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