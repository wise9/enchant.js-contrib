/**
 * @fileOverview
 * extension.gl.enchant.js
 * @version 0.0.1
 * @require gl.enchant.js v0.3.7
 * @author daishi_hmr
 *
 * [lang:ja]
 * @description
 * gl.enchant.jsを拡張するライブラリ
 *
 * @detail
 * AABB2: 幅・高さ・奥行きを個別に設定可能なAABB.
 * Sprite3D#tl: タイムラインアニメーションをSprite3Dで利用可能にするプロパティ.
 * [/lang]
 * [lang:en]
 * @description
 * gl.enchant.js extension library.
 *
 * @detail
 * AABB2: can be set height, width and depth individually.
 * Sprite3D#tl: for using Timeline Animation.
 * [/lang]
 */

/**
 * @namespace
 */
enchant.gl.extension = {};

/**
 * [lang:ja]
 * 3Dワールド座標を2Dスクリーン座標に変換する.
 * [/lang]
 * [lang:en]
 * transform 3D world coordinates to 2D screen coordinates.
 * [/lang]
 */
enchant.gl.extension.toScreenCoord = function(x, y, z) {
    var game = enchant.Core.instance;
    var camera = game.currentScene3D.getCamera();

    var pm = mat4.perspective(20, game.width / game.height, 1.0, 1000.0);
    var vm = mat4.lookAt([ camera._x, camera._y, camera._z ], [
            camera._centerX, camera._centerY, camera._centerZ ], [
            camera._upVectorX, camera._upVectorY, camera._upVectorZ ]);
    var sc = mat4.multiplyVec4(mat4.multiply(pm, vm, mat4.create()), [ x, y, z, 1 ]);

    var scX = (1 - (-sc[0] / sc[3])) * (game.width / 2);
    var scY = (1 - (sc[1] / sc[3])) * (game.height / 2);

    return {
        x : scX,
        y : scY
    };
};

/**
 * [lang:ja]
 * クォータニオン同士の積.
 * [/lang]
 * [lang:en]
 * multiply quaternion and quaternion.
 * [/lang]
 */
enchant.gl.Quat.prototype.multiply = function(another) {
    var q = new enchant.gl.Quat(0, 0, 0, 0);
    quat4.multiply(this._quat, another._quat, q._quat);
    return q;
};

/**
 * [lang:ja]
 * 回転行列をクォータニオンに変換.
 * [/lang]
 * [lang:en]
 * transform rotationMatrix to Quaternion.
 * [/lang]
 */
enchant.gl.extension.mat4ToQuat = function(m, q) {
    if (!q) {
        q = quat4.create();
    }

    var s;
    var tr = m[0] + m[5] + m[10] + 1.0;
    if (tr >= 1.0) {
        s = 0.5 / Math.sqrt(tr);
        q[0] = (m[6] - m[9]) * s;
        q[1] = (m[8] - m[2]) * s;
        q[2] = (m[1] - m[4]) * s;
        q[3] = 0.25 / s;
    } else {
        var max;
        if (m[5] > m[10]) {
            max = m[5];
        } else {
            max = m[10];
        }

        if (max < m[0]) {
            s = Math.sqrt(m[0] - (m[5] + m[10]) + 1.0);
            var x = s * 0.5;
            s = 0.5 / s;
            q[0] = x;
            q[1] = (m[1] + m[4]) * s;
            q[2] = (m[8] + m[2]) * s;
            q[3] = (m[6] - m[9]) * s;
        } else if (max === m[5]) {
            s = Math.sqrt(m[5] - (m[10] + m[0]) + 1.0);
            var y = s * 0.5;
            s = 0.5 / s;
            q[0] = (m[1] + m[4]) * s;
            q[1] = y;
            q[2] = (m[6] + m[9]) * s;
            q[3] = (m[8] - m[2]) * s;
        } else {
            s = Math.sqrt(m[10] - (m[0] + m[5]) + 1.0);
            var z = s * 0.5;
            s = 0.5 / s;
            q[0] = (m[8] + m[2]) * s;
            q[1] = (m[6] + m[9]) * s;
            q[2] = z;
            q[3] = (m[1] - m[4]) * s;
        }
    }

    return q;
};

