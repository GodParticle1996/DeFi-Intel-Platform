export const PROTOCOLS = [
  { name: 'Aave V3', category: 'Lending', risk: 'Low', description: 'Lending and borrowing protocol with deep liquidity and multiple audits.', yield: '1-8% APY', audits: 'OpenZeppelin, Trail of Bits' },
  { name: 'Compound V3', category: 'Lending', risk: 'Low', description: 'Lending markets with simplified collateral model and governance.', yield: '1-7% APY', audits: 'Multiple audits' },
  { name: 'Morpho', category: 'Lending', risk: 'Low-Medium', description: 'Peer-to-peer optimized lending over existing money markets.', yield: '2-9% APY', audits: 'Cantina, Spearbit' },
  { name: 'Uniswap V3', category: 'DEX', risk: 'Low', description: 'Concentrated liquidity AMM for token swaps.', yield: 'Fees-based', audits: 'Multiple audits' },
  { name: 'MakerDAO', category: 'Stablecoin', risk: 'Low-Medium', description: 'Collateralized stablecoin protocol powering DAI.', yield: 'Savings rate variable', audits: 'Long-running audited codebase' },
  { name: 'Lido', category: 'Staking', risk: 'Low-Medium', description: 'Liquid staking for ETH with stETH receipts.', yield: 'Staking yield', audits: 'Multiple audits' },
  { name: 'Curve', category: 'DEX', risk: 'Medium', description: 'Stablecoin and correlated-asset focused AMM.', yield: 'Fees + incentives', audits: 'Multiple audits' },
  { name: 'EigenLayer', category: 'Restaking', risk: 'Medium-High', description: 'Restaking framework to extend economic security.', yield: 'Variable', audits: 'Multiple audits' },
  { name: 'Pendle', category: 'Yield Trading', risk: 'Medium', description: 'Tokenized principal and yield markets.', yield: 'Variable', audits: 'Multiple audits' },
  { name: 'GMX', category: 'Perp DEX', risk: 'Medium', description: 'Perpetuals exchange with GLP/GM pools.', yield: 'Trading + fees', audits: 'Multiple audits' },
  { name: 'Ethena', category: 'Stablecoin', risk: 'Medium-High', description: 'Synthetic dollar using delta-neutral strategy.', yield: 'Variable', audits: 'Multiple audits' },
  { name: '1inch', category: 'Aggregator', risk: 'Low', description: 'DEX aggregation for best execution routes.', yield: 'N/A', audits: 'Multiple audits' }
];

export function searchProtocols(query = '') {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  return PROTOCOLS
    .map((p) => {
      const corpus = `${p.name} ${p.category} ${p.risk} ${p.description} ${p.yield} ${p.audits}`.toLowerCase();
      const score = terms.length
        ? terms.reduce((acc, t) => acc + (corpus.includes(t) ? 1 : 0), 0) / terms.length
        : 0;
      return { ...p, score: Number((score * 100).toFixed(1)) };
    })
    .sort((a, b) => b.score - a.score);
}
