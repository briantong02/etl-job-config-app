import { type ChangeEvent, type FormEvent, useState } from 'react';

import { createJobConfig, type EtlJobConfigIntake } from '@/api/jobConfig';
import { useAuth } from '@/hooks/AuthContext';

// ---------------------------------------------------------------------------
// Field components defined at module scope — never inside render — so React
// doesn't remount them on each keystroke.
// ---------------------------------------------------------------------------

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function TextField({
  id,
  label,
  value,
  placeholder,
  error,
  disabled,
  onChange,
}: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        className={[
          'rounded-xl border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-400 transition-colors',
          error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white',
        ].join(' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  error?: string;
  disabled?: boolean;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

function SelectField({
  id,
  label,
  value,
  options,
  error,
  disabled,
  onChange,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className={[
          'rounded-xl border px-3 py-2 text-sm text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-400 transition-colors',
          error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white',
        ].join(' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

const LAYER_OPTIONS = [
  { value: 'staging', label: 'Staging' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
];

const DATA_LOAD_OPTIONS = [
  { value: 'full', label: 'Full' },
  { value: 'incremental', label: 'Incremental' },
];

type FormFields = {
  job_name: string;
  layer_name: string;
  source_object: string;
  target_object: string;
  data_load: string;
  watermark_column: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

const EMPTY_FORM: FormFields = {
  job_name: '',
  layer_name: '',
  source_object: '',
  target_object: '',
  data_load: '',
  watermark_column: '',
};

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};
  if (!fields.job_name.trim()) errors.job_name = 'Job name is required.';
  if (!fields.layer_name) errors.layer_name = 'Layer is required.';
  if (!fields.source_object.trim())
    errors.source_object = 'Source object is required.';
  if (!fields.target_object.trim())
    errors.target_object = 'Target object is required.';
  if (!fields.data_load) errors.data_load = 'Data load type is required.';
  if (!fields.watermark_column.trim())
    errors.watermark_column = 'Watermark column is required.';
  return errors;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function HomePage() {
  const { user, signOut } = useAuth();

  const [fields, setFields] = useState<FormFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<EtlJobConfigIntake | null>(null);

  function set<K extends keyof FormFields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (submitError) setSubmitError(null);
    if (successResult) setSuccessResult(null);
  }

  function handleReset() {
    setFields(EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
    setSuccessResult(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccessResult(null);

    try {
      const record = await createJobConfig({
        job_name: fields.job_name.trim(),
        layer_name: fields.layer_name,
        source_object: fields.source_object.trim(),
        target_object: fields.target_object.trim(),
        data_load: fields.data_load,
        watermark_column: fields.watermark_column.trim(),
      });
      setSuccessResult(record);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-indigo-100/40 blur-3xl" />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-6 py-4">
        {user && (
          <span className="text-sm text-gray-500">
            Signed in as{' '}
            <span className="font-medium text-gray-700">{user.name}</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="ml-auto text-xs text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="Sign out"
        >
          Sign out
        </button>
      </div>

      {/* Card */}
      <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-4">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              ETL Job Configuration
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Submit a new ETL job config — triggers{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-700">
                pl_insert_etl_job_config
              </code>{' '}
              pipeline.
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} noValidate>
            {/* Two-column responsive grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                id="job_name"
                label="Job Name"
                value={fields.job_name}
                placeholder="nb_sl_rms_account"
                error={errors.job_name}
                disabled={submitting}
                onChange={(e) => set('job_name', e.target.value)}
              />

              <SelectField
                id="layer_name"
                label="Layer"
                value={fields.layer_name}
                options={LAYER_OPTIONS}
                error={errors.layer_name}
                disabled={submitting}
                onChange={(e) => set('layer_name', e.target.value)}
              />

              <TextField
                id="source_object"
                label="Source Object"
                value={fields.source_object}
                placeholder="rms.account"
                error={errors.source_object}
                disabled={submitting}
                onChange={(e) => set('source_object', e.target.value)}
              />

              <TextField
                id="target_object"
                label="Target Object"
                value={fields.target_object}
                placeholder="silver_account"
                error={errors.target_object}
                disabled={submitting}
                onChange={(e) => set('target_object', e.target.value)}
              />

              <SelectField
                id="data_load"
                label="Data Load"
                value={fields.data_load}
                options={DATA_LOAD_OPTIONS}
                error={errors.data_load}
                disabled={submitting}
                onChange={(e) => set('data_load', e.target.value)}
              />

              <TextField
                id="watermark_column"
                label="Watermark Column"
                value={fields.watermark_column}
                placeholder="SinkModifiedOn"
                error={errors.watermark_column}
                disabled={submitting}
                onChange={(e) => set('watermark_column', e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-600/25 transition-all hover:shadow-lg hover:shadow-blue-600/30 hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  'Submit Job Config'
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={submitting}
                className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Error */}
          {submitError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">Error</p>
              <p className="mt-1 text-sm text-red-600">{submitError}</p>
            </div>
          )}

          {/* Success */}
          {successResult && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-700">Job config saved</p>
              {successResult.id && (
                <p className="mt-1 break-all text-xs text-green-600">
                  Record ID: {successResult.id}
                </p>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {(
                  [
                    ['Job Name', successResult.jobName],
                    ['Layer', successResult.layerName],
                    ['Source Object', successResult.sourceObject],
                    ['Target Object', successResult.targetObject],
                    ['Data Load', successResult.dataLoad],
                    ['Watermark Column', successResult.watermarkColumn],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="font-medium text-gray-600">{label}</dt>
                    <dd className="text-gray-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