/**
 * [lang:ja]
 * 現在の姿勢をクォータニオンで取得する.
 * [/lang]
 * [lang:en]
 * get current attitude as quaternion.
 * [/lang]
 *
 * @scope enchant.gl.Sprite3D.prototype
 */
enchant.gl.Sprite3D.prototype.getQuat = function() {
    var quat = new enchant.gl.Quat();
    quat._quat = enchant.gl.extension.mat4ToQuat(this._rotation);
    return quat;
};

/**
 * [lang:ja]
 * ワールド座標を返す.
 * [/lang]
 * [lang:en]
 * return world coordinates.
 * [/lang]
 *
 * @scope enchant.gl.Sprite3D.prototype
 */
enchant.gl.Sprite3D.prototype.getWorldCoord = function() {
    function baseMatrix(s3d) {
        if (s3d.parentNode instanceof enchant.gl.Sprite3D) {
            return mat4.multiply(baseMatrix(s3d.parentNode), s3d.modelMat, mat4.create());
        } else {
            return s3d.modelMat;
        }
    }

    var game = enchant.Core.instance;

    if (this.globalCoordCache && this.globalCoordCache.frame === game.frame) {
        return this.globalCoordCache.coord;
    } else {
        this.globalCoordCache = {
            frame : game.frame
        };
    }

    var m = baseMatrix(this);

    this.globalCoordCache.coord = { x: m[12], y: m[13], z: m[14] };
    return this.globalCoordCache.coord;
};

/**
 * [lang:ja]
 * スクリーン上の座標を返す.
 * [/lang]
 * [lang:en]
 * return screen coordinates.
 * [/lang]
 *
 * @scope enchant.gl.Sprite3D.prototype
 */
enchant.gl.Sprite3D.prototype.getScreenCoord = function() {
    var game = enchant.Core.instance;

    if (this.screenCoordCache && this.screenCoordCache.frame === game.frame) {
        return this.screenCoordCache.coord;
    } else {
        this.screenCoordCache = {
            frame : game.frame
        };
    }

    var scene = game.currentScene3D;
    if (!scene) {
        return null;
    }

    var g = this.getWorldCoord();
    this.screenCoordCache.coord = enchant.gl.extension.toScreenCoord(g.x, g.y, g.z);
    return this.screenCoordCache.coord;
};

(function(enchant) {
    // extend Sprite3D constructor
    var orig = enchant.gl.Sprite3D.prototype.initialize;
    enchant.gl.Sprite3D.prototype.initialize = function() {
        orig.apply(this, arguments);
        if (enchant.ENV.USE_ANIMATION) {
            var tl = this.tl = new enchant.gl.extension.Timeline(this);
        }
    };
})(enchant);

/**
 * @scope enchant.gl.extension.Tween.prototype
 */
