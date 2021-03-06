var createCapsule = require('primitive-capsule');
var vec3 = require('gl-matrix').vec3;
var mat4 = require('gl-matrix').mat4;

function PolyFrame(poly) {

  capsule = createCapsule(.04, 4.5);

  var positions = [];
  var normals = [];
  var tangents = [];

  for (var i = 0; i < poly.edge.length; i++) {
    var edge = poly.edge[i];
    var a = poly.vertex[edge[0]];
    var b = poly.vertex[edge[1]];

    var position = vec3.lerp([], a, b, .5);
    positions = positions.concat(position);

    var normal = vec3.sub([], a, b);
    vec3.normalize(normal, normal);
    normals = normals.concat(normal);

    var tangent = vec3.normalize([], position);
    tangents = tangents.concat(tangent);
  }

  this.groups = [];

  this.groups.push({
    positions: positions,
    normals: normals,
    tangents: tangents
  });

  this.groups.push({
    model: mat4.identity([]),
    positions: [
      17,0,0,
      -17,0,0,
      -12,-12,-10,
      -12,12,-10,
      12,-12,-10,
      12,12,-10
    ],
    normals: [
      0,0,1,
      0,0,1,
      1,0,0,
      1,0,0,
      1,0,0,
      1,0,0
    ],
    tangents: [
      0,1,0,
      0,1,0,
      0,1,0,
      0,1,0,
      0,1,0,
      0,1,0
    ]
  });

  this.drawPoly = regl({
    frag: `
      precision mediump float;

      varying vec3 vNormal;

      void main() {
        gl_FragColor = vec4(vNormal * .5 + .5, 1);
        gl_FragColor = vec4(.2,.8,.5,1);
        //gl_FragColor = vec4(vec3(1.),1);
      }
    `,

    vert: `
      precision mediump float;

      uniform mat4 proj;
      uniform mat4 view;
      uniform mat4 model;
      uniform float time;

      attribute vec3 position;
      attribute vec3 normal;

      attribute vec3 iPosition;
      attribute vec3 iNormal;
      attribute vec3 iTangent;

      varying vec3 vNormal;

      void pR(inout vec2 p, float a) {
          p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
      }

      void main () {

        vNormal = normal;

        mat4 iPositionMat = mat4(
          1, 0, 0, iPosition.x,
          0, 1, 0, iPosition.y,
          0, 0, 1, iPosition.z,
          0, 0, 0, 1
        );

        vec3 n = iNormal;
        vec3 t = iTangent;
        vec3 b = cross(t, n);
        
        mat4 iRotationMat = mat4(
          n.x, t.x, b.x, 0,
          n.y, t.y, b.y, 0,
          n.z, t.z, b.z, 0,
          0, 0, 0, 1
        );

        vNormal = (vec4(normal.zxy, 0) * iRotationMat).xyz;

        vec4 pos = vec4(position.zxy, 1);
        // pR(pos.xz, time);
        pos = pos * iRotationMat;
        pos = pos * iPositionMat;
        pos = proj * view * model * pos;
        gl_Position = pos;
      }
    `,

    attributes: {
      position: capsule.positions,
      normal: capsule.normals,
      iPosition: {
        buffer: function(props, context) {
          return context.positions;
        },
        divisor: 1
      },
      iNormal: {
        buffer: function(props, context) {
          return context.normals;
        },
        divisor: 1
      },
      iTangent: {
        buffer: function(props, context) {
          return context.tangents;
        },
        divisor: 1
      }
    },

    uniforms: {
      time: regl.context('time'),
      model: function(props, context) {
        return context.model;
      }
    },

    elements: capsule.cells,

    instances: function(props, context) {
      return context.positions.length / 3;
    },

    count: capsule.cells.length * 3,
  });
}

PolyFrame.prototype.draw = function(context) {
  this.groups.forEach(group => {
    this.drawPoly({
      model: group.model || context.model,
      positions: group.positions,
      normals: group.normals,
      tangents: group.tangents
    });
  });
};

module.exports = PolyFrame;
