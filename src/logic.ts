import type { Purchase, Supplier } from './data';

export interface Weights { price: number; shipping: number; leadTime: number; quality: number; reliability: number }
export const defaultWeights: Weights = { price: 35, shipping: 15, leadTime: 20, quality: 15, reliability: 15 };
export interface RankedSupplier { supplier: Supplier; score: number }

/** TCO inputs use decimal rates (0.02 = 2%). Delay cost is probability-weighted. */
export interface TcoInputs {
  quantity: number; unitPrice: number; freight: number; defectRate: number;
  delayProbability: number; expectedDelayDays: number; costPerDelayDay: number;
}
export interface TcoResult extends TcoInputs {
  purchaseCost: number; defectCost: number; expectedDelayCost: number;
  totalCost: number; costPerUnit: number;
}
const cents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export function calculateTco(input: TcoInputs): TcoResult {
  const { quantity, unitPrice, freight, defectRate, delayProbability, expectedDelayDays, costPerDelayDay } = input;
  if (!Number.isFinite(quantity) || quantity <= 0) throw new RangeError('quantity must be greater than zero');
  for (const [name, value] of Object.entries({ unitPrice, freight, expectedDelayDays, costPerDelayDay }))
    if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be a finite non-negative number`);
  for (const [name, value] of Object.entries({ defectRate, delayProbability }))
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError(`${name} must be between 0 and 1`);
  const purchaseCost = quantity * unitPrice + freight;
  // Each defective unit is assumed to consume one additional unit's purchase price.
  const defectCost = quantity * defectRate * unitPrice;
  const expectedDelayCost = delayProbability * expectedDelayDays * costPerDelayDay;
  const totalCost = cents(purchaseCost + defectCost + expectedDelayCost);
  return { ...input, purchaseCost: cents(purchaseCost), defectCost: cents(defectCost), expectedDelayCost: cents(expectedDelayCost), totalCost, costPerUnit: cents(totalCost / quantity) };
}

export interface TcoOption { supplierId: string; label: string; inputs: TcoInputs }
export function rankTcoOptions(options: TcoOption[]): Array<TcoOption & { result: TcoResult; rank: number }> {
  return options.map((option, index) => ({ ...option, result: calculateTco(option.inputs), index }))
    .sort((a, b) => a.result.totalCost - b.result.totalCost || a.index - b.index)
    .map(({ index: _index, ...row }, i) => ({ ...row, rank: i + 1 }));
}

export function weightedScore(s: Supplier, all: Supplier[], weights: Weights = defaultWeights): number {
  const group = all.filter(x => x.category === s.category);
  if (!group.length) return 0;
  const extent = (fn: (x: Supplier) => number) => { const xs = group.map(fn); return { min: Math.min(...xs), max: Math.max(...xs) }; };
  const lower = (v: number, min: number, max: number) => max === min ? 100 : ((max - v) / (max - min)) * 100;
  const higher = (v: number, min: number, max: number) => max === min ? 100 : ((v - min) / (max - min)) * 100;
  const p = extent(x => x.price), ship = extent(x => x.shipping), lead = extent(x => x.leadDays), qual = extent(x => x.quality), rel = extent(x => x.reliability);
  const total = Object.values(weights).reduce((a,b) => a+b, 0);
  if (total <= 0) return 0;
  const score = lower(s.price,p.min,p.max)*weights.price + lower(s.shipping,ship.min,ship.max)*weights.shipping + lower(s.leadDays,lead.min,lead.max)*weights.leadTime + higher(s.quality,qual.min,qual.max)*weights.quality + higher(s.reliability,rel.min,rel.max)*weights.reliability;
  return Math.round(score / total * 10) / 10;
}
export function rankSuppliers(all: Supplier[], weights: Weights = defaultWeights): RankedSupplier[] {
  return all.map(s => ({ supplier:s, score:weightedScore(s, all, weights) })).sort((a,b) => b.score-a.score);
}
export function getSpend(purchases: Purchase[]): number { return Math.round(purchases.reduce((a,p)=>a+p.quantity*p.unitPrice+p.shipping,0)*100)/100; }
export function getOnTimeRate(purchases: Purchase[]): number { const known=purchases.filter(p=>p.onTime!==undefined);return known.length?Math.round(known.filter(p=>p.onTime).length/known.length*1000)/10:0; }
export function getAverageLeadDays(purchases: Purchase[], allSuppliers: Supplier[]): number { if(!purchases.length)return 0;const map=new Map(allSuppliers.map(s=>[s.id,s.leadDays]));return Math.round(purchases.reduce((a,p)=>a+(map.get(p.supplierId)??0),0)/purchases.length*10)/10; }
export function bestSupplierForOrder(order: Pick<Purchase,'quantity'|'shipping'|'unitPrice'>, pool: Supplier[]): Supplier | undefined {
  const best=[...pool].sort((a,b)=>(a.price+a.shipping/order.quantity)-(b.price+b.shipping/order.quantity))[0];
  return best&&best.price+best.shipping/order.quantity<=order.unitPrice+order.shipping/order.quantity?best:undefined;
}
export function estimateSavings(purchases: Purchase[], allSuppliers: Supplier[], allocation: Record<string,number> = {}): {currentSpend:number; projectedSpend:number; savings:number; onTimeRate:number; avgLeadDays:number;} {
  const byCategory = new Map<string, Purchase[]>();
  for(const p of purchases)byCategory.set(p.category,[...(byCategory.get(p.category)??[]),p]);
  // Allocation controls the share of category volume moved to its lowest landed-cost supplier.
  const currentSpend=getSpend(purchases);
  let projectedSpend=0;
  for(const [category, orders] of byCategory){const pool=allSuppliers.filter(s=>s.category===category);const pct=Math.max(0,Math.min(100,allocation[category]??50))/100;
    for(const o of orders){const current=o.quantity*o.unitPrice+o.shipping;const best=bestSupplierForOrder(o,pool);if(!best){projectedSpend+=current;continue;}const optimized=o.quantity*best.price+best.shipping;projectedSpend+=current*(1-pct)+optimized*pct;}}
  const savings=Math.round((currentSpend-projectedSpend)*100)/100;
  const onTimeRate=purchases.length?Math.round(purchases.reduce((a,p)=>{const currentStatus=p.onTime===undefined?(allSuppliers.find(s=>s.id===p.supplierId)?.reliability??100)/100:(p.onTime?1:0);const best=bestSupplierForOrder(p,allSuppliers.filter(s=>s.category===p.category));const pct=best?Math.max(0,Math.min(100,allocation[p.category]??50))/100:0;return a+currentStatus*(1-pct)+(best?best.reliability/100:0)*pct;},0)/purchases.length*1000)/10:0;
  const avgLeadDays=purchases.length?Math.round(purchases.reduce((a,p)=>{const best=bestSupplierForOrder(p,allSuppliers.filter(s=>s.category===p.category));const pct=best?Math.max(0,Math.min(100,allocation[p.category]??50))/100:0;const current=allSuppliers.find(s=>s.id===p.supplierId)?.leadDays??0;return a+current*(1-pct)+(best?.leadDays??current)*pct;},0)/purchases.length*10)/10:0;
  return {currentSpend,projectedSpend:Math.round(projectedSpend*100)/100,savings,onTimeRate,avgLeadDays};
}

export function scenarioReportMetrics(
  estimate: ReturnType<typeof estimateSavings>,
  baseline: { onTimeRate: number; avgLeadDays: number },
) {
  return {
    currentSpend: estimate.currentSpend,
    projectedSpend: estimate.projectedSpend,
    savings: estimate.savings,
    baselineOnTimeRate: baseline.onTimeRate,
    projectedOnTimeRate: estimate.onTimeRate,
    baselineAvgLeadDays: baseline.avgLeadDays,
    projectedAvgLeadDays: estimate.avgLeadDays,
  };
}

export interface ImportResult<T> { rows:T[]; errors:string[]; skipped:number }
const text=(row:Record<string,unknown>,key:string)=>{const value=row[key];return value instanceof Date?value.toISOString().slice(0,10):String(value??'').trim();};
const num=(row:Record<string,unknown>,key:string)=>Number(String(row[key]??'').replace(/[$,\s]/g,''));
export function importSuppliers(input: Record<string, unknown>[], existingSuppliers: Supplier[] = []): ImportResult<Supplier> {
  const rows:Supplier[]=[];const errors:string[]=[];let skipped=0;const usedIds=new Set(existingSuppliers.map(s=>s.id));
  for(let i=0;i<input.length;i++){const r=input[i];const line=i+2;const name=text(r,'name');const category=text(r,'category');const suppliedId=text(r,'id');let id=suppliedId||`import-${i+1}`;if(!suppliedId){let suffix=2;const base=id;while(usedIds.has(id))id=`${base}-${suffix++}`;}
    const price=num(r,'price'),shipping=num(r,'shipping'),leadDays=num(r,'leaddays'),quality=num(r,'quality'),reliability=num(r,'reliability');
    const problems:string[]=[];if(!name)problems.push('name is required');if(suppliedId&&usedIds.has(id))problems.push('id must be unique');if(!category)problems.push('category is required');if(!Number.isFinite(price)||price<=0)problems.push('price must be a positive number');if(!Number.isFinite(shipping)||shipping<0)problems.push('shipping must be zero or greater');if(!Number.isFinite(leadDays)||leadDays<=0)problems.push('leadDays must be a positive number');if(!Number.isFinite(quality)||quality<0||quality>100)problems.push('quality must be 0–100');if(!Number.isFinite(reliability)||reliability<0||reliability>100)problems.push('reliability must be 0–100');
    if(problems.length){skipped++;errors.push(`Row ${line}: ${problems.join(', ')}.`);continue;}
    rows.push({id,name,code:text(r,'code')||name.slice(0,3).toUpperCase(),category,location:text(r,'location')||'Unspecified',price,shipping,leadDays,quality,reliability,certification:text(r,'certification')||'Not provided',status:text(r,'status').toLowerCase()==='preferred'?'Preferred':'Approved'});usedIds.add(id);}
  return {rows,errors,skipped};
}
export function importPurchases(input: Record<string, unknown>[], existingSuppliers: Supplier[], existingPurchases: Purchase[] = []): ImportResult<Purchase> {
  const rows:Purchase[]=[];const errors:string[]=[];let skipped=0;const ids=new Set(existingSuppliers.map(s=>s.id));const usedOrderIds=new Set(existingPurchases.map(p=>p.id));
  for(let i=0;i<input.length;i++){const r=input[i];const line=i+2;const supplierId=text(r,'supplierid');const supplier=existingSuppliers.find(s=>s.id===supplierId);const dateValue=text(r,'date');const excelDate=dateValue?new Date(dateValue):null;const dateValid=!!dateValue&&!Number.isNaN(Date.parse(dateValue))&&(!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)||excelDate?.toISOString().slice(0,10)===dateValue);const quantity=num(r,'quantity'),unitPrice=num(r,'unitprice'),shipping=num(r,'shipping');const qualityScore=text(r,'qualityscore')?num(r,'qualityscore'):(supplier?.quality??95);const timeValue=text(r,'ontime').toLowerCase();const validTimeValues=['true','yes','1','on time','false','no','0','delayed','late'];const problems:string[]=[];
    if(!dateValid)problems.push('date must be a valid date');if(!supplierId||!ids.has(supplierId))problems.push('supplierId must match an imported or existing supplier');if(supplier&&text(r,'category')&&supplier.category!==text(r,'category'))problems.push(`category must match the supplier category (${supplier.category})`);if(!text(r,'category'))problems.push('category is required');if(!text(r,'item'))problems.push('item is required');if(!Number.isFinite(quantity)||quantity<=0)problems.push('quantity must be a positive number');if(!Number.isFinite(unitPrice)||unitPrice<=0)problems.push('unitPrice must be a positive number');if(!Number.isFinite(shipping)||shipping<0)problems.push('shipping must be zero or greater');if(!Number.isFinite(qualityScore)||qualityScore<0||qualityScore>100)problems.push('qualityScore must be 0–100');if(timeValue&&!validTimeValues.includes(timeValue))problems.push('onTime must be true/yes/1 or false/no/0 when provided');
    if(problems.length){skipped++;errors.push(`Row ${line}: ${problems.join(', ')}.`);continue;}
    const suppliedId=text(r,'id');let id=suppliedId||`imported-${i+1}`;if(suppliedId&&usedOrderIds.has(id)){skipped++;errors.push(`Row ${line}: purchase id must be unique.`);continue;}if(!suppliedId){let suffix=2;const base=id;while(usedOrderIds.has(id))id=`${base}-${suffix++}`;}
    const onTime=validTimeValues.includes(timeValue)?['true','yes','1','on time'].includes(timeValue):undefined;rows.push({id,date:excelDate!.toISOString().slice(0,10),supplierId,category:text(r,'category'),item:text(r,'item'),quantity,unitPrice,shipping,region:text(r,'region')||'Unspecified',onTime,qualityScore});usedOrderIds.add(id);}
  return {rows,errors,skipped};
}