enchant.gl.extension.Tween = enchant.Class.create(enchant.Action, {
    initialize : function(params) {
        var origin = {};
        var target = {};
        enchant.Action.call(this, params);

        if (this.easing == null) {
            // linear
            this.easing = function(t, b, c, d) {
                return c * t / d + b;
            };
        }

        var tween = this;
        this.addEventListener(enchant.Event.ACTION_START, function() {
            var excepted = [ "frame", "time", "callback", "onactiontick", "onactionstart", "onactionend" ];
            for ( var prop in params) {
                if (params.hasOwnProperty(prop)) {
                    var target_val;
                    if (typeof params[prop] === "function") {
                        target_val = params[prop].call(tween.node);
                    } else {
                        target_val = params[prop];
                    }

                    if (excepted.indexOf(prop) === -1) {
                        origin[prop] = tween.node[prop];
                        target[prop] = target_val;
                    }

                    if (prop === "quat") {
                        origin[prop] = tween.node.getQuat();
                        target[prop] = target_val;
                    }
                }
            }
        });

        this.addEventListener(enchant.Event.ACTION_TICK, function(evt) {
            for ( var prop in target) {
                if (target.hasOwnProperty(prop)) {
                    var ratio;
                    if (prop === "quat") {
                        ratio = tween.easing(tween.frame, 0, 1, tween.time);
                        if (1 - ratio < 10e-8) {
                            ratio = 1;
                        }
                        var val = origin[prop].slerp(target[prop], ratio);
                        tween.node.rotationSet(val);
                    } else {
                        if (typeof this[prop] === "undefined") {
                            continue;
                        }
                        // if time is 0, set property to target value immediately
                        ratio = tween.time === 0 ? 1 : tween.easing(Math.min(tween.time,tween.frame + evt.elapsed), 0, 1, tween.time) - tween.easing(tween.frame, 0, 1, tween.time);
                        tween.node[prop] += (target[prop] - origin[prop]) * ratio;
                        if (Math.abs(tween.node[prop]) < 10e-8){
                            tween.node[prop] = 0;
                        }
                    }
                }
            }
        });
    }
});

/**
 * @scope enchant.gl.extension.Timeline.prototype
 */
