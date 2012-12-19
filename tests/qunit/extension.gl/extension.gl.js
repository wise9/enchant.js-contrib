module('extension.gl.enchant.js', {
    setup : function() {
        enchant();
        var game = new Core();
    },
    teardown : function() {

    }
});

test('Sprite3D#getQuat', function() {
    function dotQ(Q1, Q2) {
        var q1 = Q1._quat;
        var q2 = Q2._quat;
        return q1[0]*q2[0] + q1[1]*q2[1] + q1[2]*q2[2] + q1[3]*q2[3];
    }

    var rotX = Math.PI * 0.3;

    var s1 = new Sprite3D();
    s1.rotation = [
        1, 0, 0, 0,
        0, Math.cos(rotX), -Math.sin(rotX), 0,
        0, Math.sin(rotX), Math.cos(rotX), 0,
        0, 0, 0, 1
    ];
    var q1 = s1.getQuat();

    var s2 = new Sprite3D();
    s2.rotationSet(new Quat(1, 0, 0, rotX));
    var q2 = s2.getQuat();

    console.log(q1, q2);
});
