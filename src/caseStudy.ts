import type { TcoOption } from './logic';

/** All quote and risk figures below are invented for this portfolio demonstration. */
export const caseStudy = {
  title: 'Wind turbine control module sourcing',
  item: 'Industrial control modules for a planned wind-farm service campaign',
  businessProblem: 'A sourcing team needs 500 control modules for a scheduled maintenance campaign. The lowest unit quote may not be the lowest expected cost once freight, defects, and schedule exposure are considered.',
  quantity: 500,
  baselineSupplierId: 'sup-001',
  options: [
    { supplierId: 'sup-001', label: 'Northstar Industrial', inputs: { quantity: 500, unitPrice: 186, freight: 320, defectRate: 0.022, delayProbability: 0.18, expectedDelayDays: 6, costPerDelayDay: 3500 } },
    { supplierId: 'sup-018', label: 'Kinetic Drive Solutions', inputs: { quantity: 500, unitPrice: 173, freight: 335, defectRate: 0.016, delayProbability: 0.15, expectedDelayDays: 4.5, costPerDelayDay: 3500 } },
    { supplierId: 'sup-011', label: 'Redwood Circuit Supply', inputs: { quantity: 500, unitPrice: 164, freight: 710, defectRate: 0.035, delayProbability: 0.30, expectedDelayDays: 6, costPerDelayDay: 3500 } },
  ] satisfies TcoOption[],
  limitations: 'Scenario assumptions are synthetic and are not supplier quotes or measured performance. Validate with current quotes, inspection records, delivery history, and finance-approved delay costs before operational use.',
};