enchant.gl.extension.Timeline = enchant.Class.create(enchant.Timeline, {
    initialize : function(node) {
        enchant.Timeline.call(this, node);
    },
    tween : function(params) {
        return this.add(new enchant.gl.extension.Tween(params));
    },
    /**
     * [lang:ja]
     * Sprite3D の位置をなめらかに移動させるアクションを追加する。
     * @param x 目標のx座標
     * @param y 目標のy座標
     * @param z 目標のz座標
     * @param time フレーム数
     * @param [easing] イージング関数
     * [/lang]
     */
    moveTo : function(x, y, z, time, easing) {
        return this.tween({
            x : x,
            y : y,
            z : z,
            time : time,
            easing : easing
        });
    },
    /**
     * [lang:ja]
     * Sprite3D のz座標をなめらかに変化させるアクションを追加する。
     * @param z
     * @param time
     * @param [easing]
     * [/lang]
     */
    moveZ : function(z, time, easing) {
        return this.tween({
            z : z,
            time : time,
            easing : easing
        });
    },
    /**
     * [lang:ja]
     * Sprite3D の位置をなめらかに変化させるアクションを追加する。
     * 座標は、アクション開始時からの相対座標で指定する。
     * @param x
     * @param y
     * @param z
     * @param time
     * @param [easing]
     * [/lang]
     */
    moveBy : function(x, y, z, time, easing) {
        return this.tween({
            x : function() {
                return this.x + x;
            },
            y : function() {
                return this.y + y;
            },
            z : function() {
                return this.z + z;
            },
            time : time,
            easing : easing
        });
    },
    /**
     * [lang:ja]
     * Sprite3D をなめらかに拡大・縮小するアクションを追加する。
     * @param scaleX 縮尺
     * @param [scaleY] 縮尺。省略した場合 scaleX と同じ
     * @param [scaleZ] 縮尺。省略した場合 scaleX と同じ
     * @param time
     * @param [easing]
     * [/lang]
     */
    scaleTo : function(scale, time, easing) {
        if (typeof easing === "number") {
            return this.tween({
                scaleX : arguments[0],
                scaleY : arguments[1],
                scaleZ : arguments[2],
                time : arguments[3],
                easing: arguments[4]
            });
        }
        return this.tween({
            scaleX : scale,
            scaleY : scale,
            scaleZ : scale,
            time : time,
            easing : easing
        });
    },
    /**
     * [lang:ja]
     * Sprite3D をなめらかに拡大・縮小させるアクションを追加する。
     * 相対縮尺 (ex. アクション開始時の縮尺の n 倍) で指定する。
     * @param scaleX 相対縮尺
     * @param [scaleY] 相対縮尺。省略した場合 scaleX と同じ
     * @param [scaleZ] 相対縮尺。省略した場合 scaleZ と同じ
     * @param time
     * @param [easing]
     * [/lang]
     */
    scaleBy : function(scale, time, easing) {
        if (typeof easing === "number") {
            return this.tween({
                scaleX : function() {
                    return this.scaleX * arguments[0];
                },
                scaleY : function() {
                    return this.scaleY * arguments[1];
                },
                scaleZ : function() {
                    return this.scaleZ * arguments[2];
                },
                time : arguments[3],
                easing : arguments[4]
            });
        }
        return this.tween({
            scaleX : function() {
                return this.scaleX * scale;
            },
            scaleY : function() {
                return this.scaleY * scale;
            },
            scaleZ : function() {
                return this.scaleZ * scale;
            },
            time : time,
            easing : easing
        });
    },
    /**
     * [lang:ja]
     * Sprite3D をなめらかに回転させるアクションを追加する。
     * @param quat 目標の姿勢。クォータニオンで指定する
     * @param time フレーム数
     * @param [easing] イージング関数
     * [/lang]
     */
    rotateTo : function(quat, time, easing) {
        return this.tween({
            quat : quat,
            time : time,
            easing : easing
        });
    },
    /**
     * [lang:ja]
     * Sprite3D をなめらかに回転させるアクションを追加する。
     * 姿勢は相対角度 (アクション開始時の姿勢から更に回転) で指定する
     * @param quat 目標の姿勢。クォータニオンで指定する
     * @param time フレーム数
     * @param [easing] イージング関数
     * [/lang]
     */
    rotateBy : function(quat, time, easing) {
        return this.tween({
            quat : function() {
                return this.getQuat().multiply(quat);
            },
            time : time,
            easing : easing
        });
    },
    /**
     * [lang:ja]
     * Sprite3D をなめらかにX軸回転させるアクションを追加する。
     * @param angle 目標の角度 (ラジアン: 1回転を PI*2 とする)
     * @param time フレーム数
     * @param [easing] イージング関数
     * [/lang]
     */
    rotatePitchTo : function(angle, time, easing) {
        return this.rotateTo(new enchant.gl.Quat(1, 0, 0, angle), time, easing);
    },
    /**
     * [lang:ja]
     * Sprite3D をなめらかにY軸回転させるアクションを追加する。
     * @param angle 目標の角度 (ラジアン: 1回転を PI*2 とする)
     * @param time フレーム数
     * @param [easing] イージング関数
     * [/lang]
     */
    rotateYawTo : function(angle, time, easing) {
        return this.rotateTo(new enchant.gl.Quat(0, 1, 0, angle), time, easing);
    },
    /**
     * [lang:ja]
     * Sprite3D をなめらかにZ軸回転させるアクションを追加する。
     * @param angle 目標の角度 (ラジアン: 1回転を PI*2 とする)
     * @param time フレーム数
     * @param [easing] イージング関数
     * [/lang]
     */
    rotateRollTo : function(angle, time, easing) {
        return this.rotateTo(new enchant.gl.Quat(0, 0, 1, angle), time, easing);
    },
    /**
     * [lang:ja]
     * Sprite3D をなめらかにX軸回転させるアクションを追加する。
     * 角度は相対角度 (アクション開始時の角度から更に n 度) で指定する
     * @param angle 目標の相対角度 (ラジアン: 1回転を PI*2 とする)
     * @param time フレーム数
     * @param [easing] イージング関数
     * [/lang]
     */
    rotatePitchBy : function(angle, time, easing) {
        return this.rotateBy(new enchant.gl.Quat(1, 0, 0, angle), time, easing);
    },
    /**
     * [lang:ja]
     * Sprite3D をなめらかにY軸回転させるアクションを追加する。
     * 角度は相対角度 (アクション開始時の角度から更に n 度) で指定する
     * @param angle 目標の相対角度 (ラジアン: 1回転を PI*2 とする)
     * @param time フレーム数
     * @param [easing] イージング関数
     * [/lang]
     */
    rotateYawBy : function(angle, time, easing) {
        return this.rotateBy(new enchant.gl.Quat(0, 1, 0, angle), time, easing);
    },
    /**
     * [lang:ja]
     * Sprite3D をなめらかにZ軸回転させるアクションを追加する。
     * 角度は相対角度 (アクション開始時の角度から更に n 度) で指定する
     * @param angle 目標の相対角度 (ラジアン: 1回転を PI*2 とする)
     * @param time フレーム数
     * @param [easing] イージング関数
     * [/lang]
     */
    rotateRollBy : function(angle, time, easing) {
        return this.rotateBy(new enchant.gl.Quat(0, 0, 1, angle), time, easing);
    }
});

