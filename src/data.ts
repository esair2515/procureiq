export interface Supplier {
  id: string; name: string; code: string; category: string; location: string;
  price: number; shipping: number; leadDays: number; quality: number;
  reliability: number; certification: string; status: 'Preferred' | 'Approved' | 'Under review';
}
export interface Purchase {
  id: string; date: string; supplierId: string; category: string; item: string;
  quantity: number; unitPrice: number; shipping: number; region: string; onTime?: boolean; qualityScore: number;
}
export const suppliers: Supplier[] = [
  { id: 'sup-001', name: 'Northstar Industrial', code: 'NSI', category: 'Electrical', location: 'Chicago, IL', price: 186, shipping: 320, leadDays: 12, quality: 96, reliability: 97, certification: 'ISO 9001', status: 'Preferred' },
  { id: 'sup-002', name: 'Vestas Components Co.', code: 'VCC', category: 'Renewable energy', location: 'Denver, CO', price: 214, shipping: 480, leadDays: 18, quality: 94, reliability: 95, certification: 'ISO 9001 · ISO 14001', status: 'Preferred' },
  { id: 'sup-003', name: 'Alloy & Motion Group', code: 'AMG', category: 'Mechanical', location: 'Pittsburgh, PA', price: 142, shipping: 275, leadDays: 16, quality: 91, reliability: 93, certification: 'ISO 9001', status: 'Approved' },
  { id: 'sup-004', name: 'Pacific Ridge Supply', code: 'PRS', category: 'Electrical', location: 'Portland, OR', price: 178, shipping: 625, leadDays: 9, quality: 88, reliability: 89, certification: 'ISO 9001', status: 'Approved' },
  { id: 'sup-005', name: 'HelioCore Technologies', code: 'HCT', category: 'Renewable energy', location: 'Austin, TX', price: 236, shipping: 390, leadDays: 14, quality: 98, reliability: 96, certification: 'ISO 9001 · IEC 61215', status: 'Preferred' },
  { id: 'sup-006', name: 'Great Lakes Fasteners', code: 'GLF', category: 'Fasteners', location: 'Detroit, MI', price: 38, shipping: 185, leadDays: 7, quality: 93, reliability: 98, certification: 'ISO 9001', status: 'Preferred' },
  { id: 'sup-007', name: 'Meridian Pump & Valve', code: 'MPV', category: 'Mechanical', location: 'Houston, TX', price: 318, shipping: 440, leadDays: 22, quality: 95, reliability: 91, certification: 'ISO 9001 · API 6D', status: 'Approved' },
  { id: 'sup-008', name: 'Apex Grid Systems', code: 'AGS', category: 'Electrical', location: 'Charlotte, NC', price: 205, shipping: 295, leadDays: 11, quality: 92, reliability: 94, certification: 'ISO 9001 · UL Listed', status: 'Approved' },
  { id: 'sup-009', name: 'Evergreen Wind Parts', code: 'EWP', category: 'Renewable energy', location: 'Minneapolis, MN', price: 198, shipping: 520, leadDays: 20, quality: 90, reliability: 88, certification: 'ISO 9001 · ISO 14001', status: 'Under review' },
  { id: 'sup-010', name: 'Titan Bearing Works', code: 'TBW', category: 'Mechanical', location: 'Cleveland, OH', price: 86, shipping: 245, leadDays: 10, quality: 97, reliability: 96, certification: 'ISO 9001 · AS9100', status: 'Preferred' },
  { id: 'sup-011', name: 'Redwood Circuit Supply', code: 'RCS', category: 'Electrical', location: 'San Jose, CA', price: 164, shipping: 710, leadDays: 15, quality: 95, reliability: 92, certification: 'ISO 9001 · IPC-A-610', status: 'Approved' },
  { id: 'sup-012', name: 'Summit Solar Materials', code: 'SSM', category: 'Renewable energy', location: 'Phoenix, AZ', price: 225, shipping: 350, leadDays: 13, quality: 93, reliability: 94, certification: 'ISO 9001 · IEC 61215', status: 'Approved' },
  { id: 'sup-013', name: 'Ironclad Steel & Alloy', code: 'ISA', category: 'Mechanical', location: 'Birmingham, AL', price: 112, shipping: 310, leadDays: 19, quality: 89, reliability: 90, certification: 'ISO 9001 · ASTM', status: 'Under review' },
  { id: 'sup-014', name: 'Blue River Pneumatics', code: 'BRP', category: 'Mechanical', location: 'Kansas City, MO', price: 156, shipping: 210, leadDays: 8, quality: 94, reliability: 96, certification: 'ISO 9001', status: 'Preferred' },
  { id: 'sup-015', name: 'Windward Energy Parts', code: 'WWP', category: 'Renewable energy', location: 'Boston, MA', price: 207, shipping: 560, leadDays: 16, quality: 92, reliability: 93, certification: 'ISO 9001 · ISO 14001', status: 'Approved' },
  { id: 'sup-016', name: 'Continental Bolt & Nut', code: 'CBN', category: 'Fasteners', location: 'Milwaukee, WI', price: 34, shipping: 260, leadDays: 12, quality: 90, reliability: 92, certification: 'ISO 9001', status: 'Approved' },
  { id: 'sup-017', name: 'EcoCell Storage Systems', code: 'ESS', category: 'Renewable energy', location: 'Salt Lake City, UT', price: 284, shipping: 445, leadDays: 24, quality: 96, reliability: 89, certification: 'ISO 9001 · UN 38.3', status: 'Approved' },
  { id: 'sup-018', name: 'Kinetic Drive Solutions', code: 'KDS', category: 'Electrical', location: 'Nashville, TN', price: 173, shipping: 335, leadDays: 10, quality: 93, reliability: 95, certification: 'ISO 9001 · UL Listed', status: 'Preferred' },
];

