import { describe, it, expect } from 'vitest';
import { validateSettings } from '../validation.js';

describe('validateSettings', () => {
  it('accepts minimal settings', () => {
    const res = validateSettings({});
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('accepts valid approvalMode values', () => {
    expect(validateSettings({ approvalMode: 'default' }).valid).toBe(true);
    expect(validateSettings({ approvalMode: 'auto_edit' }).valid).toBe(true);
    expect(validateSettings({ approvalMode: 'yolo' }).valid).toBe(true);
  });

  it('rejects invalid approvalMode', () => {
    const res = validateSettings({ approvalMode: 'invalid' });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => /approvalMode/i.test(e))).toBe(true);
  });

  it('warns when both yolo and approvalMode are set', () => {
    const res = validateSettings({ yolo: true, approvalMode: 'default' });
    expect(res.valid).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.warnings.some((w) => /yolo/i.test(w))).toBe(true);
  });

  it('accepts sandbox option', () => {
    const res = validateSettings({ sandbox: true });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('accepts includeDirectories with valid paths', () => {
    const res = validateSettings({ includeDirectories: ['./src', '../shared'] });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejects includeDirectories with empty strings', () => {
    const res = validateSettings({ includeDirectories: ['valid', ''] });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => /includeDirectories/i.test(e))).toBe(true);
  });

  it('accepts allowedTools', () => {
    const res = validateSettings({ allowedTools: ['run_shell_command', 'list_directory'] });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('accepts resume as boolean', () => {
    const res = validateSettings({ resume: true });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('accepts resume as string', () => {
    const res = validateSettings({ resume: 'session-id-123' });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('accepts cwd option', () => {
    const res = validateSettings({ cwd: '/path/to/project' });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('accepts env option', () => {
    const res = validateSettings({ env: { MY_VAR: 'value' } });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('accepts verbose option', () => {
    const res = validateSettings({ verbose: true });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('accepts logger as false', () => {
    const res = validateSettings({ logger: false });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejects unknown properties in strict mode', () => {
    const res = validateSettings({ unknownProp: 'value' });
    expect(res.valid).toBe(false);
  });
});