(function(enchant) {
    var point2AABB2 = function(p, aabb) {
        var ppx = p.x + p.parent.x;
        var ppy = p.y + p.parent.y;
        var ppz = p.z + p.parent.z;
        var px = aabb.parent.x + aabb.x + aabb.scaleX;
        var py = aabb.parent.y + aabb.y + aabb.scaleY;
        var pz = aabb.parent.z + aabb.z + aabb.scaleZ;
        var nx = aabb.parent.x + (aabb.x - aabb.scaleX);
        var ny = aabb.parent.y + (aabb.y - aabb.scaleY);
        var nz = aabb.parent.z + (aabb.z - aabb.scaleZ);
        var dist = 0;
        if (ppx < nx) {
            dist += (ppx - nx) * (ppx - nx);
        } else if (px < ppx) {
            dist += (ppx - px) * (ppx - px);
        }
        if (ppy < ny) {
            dist += (ppy - ny) * (ppy - ny);
        } else if (py < ppy) {
            dist += (ppy - py) * (ppy - py);
        }
        if (ppz < nz) {
            dist += (ppz - nz) * (ppz - nz);
        } else if (pz < ppz) {
            dist += (ppz - pz) * (ppz - pz);
        }
        return dist;
    };
    var AABB2AABB2 = function(aabb1, aabb2) {
        var px1 = aabb1.parent.x + aabb1.x + aabb1.scale;
        var py1 = aabb1.parent.y + aabb1.y + aabb1.scale;
        var pz1 = aabb1.parent.z + aabb1.z + aabb1.scale;

        var nx1 = aabb1.parent.x + (aabb1.x - aabb1.scale);
        var ny1 = aabb1.parent.y + (aabb1.y - aabb1.scale);
        var nz1 = aabb1.parent.z + (aabb1.z - aabb1.scale);

        var px2 = aabb2.parent.x + aabb2.x + aabb2.scaleX;
        var py2 = aabb2.parent.y + aabb2.y + aabb2.scaleY;
        var pz2 = aabb2.parent.z + aabb2.z + aabb2.scaleZ;

        var nx2 = aabb2.parent.x + (aabb2.x - aabb2.scaleX);
        var ny2 = aabb2.parent.y + (aabb2.y - aabb2.scaleY);
        var nz2 = aabb2.parent.z + (aabb2.z - aabb2.scaleZ);
        return ((nx2 <= px1) && (nx1 <= px2) && (ny2 <= py1) && (ny1 <= py2) && (nz2 <= pz1) && (nz1 <= pz2)) ? 0.0 : 1.0;
    };
    var AABB22AABB2 = function(aabb1, aabb2) {
        var px1 = aabb1.parent.x + aabb1.x + aabb1.scaleX;
        var py1 = aabb1.parent.y + aabb1.y + aabb1.scaleY;
        var pz1 = aabb1.parent.z + aabb1.z + aabb1.scaleZ;

        var nx1 = aabb1.parent.x + (aabb1.x - aabb1.scaleX);
        var ny1 = aabb1.parent.y + (aabb1.y - aabb1.scaleY);
        var nz1 = aabb1.parent.z + (aabb1.z - aabb1.scaleZ);

        var px2 = aabb2.parent.x + aabb2.x + aabb2.scaleX;
        var py2 = aabb2.parent.y + aabb2.y + aabb2.scaleY;
        var pz2 = aabb2.parent.z + aabb2.z + aabb2.scaleZ;

        var nx2 = aabb2.parent.x + (aabb2.x - aabb2.scaleX);
        var ny2 = aabb2.parent.y + (aabb2.y - aabb2.scaleY);
        var nz2 = aabb2.parent.z + (aabb2.z - aabb2.scaleZ);
        return ((nx2 <= px1) && (nx1 <= px2) && (ny2 <= py1) && (ny1 <= py2) && (nz2 <= pz1) && (nz1 <= pz2)) ? 0.0 : 1.0;
    };

    enchant.gl.collision.Bounding.prototype.intersect = function(another) {
        switch (another.type) {
        case 'point':
            return (this.toBounding(another) < this.threshold);
        case 'BS':
            return (this.toBS(another) < this.threshold);
        case 'AABB':
            return (this.toAABB(another) < this.threshold);
        case 'OBB':
            return (this.toOBB(another) < this.threshold);
        case 'AABB2':
            return (this.toAABB2(another) < this.threshold);
        default:
            return false;
        }
    };
    enchant.gl.collision.Bounding.prototype.toAABB2 = function(another) {
        return point2AABB2(this, another);
    };
    enchant.gl.collision.BS.prototype.toAABB2 = function(another) {
        return (point2AABB2(this, another) - this.radius * this.radius);
    };
    enchant.gl.collision.AABB.prototype.toAABB2 = function(another) {
        return AABB2AABB2(this, another);
    };
    enchant.gl.collision.OBB.prototype.toAABB2 = function(another) {
        return 1;
    };

    /**
     * @scope enchant.gl.collision.AABB2.prototype
     */
    enchant.gl.collision.AABB2 = enchant.Class.create(enchant.gl.collision.Bounding, {
        /**
         * [lang:ja]
         * Sprite3Dの衝突判定を設定するクラス.
         * 回転しない直方体として定義されている.
         * @constructs
         * @see enchant.gl.collision.Bounding
         * [/lang]
         * [lang:en]
         * Class that sets Sprite3D collision detection.
         * Defined as non-rotating box.
         * @constructs
         * @see enchant.gl.collision.Bounding
         * [/lang]
         */
        initialize : function() {
            enchant.gl.collision.Bounding.call(this);
            this.type = 'AABB2';
            this.scaleX = 0.5;
            this.scaleY = 0.5;
            this.scaleZ = 0.5;
        },
        toBounding : function(another) {
            return point2AABB2(another, this);
        },
        toBS : function(another) {
            return (point2AABB2(another, this) - another.radius * another.radius);
        },
        toAABB : function(another) {
            return AABB2AABB2(this, another);
        },
        toAABB2 : function(another) {
            return AABB22AABB2(this, another);
        },
        toOBB : function(another) {
            return 1;
        }
    });

    /**
     * @scope enchant.gl.collision.NONE.prototype
     */
    enchant.gl.collision.NONE = enchant.Class.create(enchant.gl.collision.Bounding, {
        /**
         * [lang:ja]
         * 衝突が発生しないBounding.
         * [/lang]
         */
        initialize : function() {
            enchant.gl.collision.Bounding.call(this);
            this.type = 'NONE';
        },
        toBounding : function(another) {
            return 1000;
        },
        toBS : function(another) {
            return 1000;
        },
        toAABB : function(another) {
            return 1000;
        },
        toOBB : function(another) {
            return 1000;
        }
    });

})(enchant);
