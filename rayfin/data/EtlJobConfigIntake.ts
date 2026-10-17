import { authenticated, boolean, date, entity, text, uuid } from '@microsoft/rayfin-core';

@entity()
@authenticated('*')
export class EtlJobConfigIntake {
  @uuid() id!: string;
  @text({ max: 200 }) jobName!: string;
  @text({ max: 50 }) layerName!: string;
  @text({ max: 500 }) sourceObject!: string;
  @text({ max: 500 }) targetObject!: string;
  @text({ max: 20 }) dataLoad!: string;
  @text({ max: 200 }) watermarkColumn!: string;
  @boolean({ default: false }) processed!: boolean;
  @date() submittedAt!: Date;
}
