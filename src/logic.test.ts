import { describe, expect, it } from 'vitest';
import { demoPurchases, suppliers } from './data';
import { bestSupplierForOrder, calculateTco, defaultWeights, estimateSavings, getAverageLeadDays, getOnTimeRate, getSpend, importPurchases, importSuppliers, rankSuppliers, rankTcoOptions, weightedScore } from './logic';
import { caseStudy } from './caseStudy';

describe('procurement calculations', () => {
  it('calculates auditable purchase, defect and expected delay components', () => {
    expect(calculateTco({ quantity: 100, unitPrice: 20, freight: 50, defectRate: .02, delayProbability: .5, expectedDelayDays: 4, costPerDelayDay: 1000 })).toEqual({ quantity:100,unitPrice:20,freight:50,defectRate:.02,delayProbability:.5,expectedDelayDays:4,costPerDelayDay:1000,purchaseCost:2050,defectCost:40,expectedDelayCost:2000,totalCost:4090,costPerUnit:40.9 });
  });
  it('handles zero risk costs and rejects invalid quantities, rates and costs', () => {
    const inputs = { quantity:1,unitPrice:0,freight:0,defectRate:0,delayProbability:0,expectedDelayDays:0,costPerDelayDay:0 };
    expect(calculateTco(inputs).totalCost).toBe(0);
    for (const quantity of [0, -1, Number.NaN, Infinity]) expect(() => calculateTco({...inputs,quantity})).toThrow(RangeError);
    for (const defectRate of [-.01,1.01,Number.NaN]) expect(() => calculateTco({...inputs,defectRate})).toThrow(RangeError);
    expect(() => calculateTco({...inputs,freight:-1})).toThrow(RangeError);
    expect(() => calculateTco({...inputs,delayProbability:1.1})).toThrow(RangeError);
  });
  it('ranks case-study options from calculated TCO and resolves ties in input order', () => {
    const rows=rankTcoOptions(caseStudy.options);
    expect(rows[0].label).toBe('Kinetic Drive Solutions');
    expect(rows[0].result.totalCost).toBe(90581.5);
    expect(rows[1].result.totalCost).toBe(91880);
    expect(rows[2].result.totalCost).toBe(99146);
    const tie={...caseStudy.options[0],inputs:{...caseStudy.options[0].inputs,unitPrice:1,freight:0,defectRate:0,delayProbability:0}};
    expect(rankTcoOptions([tie,{...tie,label:'Second'}]).map(x=>x.label)).toEqual([tie.label,'Second']);
  });
  it('calculates purchase spend and on-time rate deterministically', () => {
    const rows = [{...demoPurchases[0],quantity:10,unitPrice:5,shipping:12,onTime:true},{...demoPurchases[1],quantity:2,unitPrice:4,shipping:3,onTime:false}];
    expect(getSpend(rows)).toBe(73); expect(getOnTimeRate(rows)).toBe(50);
  });
  it('uses supplier lead times and returns zero for empty purchase records', () => {
    expect(getAverageLeadDays([demoPurchases[0]],suppliers)).toBe(suppliers.find(s=>s.id===demoPurchases[0].supplierId)!.leadDays);
    expect(getSpend([])).toBe(0);expect(getOnTimeRate([])).toBe(0);expect(getAverageLeadDays([],suppliers)).toBe(0);
  });
  it('scores identical suppliers consistently and ranks from highest to lowest', () => {
    expect(weightedScore(suppliers[0],suppliers,defaultWeights)).toBe(weightedScore(suppliers[0],suppliers,defaultWeights));
    const ranked=rankSuppliers(suppliers);expect(ranked).toHaveLength(suppliers.length);expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked.every(r=>r.score>=0&&r.score<=100)).toBe(true);
  });
  it('chooses a cheaper per-order landed cost and preserves orders that are already cheaper',()=>{
    const supplier=suppliers.find(s=>s.id==='sup-001')!;
    expect(bestSupplierForOrder({quantity:100,unitPrice:500,shipping:500},[supplier])?.id).toBe(supplier.id);
    expect(bestSupplierForOrder({quantity:100,unitPrice:100,shipping:0},[supplier])).toBeUndefined();
  });
  it('simulates repeatable sourcing allocations and bounds the on-time rate', () => {
    const a=estimateSavings(demoPurchases,suppliers);expect(estimateSavings(demoPurchases,suppliers)).toEqual(a);expect(a.currentSpend).toBe(getSpend(demoPurchases));expect(a.projectedSpend).toBeGreaterThan(0);expect(a.onTimeRate).toBeGreaterThanOrEqual(0);expect(a.onTimeRate).toBeLessThanOrEqual(100);
    expect(estimateSavings(demoPurchases,suppliers,{Electrical:0}).projectedSpend).toBeGreaterThan(a.projectedSpend);
  });
  it('never models savings when no category allocation is shifted',()=>{
    const categories=Object.fromEntries(['Electrical','Mechanical','Renewable energy','Fasteners'].map(category=>[category,0]));const estimate=estimateSavings(demoPurchases,suppliers,categories);
    expect(estimate.projectedSpend).toBe(estimate.currentSpend);expect(estimate.savings).toBe(0);
  });
  it('never moves an order to a supplier with a higher landed cost',()=>{
    const categories=Object.fromEntries(['Electrical','Mechanical','Renewable energy','Fasteners'].map(category=>[category,100]));const estimate=estimateSavings(demoPurchases,suppliers,categories);
    expect(estimate.projectedSpend).toBeLessThanOrEqual(estimate.currentSpend);expect(estimate.savings).toBeGreaterThanOrEqual(0);
  });
});

