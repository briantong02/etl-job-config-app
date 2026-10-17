import { getRayfinClient } from '@/services/rayfinClient';

export type { EtlJobConfigIntake } from '../../rayfin/data/EtlJobConfigIntake';

export interface JobConfigInput {
  job_name: string;
  layer_name: string;
  source_object: string;
  target_object: string;
  data_load: string;
  watermark_column: string;
}

export async function createJobConfig(params: JobConfigInput) {
  const client = getRayfinClient();
  return client.data.EtlJobConfigIntake.create({
    jobName: params.job_name,
    layerName: params.layer_name,
    sourceObject: params.source_object,
    targetObject: params.target_object,
    dataLoad: params.data_load,
    watermarkColumn: params.watermark_column,
    processed: false,
    submittedAt: new Date(),
  });
}
