import { describe, it, expect, beforeEach } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('should return healthy status object', () => {
    const res = controller.check();
    expect(res.status).toBe('ok');
    expect(res.service).toBe('turbograb-api');
    expect(typeof res.uptimeSec).toBe('number');
    expect(res.version).toBe('1.0.0');
  });
});