describe('data import validation',()=>{
  it('normalizes valid suppliers and reports invalid fields',()=>{
    const existing=suppliers[0];const result=importSuppliers([{id:existing.id,name:'Duplicate',category:'Electrical',price:100,shipping:20,leaddays:8,quality:95,reliability:92},{name:'New Vendor',category:'Mechanical',price:'$25.50',shipping:'20',leaddays:'8',quality:'95',reliability:'92'},{name:'Bad',category:'',price:'-1',shipping:'x',leaddays:'0',quality:'120',reliability:'101'}],[existing]);
    expect(result.rows).toHaveLength(1);expect(result.rows[0].price).toBe(25.5);expect(result.skipped).toBe(2);expect(result.errors.length).toBeGreaterThan(0);
    const duplicateAutomaticIds=importSuppliers([{name:'First',category:'Mechanical',price:10,shipping:0,leaddays:3,quality:90,reliability:90},{name:'Second',category:'Mechanical',price:11,shipping:0,leaddays:4,quality:91,reliability:91}],result.rows);expect(new Set(duplicateAutomaticIds.rows.map(s=>s.id)).size).toBe(duplicateAutomaticIds.rows.length);
  });
  it('rejects purchase rows without a matching supplier',()=>{
    const result=importPurchases([{date:'2026-01-01',supplierid:'unknown',category:'Electrical',item:'Relay',quantity:10,unitprice:25,shipping:0}],suppliers);
    expect(result.rows).toHaveLength(0);expect(result.errors[0]).toContain('supplierId');
  });
  it('uses the linked supplier quality score and leaves missing delivery outcomes unclassified',()=>{
    const supplier=suppliers[0];const result=importPurchases([{date:'2026-09-15',supplierid:supplier.id,category:supplier.category,item:'Industrial control module',quantity:10,unitprice:25,shipping:0}],suppliers);
    expect(result.rows[0].qualityScore).toBe(supplier.quality);expect(result.rows[0].onTime).toBeUndefined();expect(getOnTimeRate(result.rows)).toBe(0);
  });
});

describe('synthetic demo data dates',()=>{it('covers the trailing 12 months through the current demo period',()=>{expect(demoPurchases.every(p=>p.date>='2025-11-01'&&p.date<='2026-10-31')).toBe(true);});});
