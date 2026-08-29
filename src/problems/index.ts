// Adding a problem means adding a file and one line here. Order decides the
// order problems appear inside their category. A problem absent from this list
// is not on the site, which is how work in progress stays off it.
import { problem as p01 } from "./p01-square-circle-packing";
import { problem as p02 } from "./p02-circle-circle-packing";
import { problem as p03 } from "./p03-heilbronn-triangle";
import { problem as p05 } from "./p05-tilted-squares-in-circle";
import { problem as p06 } from "./p06-graduated-circles-in-circle";
import { problem as p07 } from "./p07-spread-points-in-circle";
import { problem as p08 } from "./p08-circles-in-an-l";
import { p09, p10, p16, p17, p19, p20, p21, p22, p24, p25, p26, p27, p28, p30, p31, p32, p33, p34, p58 } from "./grid";
import { problem as p11 } from "./p11-circles-in-right-triangle";
import { problem as p12 } from "./p12-circles-in-rectangle";
import { problem as p13 } from "./p13-graduated-circles-in-square";
import { problem as p15 } from "./p15-spread-points-in-square";
import { problem as p18 } from "./p18-tilted-squares-in-square";
import { problem as p29 } from "./p29-heilbronn-in-triangle";
import { problem as p51 } from "./p51-lights-in-a-square";
import { problem as p52 } from "./p52-min-distance-ratio";
import { problem as p53 } from "./p53-biggest-little-polygon";
import { problem as p54 } from "./p54-star-discrepancy";
import { problem as p55 } from "./p55-optimal-quantization";
import { problem as p56 } from "./p56-uniform-mesh";
import { problem as p57 } from "./p57-sum-of-radii";
import { problem as p59 } from "./p59-l2-star-discrepancy";
import { problem as p60 } from "./p60-line-packing";
import { problem as p61 } from "./p61-complex-projective";
import { problem as p62 } from "./p62-worst-projection";
import { problem as p63 } from "./p63-torus-quadrature";
import { problem as p64 } from "./p64-subspace-packing";
import { problem as p65 } from "./p65-erasure-frames";
import type { ProblemModule } from "../problem-kit";

export const problemModules: ProblemModule[] = [p01, p02, p03, p05, p06, p07, p08, p09, p10, p11, p12, p13, p15, p16, p17, p18, p19, p20, p21, p22, p24, p25, p26, p27, p28, p29, p30, p31, p32, p33, p34, p51, p52, p53, p54, p55, p56, p57, p58, p59, p60, p61, p62, p63, p64, p65];