const items: Record<string, { names: string[]; base: number }> = {
  Electrical: { names: ['Industrial circuit breaker', 'Power distribution module', 'Copper busbar assembly', 'Grid protection relay', 'Three-phase contactor', 'Control panel enclosure'], base: 183 },
  Mechanical: { names: ['Tapered roller bearing', 'Stainless steel impeller', 'Hydraulic valve assembly', 'Precision coupling', 'Pneumatic actuator', 'Industrial shaft assembly'], base: 157 },
  'Renewable energy': { names: ['Solar inverter module', 'Wind turbine pitch bearing', 'Photovoltaic panel assembly', 'Battery storage cell', 'Wind power converter', 'Solar mounting rail'], base: 231 },
  Fasteners: { names: ['Grade 8 hex bolt', 'Stainless steel flange nut', 'Structural anchor assembly', 'Precision shoulder screw', 'High-tensile stud bolt', 'Lock washer assortment'], base: 42 },
};
const supplierChoices: Record<string, string[]> = { Electrical: ['sup-001','sup-004','sup-008','sup-011','sup-018'], Mechanical: ['sup-003','sup-007','sup-010','sup-013','sup-014'], 'Renewable energy': ['sup-002','sup-005','sup-009','sup-012','sup-015','sup-017'], Fasteners: ['sup-006','sup-016'] };
const regions = ['Midwest', 'Northeast', 'Southeast', 'Southwest', 'West'];
function makePurchases(): Purchase[] {
  const output: Purchase[] = [];
  for (let month = 0; month < 12; month++) for (let ci = 0; ci < 4; ci++) for (let j = 0; j < 3; j++) {
    const category = ['Electrical', 'Mechanical', 'Renewable energy', 'Fasteners'][ci];
    const group = items[category]; const k = (month * 3 + j + ci * 2) % group.names.length;
    const sid = supplierChoices[category][(month * 2 + j + ci) % supplierChoices[category].length];
    const s = suppliers.find(x => x.id === sid)!;
    const quantity = 20 + (month * 17 + ci * 31 + j * 43) % 180;
    const variation = (((month * 13 + ci * 7 + j * 11) % 17) - 8) / 100;
    const year = month < 2 ? 2025 : 2026;
    const monthNumber = month < 2 ? month + 11 : month - 1;
    const mm = String(monthNumber).padStart(2, '0');
    output.push({ id: `PO-${String(2601 + output.length).padStart(5,'0')}`, date: `${year}-${mm}-${String(5 + (j * 8) % 22).padStart(2,'0')}`, supplierId: sid, category, item: group.names[k], quantity, unitPrice: Math.round(group.base * (0.88 + variation + s.price / 1800) * 100) / 100, shipping: s.shipping, region: regions[(month + ci + j) % regions.length], onTime: (month * 3 + j + ci) % 12 !== 2 && s.reliability >= 91, qualityScore: Math.min(100, Math.max(72, s.quality + ((month + j) % 7) - 3)) });
  }
  return output;
}
export const demoPurchases = makePurchases();

export const categoryColors: Record<string, string> = { Electrical: '#6679e8', Mechanical: '#37b79e', 'Renewable energy': '#e4a84a', Fasteners: '#aa8bdc' };
