// Embed the approved icon in generated cards so first deploys do not depend
// on fetching a new asset from the previous production deployment.
import icon from '../assets/foxy-icon-v1.png?inline';
import face from '../assets/foxy-face-v1.png?inline';
export const foxyIconData = icon;
export const foxyFaceData = face;
