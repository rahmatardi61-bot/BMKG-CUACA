import * as L from 'leaflet';

declare module 'leaflet' {
  export interface VelocityOptions {
    displayValues?: boolean;
    displayOptions?: {
      velocityType?: string;
      position?: string;
      emptyString?: string;
      angleConvention?: string;
      speedUnit?: string;
    };
    data?: any;
    maxVelocity?: number;
    minVelocity?: number;
    velocityScale?: number;
    particleMultiplier?: number;
    particleAge?: number;
    lineWidth?: number;
    colorScale?: string[];
  }

  export function velocityLayer(options?: VelocityOptions): L.Layer;
}
