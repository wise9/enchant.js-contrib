module('extension.gl.enchant.js', {
    setup : function() {
        enchant();
    },
    teardown : function() {

    }
});

function nearlyEqual(numA, numB, accuracy) {
    console.log(numA, numB);
    accuracy = accuracy || 5;
    var result = Math.abs(numA*Math.pow(10, accuracy) - numB*Math.pow(10, accuracy));
    return ok(result < 1);
}

test('Sprite3D#getQuat', function() {
    var core = new Core();

    var rotX = 1.5;

    var s1 = new Sprite3D();
    s1.rotation = [
        1, 0, 0, 0,
        0, Math.cos(-rotX), -Math.sin(-rotX), 0,
        0, Math.sin(-rotX), Math.cos(-rotX), 0,
        0, 0, 0, 1
    ];
    var q1 = s1.getQuat();
    var q2 = new Quat(1, 0, 0, rotX);

    nearlyEqual(q1._quat[0], q2._quat[0]);
    nearlyEqual(q1._quat[1], q2._quat[1]);
    nearlyEqual(q1._quat[2], q2._quat[2]);
    nearlyEqual(q1._quat[3], q2._quat[3]);
});

test('Sprite3D#getWorldCoord', function() {
    var core = new Core();
    var scene = new Scene3D();
    var s1 = new Sprite3D();
    var s2 = new Sprite3D();

    s1.addChild(s2);
    scene.addChild(s1);

    s1.x = 1;
    s2.x = 1;
    core._tick(); // モデル行列を更新するためにフレームを進める

    var wc = s2.getWorldCoord();
    nearlyEqual(wc.x, 2);
    nearlyEqual(wc.y, 0);
    nearlyEqual(wc.z, 0);

    s1.rotateRoll(Math.PI * 0.5);
    core._tick();

    wc = s2.getWorldCoord();
    nearlyEqual(wc.x, 1);
    nearlyEqual(wc.y, 1);
    nearlyEqual(wc.z, 0);
});

test('Sprite3D#getScreenCoord', function() {
    var core = new Core(100, 100);
    var scene = new Scene3D();
    var camera = scene.getCamera();
    var s = new Sprite3D();
    scene.addChild(s);

    s.x = 0;
    s.y = 0;
    s.z = 0;
    core._tick();

    // 画面の中央にいる
    var sc1 = s.getScreenCoord();
    equal(sc1.x, 50);
    equal(sc1.y, 50);

    // 空間上で上に移動
    s.y = 1;
    core._tick();

    // 画面上でも上に移動している
    var sc2 = s.getScreenCoord();
    equal(sc1.x, sc2.x);
    ok(sc1.y > sc2.y);

    // 注視する
    camera.lookAt(s);
    core._tick();

    // 画面の中央に来ている
    var sc3 = s.getScreenCoord();
    equal(sc3.x, 50);
    equal(sc3.y, 50);
});

test('Sprite3D#tl', function() {
    var core = new Core();
    var scene = new Scene3D();
    var s = new Sprite3D();

    ok(s.tl instanceof enchant.gl.extension.Timeline);
});
