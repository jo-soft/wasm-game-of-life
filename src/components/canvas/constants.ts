const CAMERA_FOV_RAD = Math.PI / 3;      // 60-degree vertical field of view
const CAMERA_NEAR = 0.1;                 // Near clipping plane distance
const CAMERA_FAR = 100.0;                // Far clipping plane distance
const CAMERA_DISTANCE_Z = -3.4;          // View position setback along Z axis
const ROTATION_SPEED_Y = 0.00035;        // Y-axis continuous spin speed (rad/ms)
const ROTATION_TILT_X = -0.35;           // Static X-axis forward tilt (rad)

export {
  CAMERA_FOV_RAD,
  CAMERA_NEAR,
  CAMERA_FAR,
  CAMERA_DISTANCE_Z,
  ROTATION_SPEED_Y,
  ROTATION_TILT_X,
};